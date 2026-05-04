// Cron diário às 9h — bloqueia salões inadimplentes
// Critérios: asaas_cobrancas PENDING/OVERDUE com vencimento há mais de 3 dias

export default async function handler(req, res) {
  const auth = req.headers['authorization'] || '';
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && auth !== 'Bearer ' + CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPA_URL = 'https://acldrisohnjfekjxgmoh.supabase.co';
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPA_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY não configurada' });

  const H = { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };

  // Prazo de tolerância: 3 dias após vencimento
  const tolerancia = new Date();
  tolerancia.setDate(tolerancia.getDate() - 3);
  const toleranciaStr = tolerancia.toISOString().split('T')[0];

  // Buscar cobranças vencidas há mais de 3 dias e ainda PENDING
  const rCob = await fetch(
    `${SUPA_URL}/rest/v1/asaas_cobrancas?status=in.(PENDING,OVERDUE)&vencimento=lt.${toleranciaStr}&select=salao_id`,
    { headers: H }
  );
  const cobrancas = await rCob.json();

  if (!Array.isArray(cobrancas) || cobrancas.length === 0) {
    return res.status(200).json({ ok: true, bloqueados: 0, msg: 'Nenhum inadimplente' });
  }

  // Deduplica salao_ids
  const salaoIds = [...new Set(cobrancas.map(c => c.salao_id).filter(Boolean))];

  // Buscar salões ativos (não bloquear quem já está bloqueado/cancelado)
  const rSal = await fetch(
    `${SUPA_URL}/rest/v1/saloes?id=in.(${salaoIds.join(',')})&status=in.(ativo,trial)&select=id,slug,status`,
    { headers: H }
  );
  const saloes = await rSal.json();

  if (!Array.isArray(saloes) || saloes.length === 0) {
    return res.status(200).json({ ok: true, bloqueados: 0, msg: 'Nenhum salão ativo inadimplente' });
  }

  const bloqueados = [];
  for (const salao of saloes) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/saloes?id=eq.${salao.id}`, {
        method: 'PATCH',
        headers: { ...H, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'bloqueado' }),
      });
      bloqueados.push(salao.slug);
    } catch (_) {}
  }

  return res.status(200).json({ ok: true, bloqueados: bloqueados.length, slugs: bloqueados });
}
