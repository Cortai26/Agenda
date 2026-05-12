window.toast = function(type, title, msg, ms) {
  // Compat: old signature was toast(message, 'ok'|'err'|'warn')
  var legacyMap = { ok: 'success', err: 'error', warn: 'info' };
  if (title in legacyMap) {
    var oldType = legacyMap[title];
    title = type;
    type = oldType;
    msg = undefined;
  } else if (title === undefined || title === null) {
    // Single-arg call: toast('message') → treat as success
    title = type;
    type = 'success';
  }
  ms = ms || 3000;
  var stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  var icons = { success: '✓', error: '✕', info: '!' };
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
