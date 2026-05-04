// Vercel Serverless Function — dispara cobrança para trials expirados
// Chamado pelo cron diário às 8h ou manualmente com Authorization header

const ASAAS_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3';

const PLANO_VALOR = {
  solo:    35.00,
  basico:  35.00,
  equipe:  70.00,
  pro:     70.00,
  negocio: 140.00,
  salao:   140.00,
};

export default async function handler(req, res) {
  const auth = req.headers['authorization'] || '';
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && auth !== 'Bearer ' + CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPA_URL = 'https://acldrisohnjfekjxgmoh.supabase.co';
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ASAAS_KEY = process.env.ASAAS_API_KEY;

  if (!SUPA_KEY || !ASAAS_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  const H_SUPA = {
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY,
    'Content-Type': 'application/json',
  };
  const H_ASAAS = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_KEY,
  };

  // 1. Buscar salões com trial expirado
  const hoje = new Date().toISOString().split('T')[0];
  const r = await fetch(
    `${SUPA_URL}/rest/v1/saloes?status=eq.trial&trial_expira=lte.${hoje}` +
    `&select=id,nome,slug,email,plano,responsavel,fat_cpf_cnpj,fat_nome,fat_email`,
    { headers: H_SUPA }
  );
  const saloes = await r.json();

  if (!Array.isArray(saloes) || saloes.length === 0) {
    return res.status(200).json({ ok: true, processados: 0, msg: 'Nenhum trial expirado' });
  }

  const resultados = [];

  for (const salao of saloes) {
    try {
      // 2. Verificar se já tem cobrança pendente
      const rCob = await fetch(
        `${SUPA_URL}/rest/v1/asaas_cobrancas?salao_id=eq.${salao.id}&status=eq.PENDING&select=id`,
        { headers: H_SUPA }
      );
      const cobsPendentes = await rCob.json();
      if (Array.isArray(cobsPendentes) && cobsPendentes.length > 0) {
        resultados.push({ slug: salao.slug, ok: false, msg: 'Já tem cobrança pendente' });
        continue;
      }

      // 3. Buscar ou criar cliente Asaas
      const rAc = await fetch(
        `${SUPA_URL}/rest/v1/asaas_clientes?salao_id=eq.${salao.id}&select=asaas_id`,
        { headers: H_SUPA }
      );
      const [asaasCliente] = await rAc.json();
      let asaasId = asaasCliente?.asaas_id;

      if (!asaasId) {
        const cpfCnpj = (salao.fat_cpf_cnpj || '').replace(/\D/g, '');
        if (!cpfCnpj) {
          resultados.push({ slug: salao.slug, ok: false, msg: 'Sem CPF/CNPJ para criar cliente Asaas' });
          continue;
        }
        const rCliente = await fetch(`${ASAAS_URL}/customers`, {
          method: 'POST',
          headers: H_ASAAS,
          body: JSON.stringify({
            name:    salao.fat_nome || salao.nome,
            email:   salao.fat_email || salao.email,
            cpfCnpj: cpfCnpj,
          }),
        });
        const clienteData = await rCliente.json();
        asaasId = clienteData.id;
        if (!asaasId) {
          resultados.push({ slug: salao.slug, ok: false, msg: 'Falha ao criar cliente Asaas', detalhe: clienteData });
          continue;
        }
        await fetch(`${SUPA_URL}/rest/v1/asaas_clientes`, {
          method: 'POST',
          headers: { ...H_SUPA, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({ salao_id: salao.id, asaas_id: asaasId }),
        });
      }

      // 4. Valor e vencimento
      const planoChave = salao.plano === 'trial' ? 'equipe' : (salao.plano || 'equipe');
      const valor = PLANO_VALOR[planoChave] || 70.00;
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 3);
      const vencimentoStr = vencimento.toISOString().split('T')[0];
      const mesRef = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      // 5. Criar cobrança PIX no Asaas
      const rPag = await fetch(`${ASAAS_URL}/payments`, {
        method: 'POST',
        headers: H_ASAAS,
        body: JSON.stringify({
          customer:          asaasId,
          billingType:       'PIX',
          value:             valor,
          dueDate:           vencimentoStr,
          description:       `Assinatura Agenda — Plano ${planoChave} (${mesRef})`,
          externalReference: salao.id,
        }),
      });
      const pagData = await rPag.json();
      if (!pagData.id) {
        resultados.push({ slug: salao.slug, ok: false, msg: 'Falha ao criar cobrança', detalhe: pagData });
        continue;
      }

      // 6. Buscar QR Code PIX (endpoint separado)
      let pixCopiaECola = null;
      try {
        const rQr = await fetch(`${ASAAS_URL}/payments/${pagData.id}/pixQrCode`, { headers: H_ASAAS });
        const qrData = await rQr.json();
        pixCopiaECola = qrData.payload || null;
      } catch (_) {}

      // 7. Salvar cobrança no banco
      await fetch(`${SUPA_URL}/rest/v1/asaas_cobrancas`, {
        method: 'POST',
        headers: H_SUPA,
        body: JSON.stringify({
          salao_id:       salao.id,
          asaas_id:       pagData.id,
          valor:          Math.round(valor * 100),
          tipo:           'PIX',
          status:         'PENDING',
          vencimento:     vencimentoStr,
          descricao:      pagData.description,
          link_pagamento: pagData.invoiceUrl || null,
          pix_copia_cola: pixCopiaECola,
          plano_ref:      planoChave,
        }),
      });

      // 8. Bloquear o salão
      await fetch(`${SUPA_URL}/rest/v1/saloes?id=eq.${salao.id}`, {
        method: 'PATCH',
        headers: H_SUPA,
        body: JSON.stringify({ status: 'bloqueado' }),
      });

      // 9. Email com link de pagamento
      const emailDest = salao.fat_email || salao.email;
      if (emailDest) {
        const base = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://agendatop.vercel.app';
        await fetch(base + '/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo:              'cobranca_gerada',
            profissionalEmail: emailDest,
            profissionalNome:  salao.fat_nome || salao.responsavel || salao.nome,
            valor:             valor,
            vencimento:        vencimentoStr,
            plano:             planoChave,
            linkPagamento:     pagData.invoiceUrl || null,
            pixCopiaECola:     pixCopiaECola,
          }),
        }).catch(() => {});
      }

      resultados.push({ slug: salao.slug, ok: true, cobrancaId: pagData.id, valor });
    } catch (e) {
      resultados.push({ slug: salao.slug, ok: false, msg: e.message });
    }
  }

  return res.status(200).json({ ok: true, processados: resultados.length, resultados });
}
