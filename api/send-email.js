export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tipo, ...dados } = req.body || {};
  if (!tipo) return res.status(400).json({ error: 'Campo tipo obrigatório' });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return res.status(500).json({ error: 'RESEND_API_KEY não configurada' });

  const { subject, html } = montarEmail(tipo, dados);
  if (!subject) return res.status(400).json({ error: 'Tipo de email desconhecido: ' + tipo });

  const to = dados.cliente_email || dados.email || dados.profissionalEmail;
  if (!to) return res.status(400).json({ error: 'Destinatário não informado' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Agenda <cortai.contato@gmail.com>', to, subject, html })
  });

  const body = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: body });
  return res.status(200).json({ ok: true, id: body.id });
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmt(v) { return (v / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function baseHtml(conteudo) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a0e06}
  .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .head{background:#E55A0C;padding:28px 32px;text-align:center}
  .head h1{margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-.3px}
  .body{padding:28px 32px}
  .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0ebe5;font-size:14px}
  .row:last-child{border-bottom:none}
  .lbl{color:#7a6456;font-weight:600}
  .val{color:#1a0e06;font-weight:700;text-align:right}
  .btn{display:inline-block;margin-top:20px;padding:14px 28px;background:#E55A0C;color:#fff;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none}
  .footer{text-align:center;font-size:12px;color:#a09080;padding:20px 32px 28px}
</style></head><body>
<div class="wrap">${conteudo}</div>
</body></html>`;
}

function montarEmail(tipo, d) {
  if (tipo === 'confirmacao_agendamento') {
    const cancelUrl = d.cancel_token
      ? `https://agendatop.vercel.app/cancelar.html?token=${encodeURIComponent(d.cancel_token)}`
      : null;
    const sinalHtml = d.sinal_valor > 0
      ? `<div class="row"><span class="lbl">Sinal PIX (${d.sinal_pct || 30}%)</span><span class="val" style="color:#E55A0C">${fmt(d.sinal_valor)}</span></div>
         <div style="background:#fff8f5;border:1px solid #fddcc8;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#7a6456">
           💳 Chave PIX: <strong style="color:#1a0e06">${esc(d.pix_key || '')}</strong>
           ${d.horas_antecedencia ? `<br>Cancelamento gratuito com até <strong>${d.horas_antecedencia}h</strong> de antecedência.` : ''}
         </div>`
      : '';

    return {
      subject: `✅ Agendamento confirmado — ${esc(d.salao_nome)}`,
      html: baseHtml(`
        <div class="head"><h1>${esc(d.servico_ico || '📋')} Agendamento confirmado!</h1></div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px">Olá, <strong>${esc(d.cliente_nome)}</strong>! Seu agendamento está confirmado.</p>
          <div class="row"><span class="lbl">Serviço</span><span class="val">${esc(d.servico_nome)}</span></div>
          <div class="row"><span class="lbl">Salão</span><span class="val">${esc(d.salao_nome)}</span></div>
          ${d.salao_endereco ? `<div class="row"><span class="lbl">Endereço</span><span class="val">${esc(d.salao_endereco)}</span></div>` : ''}
          <div class="row"><span class="lbl">Data</span><span class="val">${esc(d.data)}</span></div>
          <div class="row"><span class="lbl">Horário</span><span class="val">${esc(d.hora)}</span></div>
          ${d.profissional_nome ? `<div class="row"><span class="lbl">Profissional</span><span class="val">${esc(d.profissional_nome)}</span></div>` : ''}
          ${sinalHtml}
          ${cancelUrl ? `<div style="text-align:center"><a class="btn" style="background:#dc2626" href="${cancelUrl}">Cancelar agendamento</a></div>` : ''}
        </div>
        <div class="footer">Você receberá um lembrete 24h antes. Até lá! 🙌</div>
      `)
    };
  }

  if (tipo === 'lembrete_agendamento') {
    const cancelUrl = d.cancel_token
      ? `https://agendatop.vercel.app/cancelar.html?token=${encodeURIComponent(d.cancel_token)}`
      : null;
    return {
      subject: `⏰ Lembrete: amanhã você tem horário em ${esc(d.salao_nome)}`,
      html: baseHtml(`
        <div class="head"><h1>⏰ Lembrete de agendamento</h1></div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px">Olá, <strong>${esc(d.cliente_nome)}</strong>! Não esqueça do seu horário de amanhã.</p>
          <div class="row"><span class="lbl">Serviço</span><span class="val">${esc(d.servico_nome)}</span></div>
          <div class="row"><span class="lbl">Salão</span><span class="val">${esc(d.salao_nome)}</span></div>
          ${d.salao_endereco ? `<div class="row"><span class="lbl">Endereço</span><span class="val">${esc(d.salao_endereco)}</span></div>` : ''}
          <div class="row"><span class="lbl">Data</span><span class="val">${esc(d.data)}</span></div>
          <div class="row"><span class="lbl">Horário</span><span class="val">${esc(d.hora)}</span></div>
          ${d.profissional_nome ? `<div class="row"><span class="lbl">Profissional</span><span class="val">${esc(d.profissional_nome)}</span></div>` : ''}
          ${cancelUrl ? `<div style="text-align:center"><a class="btn" style="background:#dc2626" href="${cancelUrl}">Cancelar agendamento</a></div>` : ''}
        </div>
        <div class="footer">Até amanhã! 💈</div>
      `)
    };
  }

  if (tipo === 'trial_expirando') {
    const dias = d.dias_restantes;
    const urgencia = dias <= 1 ? '🚨' : dias <= 3 ? '⚠️' : '⏳';
    const diasTxt = dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`;
    return {
      subject: `${urgencia} Seu período gratuito termina ${diasTxt} — Agenda`,
      html: baseHtml(`
        <div class="head"><h1>${urgencia} Período gratuito terminando</h1></div>
        <div class="body">
          <p style="margin:0 0 16px;font-size:15px">Olá, <strong>${esc(d.nome_salao || d.responsavel || '')}</strong>!</p>
          <p style="margin:0 0 20px;font-size:14px;color:#5c4033;line-height:1.6">
            Seu período gratuito termina <strong>${diasTxt}</strong>. Assine agora para continuar recebendo agendamentos sem interrupção.
            Seu histórico de agendamentos está preservado.
          </p>
          <div style="text-align:center">
            <a class="btn" href="https://agendatop.vercel.app/painel.html?tab=assinatura">Assinar agora — a partir de R$35/mês</a>
          </div>
        </div>
        <div class="footer">Dúvidas? Responda este email ou fale pelo suporte no app.</div>
      `)
    };
  }

  if (tipo === 'cobranca_gerada') {
    const valorFmt = Number(d.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const vencFmt = new Date(d.vencimento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const planoLabel = { basico: 'Solo', solo: 'Solo', equipe: 'Equipe', pro: 'Equipe', negocio: 'Negócio', salao: 'Negócio' }[d.plano] || d.plano;
    return {
      subject: `💳 Sua assinatura Agenda — ${valorFmt} — vence em ${vencFmt}`,
      html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#F5F5F5;font-family:Arial,sans-serif}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  .hd{background:#0C0A09;padding:28px 32px;text-align:center;font-size:24px;font-weight:800;color:#fff}
  .hd span{color:#E55A0C}
  .bd{padding:32px}
  .alert{background:#FFF5F0;border:1.5px solid #FFD0B8;border-radius:12px;padding:20px 24px;margin-bottom:20px;text-align:center}
  .alert-t{font-size:20px;font-weight:700;color:#E55A0C;margin-bottom:4px}
  .alert-s{font-size:14px;color:#888}
  .card{background:#F8F8F8;border-radius:12px;padding:20px 24px;margin-bottom:16px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #EEE}
  .row:last-child{border-bottom:none}
  .lbl{font-size:13px;color:#888}.val{font-size:14px;font-weight:600;color:#111}
  .pix{background:#F0F9F4;border:1.5px solid #86EFAC;border-radius:10px;padding:16px;margin-bottom:16px;word-break:break-all;font-family:monospace;font-size:12px;color:#166534}
  .btn{display:block;background:#E55A0C;color:#fff;text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;font-size:16px;font-weight:700;margin-bottom:12px}
  .ft{background:#F8F8F8;padding:20px;text-align:center;font-size:12px;color:#AAA}
</style></head><body>
<div class="wrap">
  <div class="hd">Agenda<span>.</span></div>
  <div class="bd">
    <div class="alert">
      <div class="alert-t">Seu período gratuito encerrou</div>
      <div class="alert-s">Olá, ${esc(d.profissionalNome)}! Pague para continuar recebendo agendamentos.</div>
    </div>
    <div class="card">
      <div class="row"><span class="lbl">Plano</span><span class="val">Agenda ${esc(planoLabel)}</span></div>
      <div class="row"><span class="lbl">Valor</span><span class="val" style="color:#E55A0C">${valorFmt}</span></div>
      <div class="row"><span class="lbl">Vencimento</span><span class="val">${vencFmt}</span></div>
      <div class="row"><span class="lbl">Pagamento</span><span class="val">PIX</span></div>
    </div>
    ${d.pixCopiaECola ? `<div class="pix"><strong>PIX Copia e Cola:</strong><br><br>${esc(d.pixCopiaECola)}</div>` : ''}
    ${d.linkPagamento ? `<a href="${d.linkPagamento}" class="btn">Pagar agora via PIX</a>` : ''}
    <p style="font-size:13px;color:#888;text-align:center">Após o pagamento, seu acesso é liberado automaticamente em até 1 minuto.</p>
  </div>
  <div class="ft">© 2026 Agenda</div>
</div></body></html>`
    };
  }

  if (tipo === 'pagamento_confirmado') {
    const valorFmt = Number(d.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const planoLabel = { basico: 'Solo', solo: 'Solo', equipe: 'Equipe', pro: 'Equipe', negocio: 'Negócio', salao: 'Negócio' }[d.plano] || d.plano;
    return {
      subject: `✅ Pagamento confirmado — Agenda ${planoLabel} ativo!`,
      html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#F5F5F5;font-family:Arial,sans-serif}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  .hd{background:#0C0A09;padding:28px 32px;text-align:center;font-size:24px;font-weight:800;color:#fff}
  .hd span{color:#E55A0C}
  .bd{padding:32px;text-align:center}
  .icon{font-size:52px;margin-bottom:16px}
  .title{font-size:22px;font-weight:700;color:#111;margin-bottom:8px}
  .sub{font-size:15px;color:#666;margin-bottom:28px}
  .card{background:#F0F9F4;border:1.5px solid #86EFAC;border-radius:12px;padding:20px;margin-bottom:24px;text-align:left}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(134,239,172,.3)}
  .row:last-child{border-bottom:none}
  .lbl{font-size:13px;color:#166534}.val{font-size:14px;font-weight:600;color:#111}
  .btn{display:block;background:#E55A0C;color:#fff;text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;font-size:16px;font-weight:700}
  .ft{background:#F8F8F8;padding:20px;text-align:center;font-size:12px;color:#AAA}
</style></head><body>
<div class="wrap">
  <div class="hd">Agenda<span>.</span></div>
  <div class="bd">
    <div class="icon">🎉</div>
    <div class="title">Pagamento confirmado!</div>
    <div class="sub">Olá, ${esc(d.profissionalNome)}! Sua conta está ativa e pronta para receber agendamentos.</div>
    <div class="card">
      <div class="row"><span class="lbl">Plano ativo</span><span class="val">Agenda ${esc(planoLabel)}</span></div>
      <div class="row"><span class="lbl">Valor pago</span><span class="val" style="color:#166534">${valorFmt}</span></div>
      <div class="row"><span class="lbl">Próximo vencimento</span><span class="val">${esc(d.proximoVencimento)}</span></div>
    </div>
    <a href="${d.painelUrl || 'https://agendatop.vercel.app/painel.html'}" class="btn">Acessar meu painel</a>
  </div>
  <div class="ft">© 2026 Agenda</div>
</div></body></html>`
    };
  }

  return { subject: null, html: null };
}
