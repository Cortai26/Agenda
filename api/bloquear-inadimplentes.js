// Cron diário às 9h — bloqueia salões inadimplentes
// Critérios:
//   A) asaas_cobrancas PENDING/OVERDUE com vencimento há mais de 3 dias
//   B) saloes.vencimento expirado há mais de 3 dias e status='ativo' (cobre assinaturas recorrentes sem nova cobrança criada)

export default async function handler(req, res) {
  const auth = req.headers['authorization'] || '';
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) return res.status(500).json({ error: 'CRON_SECRET não configurado' });
  if (auth !== 'Bearer ' + CRON_SECRET) {
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

  // Conjunto de salao_ids a bloquear
  const idsBloqueio = new Set();

  // A) Cobranças vencidas há mais de 3 dias e ainda PENDING/OVERDUE
  try {
    const rCob = await fetch(
      `${SUPA_URL}/rest/v1/asaas_cobrancas?status=in.(PENDING,OVERDUE)&vencimento=lt.${toleranciaStr}&select=salao_id`,
      { headers: H }
    );
    const cobrancas = await rCob.json();
    if (Array.isArray(cobrancas)) {
      cobrancas.forEach(c => c.salao_id && idsBloqueio.add(c.salao_id));
    }
  } catch (_) {}

  // B) Salões ativos cujo vencimento na tabela saloes já passou há mais de 3 dias
  // NULL comparisons already excluded by PostgreSQL (NULL < X = NULL, not true)
  try {
    const rSal = await fetch(
      `${SUPA_URL}/rest/v1/saloes?status=eq.ativo&vencimento=lt.${toleranciaStr}&select=id`,
      { headers: H }
    );
    const salVenc = await rSal.json();
    if (Array.isArray(salVenc)) {
      salVenc.forEach(s => s.id && idsBloqueio.add(s.id));
    }
  } catch (_) {}

  if (idsBloqueio.size === 0) {
    return res.status(200).json({ ok: true, bloqueados: 0, msg: 'Nenhum inadimplente' });
  }

  // Buscar salões ativos (não bloquear quem já está bloqueado)
  const idsArr = [...idsBloqueio];
  const rAtivos = await fetch(
    `${SUPA_URL}/rest/v1/saloes?id=in.(${idsArr.join(',')})&status=in.(ativo,trial)&select=id,slug`,
    { headers: H }
  );
  const ativos = await rAtivos.json();

  if (!Array.isArray(ativos) || ativos.length === 0) {
    return res.status(200).json({ ok: true, bloqueados: 0, msg: 'Nenhum salão ativo inadimplente' });
  }

  const bloqueados = [];
  for (const salao of ativos) {
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
