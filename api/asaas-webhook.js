// Webhook do Asaas — libera acesso após pagamento confirmado
// Configurar no painel Asaas → Integrações → Webhook
// URL: https://agendatop.vercel.app/api/asaas-webhook
// Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const evento = req.body;

  if (!['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(evento?.event)) {
    return res.status(200).json({ ok: true, ignorado: true, event: evento?.event });
  }

  const pagamento = evento.payment;
  if (!pagamento?.id) return res.status(400).json({ error: 'Payload inválido' });

  const SUPA_URL = 'https://acldrisohnjfekjxgmoh.supabase.co';
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPA_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY não configurada' });

  const H = {
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY,
    'Content-Type': 'application/json',
  };

  // 1. Buscar cobrança pelo asaas_id
  const rCob = await fetch(
    `${SUPA_URL}/rest/v1/asaas_cobrancas?asaas_id=eq.${pagamento.id}&select=id,salao_id,valor,plano_ref`,
    { headers: H }
  );
  const [cobranca] = await rCob.json();

  if (!cobranca) {
    return res.status(200).json({ ok: true, msg: 'Cobrança não encontrada, ignorando' });
  }

  // 2. Atualizar status da cobrança
  await fetch(`${SUPA_URL}/rest/v1/asaas_cobrancas?id=eq.${cobranca.id}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ status: 'RECEIVED', pago_em: new Date().toISOString() }),
  });

  // 3. Buscar salão
  const rSalao = await fetch(
    `${SUPA_URL}/rest/v1/saloes?id=eq.${cobranca.salao_id}&select=id,nome,slug,email,fat_nome,fat_email,plano`,
    { headers: H }
  );
  const [salao] = await rSalao.json();
  if (!salao) return res.status(200).json({ ok: true, msg: 'Salão não encontrado' });

  // 4. Determinar plano pelo valor pago (fallback: plano_ref da cobrança)
  const valorPago = pagamento.value || 0;
  let planoAtivo = cobranca.plano_ref || 'equipe';
  if (!cobranca.plano_ref) {
    if (valorPago <= 35)       planoAtivo = 'basico';
    else if (valorPago <= 70)  planoAtivo = 'equipe';
    else                       planoAtivo = 'negocio';
  }

  // 5. Próximo vencimento: 30 dias
  const proximoVenc = new Date();
  proximoVenc.setDate(proximoVenc.getDate() + 30);
  const proximoVencFmt = proximoVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // 6. Ativar salão
  await fetch(`${SUPA_URL}/rest/v1/saloes?id=eq.${cobranca.salao_id}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      status:            'ativo',
      plano:             planoAtivo,
      pagamento:         'mensal',
      assinatura_status: 'ACTIVE',
      trial_expira:      null,
    }),
  });

  // 7. Email de confirmação
  const emailDest = salao.fat_email || salao.email;
  if (emailDest) {
    const base = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://agendatop.vercel.app';
    await fetch(base + '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo:              'pagamento_confirmado',
        profissionalEmail: emailDest,
        profissionalNome:  salao.fat_nome || salao.nome,
        plano:             planoAtivo,
        valor:             valorPago,
        proximoVencimento: proximoVencFmt,
        painelUrl:         'https://agendatop.vercel.app/painel.html',
      }),
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true, salao: salao.slug, plano: planoAtivo });
}
