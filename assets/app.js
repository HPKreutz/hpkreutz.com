// ===== Shared across every page =====

// Footer year
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Highlight current page in nav
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.pages a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
});

// Clock (top right)
function hkTick() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  el.innerHTML =
    now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + '<br>' +
    now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
hkTick();
setInterval(hkTick, 30000);

// Ticker builder — pass an array of {label, value, cls}
function hkBuildTicker(items) {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const html = items.map(i =>
    `<span class="tick ${i.cls || ''}"><span class="dot">▸</span><span class="lbl">${i.label}</span>${i.value}</span>`
  ).join('');
  track.innerHTML = html + html; // doubled for seamless scroll loop
}

// ===== To-do storage helpers (shared by index.html + todo.html) =====
function hkGetTodos() {
  try { return JSON.parse(localStorage.getItem('hk_todos') || '[]'); }
  catch (e) { return []; }
}
function hkSaveTodos(items) {
  localStorage.setItem('hk_todos', JSON.stringify(items));
}
