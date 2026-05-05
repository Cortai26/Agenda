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

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const dataStr = amanha.toISOString().slice(0, 10);

  const H = { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY };

  const r = await fetch(
    `${SUPA_URL}/rest/v1/agendamentos?data=eq.${dataStr}&status=eq.confirmado&cliente_email=not.is.null&select=id,hora,servico_nome,cliente_nome,cliente_email,cancel_token,salao_id`,
    { headers: H }
  );
  if (!r.ok) return res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  const ags = await r.json();

  const salaoIds = [...new Set(ags.map(a => a.salao_id))];
  const saloes = {};
  if (salaoIds.length) {
    const sr = await fetch(
      `${SUPA_URL}/rest/v1/saloes?id=in.(${salaoIds.join(',')})&select=id,nome,endereco`,
      { headers: H }
    );
    const sl = await sr.json();
    sl.forEach(s => { saloes[s.id] = s; });
  }

  const base = process.env.VERCEL_URL
    ? 'https://' + process.env.VERCEL_URL
    : 'https://agendatop.vercel.app';

  let enviados = 0;
  let erros = 0;
  for (const ag of ags) {
    const sal = saloes[ag.salao_id] || {};
    try {
      const er = await fetch(base + '/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CRON_SECRET },
        body: JSON.stringify({
          tipo: 'lembrete_agendamento',
          cliente_email: ag.cliente_email,
          cliente_nome: ag.cliente_nome || 'cliente',
          salao_nome: sal.nome || '',
          salao_endereco: sal.endereco || '',
          servico_nome: ag.servico_nome || '',
          data: new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
          hora: ag.hora ? ag.hora.slice(0, 5) : '',
          cancel_token: ag.cancel_token || null
        })
      });
      if (er.ok) enviados++; else erros++;
    } catch (_) {
      erros++;
    }
  }

  return res.status(200).json({ ok: true, data: dataStr, total: ags.length, enviados, erros });
}
