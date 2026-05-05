// Reconciliation cron — catches payments that Asaas confirmed but webhook missed
// Runs hourly; also callable manually via admin button
// POST /api/sincronizar-pagamentos  (admin use, no auth required beyond CRON_SECRET)
// GET  /api/sincronizar-pagamentos  (cron)

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) return res.status(500).json({ error: 'CRON_SECRET não configurado' });
  const token = req.headers['authorization']?.replace('Bearer ', '') ||
                req.headers['x-cron-secret'];
  if (token !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPA_URL = 'https://acldrisohnjfekjxgmoh.supabase.co';
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPA_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY não configurada' });

  const ASAAS_KEY = process.env.ASAAS_API_KEY;
  if (!ASAAS_KEY) return res.status(500).json({ error: 'ASAAS_API_KEY não configurada' });

  const ASAAS_URL = process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3';

  const H = {
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY,
    'Content-Type': 'application/json',
  };

  // 1. Buscar todas as cobranças PENDING no banco
  const rPending = await fetch(
    `${SUPA_URL}/rest/v1/asaas_cobrancas?status=in.(PENDING,OVERDUE)&asaas_id=not.is.null&select=id,asaas_id,salao_id,plano_ref,valor`,
    { headers: H }
  );
  const pendentes = await rPending.json();

  if (!Array.isArray(pendentes) || pendentes.length === 0) {
    return res.status(200).json({ ok: true, sincronizados: 0, pendentes: 0 });
  }

  const base = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://agendatop.vercel.app';
  const resultados = [];

  for (const cob of pendentes) {
    try {
      // 2. Consultar status real no Asaas
      const rAsaas = await fetch(`${ASAAS_URL}/payments/${cob.asaas_id}`, {
        headers: { 'access_token': ASAAS_KEY },
      });

      if (!rAsaas.ok) {
        resultados.push({ asaas_id: cob.asaas_id, resultado: 'erro_asaas', status: rAsaas.status });
        continue;
      }

      const pagamento = await rAsaas.json();
      const statusAsaas = pagamento.status; // PENDING, RECEIVED, CONFIRMED, OVERDUE, etc.

      if (!['RECEIVED', 'CONFIRMED'].includes(statusAsaas)) {
        resultados.push({ asaas_id: cob.asaas_id, resultado: 'ainda_pendente', status: statusAsaas });
        continue;
      }

      // 3. Pagamento confirmado no Asaas — atualizar DB
      await fetch(`${SUPA_URL}/rest/v1/asaas_cobrancas?id=eq.${cob.id}`, {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ status: 'RECEIVED', pago_em: new Date().toISOString() }),
      });

      // 4. Buscar salão
      const rSalao = await fetch(
        `${SUPA_URL}/rest/v1/saloes?id=eq.${cob.salao_id}&select=id,nome,slug,email,fat_nome,fat_email,plano`,
        { headers: H }
      );
      const [salao] = await rSalao.json();
      if (!salao) {
        resultados.push({ asaas_id: cob.asaas_id, resultado: 'salao_nao_encontrado' });
        continue;
      }

      // 5. Determinar plano
      const PLANO_VALOR = { solo: 35, basico: 35, equipe: 70, pro: 70, negocio: 140, salao: 140 };
      let planoAtivo = cob.plano_ref || 'basico';
      if (!cob.plano_ref) {
        const v = (cob.valor || 0) / 100;
        if (v <= 35) planoAtivo = 'basico';
        else if (v <= 70) planoAtivo = 'equipe';
        else planoAtivo = 'negocio';
      }

      // 6. Ativar salão
      const proximoVencSync = new Date();
      proximoVencSync.setDate(proximoVencSync.getDate() + 30);
      await fetch(`${SUPA_URL}/rest/v1/saloes?id=eq.${cob.salao_id}`, {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({
          status: 'ativo',
          plano: planoAtivo,
          pagamento: 'mensal',
          assinatura_status: 'ACTIVE',
          trial_expira: null,
          vencimento: proximoVencSync.toISOString().split('T')[0],
        }),
      });

      // 7. Email de confirmação
      const emailDest = salao.fat_email || salao.email;
      if (emailDest) {
        const proximoVenc = new Date();
        proximoVenc.setDate(proximoVenc.getDate() + 30);
        const proximoVencFmt = proximoVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        await fetch(base + '/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'pagamento_confirmado',
            profissionalEmail: emailDest,
            profissionalNome: salao.fat_nome || salao.nome,
            plano: planoAtivo,
            valor: (cob.valor || 0) / 100,
            proximoVencimento: proximoVencFmt,
            painelUrl: 'https://agendatop.vercel.app/painel.html',
          }),
        }).catch(() => {});
      }

      resultados.push({ asaas_id: cob.asaas_id, resultado: 'ativado', salao: salao.slug, plano: planoAtivo });
    } catch (err) {
      resultados.push({ asaas_id: cob.asaas_id, resultado: 'erro', erro: err.message });
    }
  }

  const ativados = resultados.filter(r => r.resultado === 'ativado').length;
  return res.status(200).json({ ok: true, pendentes: pendentes.length, sincronizados: ativados, detalhes: resultados });
}
