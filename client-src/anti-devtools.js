// anti-devtools.js — friction layer to deter casual inspection.
//
// What this does:
//   1. Suppresses common keyboard shortcuts that open DevTools / view-source
//      (F12, Ctrl/Cmd+Shift+I, J, C, Ctrl/Cmd+U, Ctrl/Cmd+S).
//   2. Suppresses the right-click context menu (which has Inspect / View Source).
//   3. Polls window inner/outer dimensions to detect docked DevTools and
//      shows a magenta banner if it looks open.
//
// What this does NOT do:
//   - Stop a determined user. Anyone who runs `window.addEventListener =
//     () => {}` in the console wins. Browsers also tend to handle F12 at the
//     UI layer before JS sees it, so the shortcut block is best-effort.
//   - Affect game integrity. Scoring/timers/votes are server-authoritative;
//     a tampered client cannot fake a score.

(function () {
  if (typeof document === 'undefined') return;

  // 1. Block common DevTools / view-source / save shortcuts.
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if (k === 'f12') { e.preventDefault(); e.stopPropagation(); return false; }
    var mod = e.ctrlKey || e.metaKey;
    var inspectCombo = mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c');
    var viewSrc = mod && k === 'u';
    var save = mod && k === 's';
    if (inspectCombo || viewSrc || save) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 2. Block right-click (the menu where "Inspect" lives).
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  }, { capture: true });

  // 3. Detect DevTools open (docked) via dimension gap.
  var WARN_ID = '__qq_devtools_warn';
  var THRESHOLD = 160;
  function showWarning() {
    if (document.getElementById(WARN_ID)) return;
    var el = document.createElement('div');
    el.id = WARN_ID;
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'background:#ff2e88',
      'color:#1a0210',
      'font-family:JetBrains Mono, ui-monospace, monospace',
      'font-size:11px',
      'font-weight:700',
      'padding:10px 14px',
      'text-align:center',
      'z-index:2147483647',
      'letter-spacing:0.14em',
      'text-transform:uppercase',
      'box-shadow:0 4px 24px rgba(0,0,0,0.4)',
    ].join(';');
    el.textContent = 'Devtools detected · game state is server-authoritative · tampering will not affect scores';
    (document.body || document.documentElement).appendChild(el);
  }
  function hideWarning() {
    var el = document.getElementById(WARN_ID);
    if (el) el.parentNode.removeChild(el);
  }
  function check() {
    try {
      var w = (window.outerWidth || 0) - (window.innerWidth || 0);
      var h = (window.outerHeight || 0) - (window.innerHeight || 0);
      if (w > THRESHOLD || h > THRESHOLD) showWarning();
      else hideWarning();
    } catch (e) { /* ignore */ }
  }
  setInterval(check, 1000);
  check();
})();
