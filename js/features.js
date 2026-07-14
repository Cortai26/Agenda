// js/features.js — Feature Flags do Agenda
// Mudar um valor aqui afeta todo o produto — sem deploy necessário

const FEATURES = {
  // agendar.html (cliente final)
  EMAIL_FIELD:         false,  // campo email no formulário
  ICS_BUTTON:          true,   // botão "salvar na agenda"
  WHATSAPP_BUTTON:     true,   // botão WhatsApp pós-agendamento
  PROFISSIONAL_SELECT: true,   // seleção de profissional
  LISTA_ESPERA:        false,  // lista de espera quando lotado
  AGENDA_FORCADA:      false,  // força cliente a usar o app (futuro)

  // painel.html (estabelecimento)
  MARKETPLACE:         false,  // aba marketplace no painel
  CAMPANHAS:           true,   // aba campanhas
  COMISSAO:            true,   // gestão de comissão
  RELATORIOS:          true,   // relatórios

  // admin.html
  ADMIN_FUNIL:         true,
  ADMIN_SALOES:        true,
  ADMIN_MARKETPLACE:   true,   // aba marketplace no admin (sempre visível para você)
  ADMIN_PUSH_NOTIF:    true,   // botão de ativar notificações no admin
};

window.FEATURES = FEATURES;

window.isFeatureEnabled = function(flag) {
  return FEATURES[flag] === true;
};

window.applyFeatureFlag = function(flag, selector) {
  const els = typeof selector === 'string'
    ? document.querySelectorAll(selector)
    : [selector];
  els.forEach(el => {
    if (el) el.style.display = isFeatureEnabled(flag) ? '' : 'none';
  });
};

document.addEventListener('DOMContentLoaded', () => {
  applyFeatureFlag('EMAIL_FIELD',      '#email-field-container, .campo-email, #campoEmail');
  applyFeatureFlag('MARKETPLACE',      '#tab-marketplace, #pane-marketplace, [data-feature="marketplace"]');
  applyFeatureFlag('ADMIN_PUSH_NOTIF', '#admin-push-section');
});
