window.toast = function(type, title, msg, ms) {
  // Backwards-compat: old calls were toast(message, 'ok'|'err'|'warn')
  var legacyMap = { ok: 'success', err: 'error', warn: 'info' };
  if (title in legacyMap) {
    var oldType = legacyMap[title];
    title = type;
    type = oldType;
    msg = undefined;
  }
  ms = ms || 3500;
  var stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  var icons = { success: '✓', error: '✕', info: 'ℹ' };
  var t = document.createElement('div');
  t.className = 'toast toast--' + type;
  t.innerHTML = '<div class="toast__icon">' + (icons[type] || '·') + '</div>'
    + '<div class="toast__body"><div class="toast__title">' + title + '</div>'
    + (msg ? '<div class="toast__msg">' + msg + '</div>' : '') + '</div>';
  stack.appendChild(t);
  setTimeout(function() {
    t.classList.add('toast--out');
    setTimeout(function() { t.remove(); }, 250);
  }, ms);
};
