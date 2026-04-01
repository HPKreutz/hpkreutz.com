// ─── SUPABASE INIT ────────────────────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(
  'https://dnsxkbxpihvrtvrpfmnh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuc3hrYnhwaWh2cnR2cnBmbW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjgyNDgsImV4cCI6MjA5MDY0NDI0OH0.A2-t2Y2oKeEEXjeWUmpA8SthuBAlGLToxw4OH9WYgXM'
);
 
// ─── STATE ────────────────────────────────────────────────────────────────────
let todos = [];
let bets  = [];
let notes = [];
let currentUser = null;
let useCloud = false;
 
// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  setGreeting();
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    await signInUser(session.user);
  } else {
    loadLocal();
    updateAuthUI(null);
  }
}
 
// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
function loadLocal() {
  todos = JSON.parse(localStorage.getItem('hpk-todos') || '[]');
  bets  = JSON.parse(localStorage.getItem('hpk-bets')  || '[]');
  notes = JSON.parse(localStorage.getItem('hpk-notes') || '[]');
  renderAll();
}
 
function saveLocal() {
  if (!useCloud) {
    localStorage.setItem('hpk-todos', JSON.stringify(todos));
    localStorage.setItem('hpk-bets',  JSON.stringify(bets));
    localStorage.setItem('hpk-notes', JSON.stringify(notes));
  }
}
 
// ─── AUTH UI ──────────────────────────────────────────────────────────────────
function updateAuthUI(user) {
  const statusEl = document.getElementById('auth-status');
  const btnEl    = document.getElementById('auth-btn');
  const emailEl  = document.getElementById('user-email-display');
  const banner   = document.getElementById('cloud-banner');
 
  if (user) {
    statusEl.textContent = 'Signed in';
    btnEl.textContent = 'Sign Out';
    btnEl.className = 'auth-sidebar-btn signout';
    emailEl.textContent = user.email;
    if (banner) banner.classList.add('hidden');
  } else {
    statusEl.textContent = 'Guest mode';
    btnEl.textContent = 'Sign In';
    btnEl.className = 'auth-sidebar-btn';
    emailEl.textContent = '';
    if (banner) banner.classList.remove('hidden');
  }
}
 
document.getElementById('auth-btn').addEventListener('click', () => {
  if (currentUser) {
    sb.auth.signOut();
    currentUser = null;
    useCloud = false;
    todos = []; bets = []; notes = [];
    loadLocal();
    updateAuthUI(null);
  } else {
    openModal('auth-modal');
  }
});
 
// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
let authMode = 'login';
 
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    authMode = tab.dataset.auth;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('auth-submit').textContent = authMode === 'login' ? 'Sign In' : 'Create Account';
    document.getElementById('auth-error').textContent = '';
    document.getElementById('auth-name').style.display = authMode === 'signup' ? 'block' : 'none';
  });
});
 
document.getElementById('auth-submit').addEventListener('click', async () => {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name     = document.getElementById('auth-name').value.trim();
  const errEl    = document.getElementById('auth-error');
  const btn      = document.getElementById('auth-submit');
 
  if (!email || !password) { errEl.textContent = 'Please enter email and password.'; return; }
  if (authMode === 'signup' && !name) { errEl.textContent = 'Please enter your first name.'; return; }
 
  btn.disabled = true;
  btn.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';
  errEl.textContent = '';
 
  let result;
  if (authMode === 'login') {
    result = await sb.auth.signInWithPassword({ email, password });
  } else {
    result = await sb.auth.signUp({ email, password });
  }
 
  btn.disabled = false;
  btn.textContent = authMode === 'login' ? 'Sign In' : 'Create Account';
 
  if (result.error) { errEl.textContent = result.error.message; return; }
 
  if (authMode === 'signup') {
    if (!result.data.session) {
      errEl.style.color = 'var(--daccent)';
      errEl.textContent = 'Check your email to confirm your account!';
      return;
    }
    await sb.from('profiles').insert({ id: result.data.user.id, first_name: name });
  }
 
  closeModal('auth-modal');
  await signInUser(result.data.user);
});
 
async function signInUser(user) {
  currentUser = user;
  useCloud = true;
  const { data: profile } = await sb.from('profiles').select('first_name').eq('id', user.id).single();
  const name = profile?.first_name || user.email.split('@')[0];
  setGreeting(name);
  updateAuthUI(user);
  await loadCloud();
}
 
// ─── CLOUD DATA ───────────────────────────────────────────────────────────────
async function loadCloud() {
  const [t, b, n] = await Promise.all([
    sb.from('todos').select('*').order('created_at', { ascending: false }),
    sb.from('bets').select('*').order('created_at', { ascending: false }),
    sb.from('notes').select('*').order('created_at', { ascending: false })
  ]);
  todos = t.data || [];
  bets  = b.data || [];
  notes = n.data || [];
  renderAll();
}
 
// ─── GREETING ─────────────────────────────────────────────────────────────────
function setGreeting(name) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = name ? greet + ', ' + name + '.' : greet + '.';
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date-display').textContent = new Date().toLocaleDateString('en-US', opts);
}
 
// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
}
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
 
// ─── RENDER ALL ───────────────────────────────────────────────────────────────
function renderAll() {
  renderHome();
  renderTodos();
  renderBets();
  renderNotes();
}
 
// ─── TODO ─────────────────────────────────────────────────────────────────────
let todoFilter = 'all';
 
function renderTodos() {
  const list = document.getElementById('todo-list');
  let filtered = todos;
  if (todoFilter === 'work')     filtered = todos.filter(t => t.cat === 'work' && !t.done);
  if (todoFilter === 'personal') filtered = todos.filter(t => t.cat === 'personal' && !t.done);
  if (todoFilter === 'done')     filtered = todos.filter(t => t.done);
  if (todoFilter === 'all')      filtered = todos.filter(t => !t.done);
 
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><span>✓</span>Nothing here — add a task above!</div>';
    updateStats(); return;
  }
  list.innerHTML = filtered.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}">
      <div class="todo-check ${t.done ? 'checked' : ''}" onclick="toggleTodo('${t.id}', ${t.done})"></div>
      <span class="todo-text">${escHtml(t.text)}</span>
      <div class="todo-meta">
        ${t.date ? `<span class="todo-date">${t.date}</span>` : ''}
        <span class="tag tag-${t.cat}">${t.cat}</span>
      </div>
      <button class="delete-btn" onclick="deleteTodo('${t.id}')">×</button>
    </div>
  `).join('');
  updateStats();
}
 
async function toggleTodo(id, done) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.done = !done;
  if (useCloud) await sb.from('todos').update({ done: !done }).eq('id', id);
  else saveLocal();
  renderTodos(); renderHome();
}
 
async function deleteTodo(id) {
  todos = todos.filter(x => x.id !== id);
  if (useCloud) await sb.from('todos').delete().eq('id', id);
  else saveLocal();
  renderTodos(); renderHome();
}
 
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    todoFilter = btn.dataset.filter;
    renderTodos();
  });
});
 
document.getElementById('open-todo-modal').addEventListener('click', () => openModal('todo-modal'));
document.getElementById('save-todo').addEventListener('click', async () => {
  const text = document.getElementById('todo-input').value.trim();
  if (!text) return;
  const item = {
    id: Date.now().toString(),
    text,
    cat:  document.getElementById('todo-cat').value,
    date: document.getElementById('todo-date').value,
    done: false
  };
  if (useCloud) {
    const { data } = await sb.from('todos').insert({ ...item, user_id: currentUser.id }).select().single();
    if (data) { item.id = data.id; todos.unshift(data); }
  } else {
    todos.unshift(item);
    saveLocal();
  }
  renderTodos(); renderHome();
  closeModal('todo-modal');
  document.getElementById('todo-input').value = '';
  document.getElementById('todo-date').value = '';
});
 
// ─── BETS ─────────────────────────────────────────────────────────────────────
function renderBets() {
  const list = document.getElementById('bet-list');
  if (bets.length === 0) {
    list.innerHTML = '<div class="empty-state"><span>🎯</span>No bets tracked yet!</div>';
  } else {
    list.innerHTML = bets.map(b => `
      <div class="bet-item">
        <span class="sport-badge">${escHtml(b.sport)}</span>
        <div class="bet-info">
          <div class="bet-matchup-text">${escHtml(b.matchup)}</div>
          <div class="bet-pick-text">Pick: ${escHtml(b.pick || '')} · Odds: ${escHtml(b.odds || '')}</div>
        </div>
        <div class="bet-right">
          <span class="bet-amount">$${parseFloat(b.amount || 0).toFixed(2)}</span>
          <span class="tag tag-${b.result}">${b.result}</span>
          <button class="delete-btn" onclick="deleteBet('${b.id}')">×</button>
        </div>
      </div>
    `).join('');
  }
  updateBetStats();
}
 
async function deleteBet(id) {
  bets = bets.filter(x => x.id !== id);
  if (useCloud) await sb.from('bets').delete().eq('id', id);
  else saveLocal();
  renderBets(); renderHome();
}
 
function updateBetStats() {
  const won  = bets.filter(b => b.result === 'won');
  const lost = bets.filter(b => b.result === 'lost');
  const totalWon  = won.reduce((s, b) => s + calcPayout(b.amount, b.odds), 0);
  const totalLost = lost.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const net   = totalWon - totalLost;
  const total = won.length + lost.length;
  const rate  = total > 0 ? Math.round((won.length / total) * 100) : 0;
  document.getElementById('bet-won').textContent  = '$' + totalWon.toFixed(2);
  document.getElementById('bet-lost').textContent = '$' + totalLost.toFixed(2);
  document.getElementById('bet-net').textContent  = (net >= 0 ? '+$' : '-$') + Math.abs(net).toFixed(2);
  document.getElementById('bet-rate').textContent = rate + '%';
}
 
function calcPayout(amount, odds) {
  const a = parseFloat(amount || 0);
  const o = parseInt(odds || 0);
  if (o > 0) return a * (o / 100);
  if (o < 0) return a * (100 / Math.abs(o));
  return 0;
}
 
document.getElementById('open-bet-modal').addEventListener('click', () => openModal('bet-modal'));
document.getElementById('save-bet').addEventListener('click', async () => {
  const matchup = document.getElementById('bet-matchup').value.trim();
  if (!matchup) return;
  const item = {
    id: Date.now().toString(),
    matchup,
    sport:  document.getElementById('bet-sport').value,
    pick:   document.getElementById('bet-pick').value.trim(),
    odds:   document.getElementById('bet-odds').value.trim(),
    amount: document.getElementById('bet-amount').value,
    result: document.getElementById('bet-result').value
  };
  if (useCloud) {
    const { data } = await sb.from('bets').insert({ ...item, user_id: currentUser.id }).select().single();
    if (data) bets.unshift(data);
  } else {
    bets.unshift(item);
    saveLocal();
  }
  renderBets(); renderHome();
  closeModal('bet-modal');
  ['bet-matchup','bet-pick','bet-odds','bet-amount'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bet-result').value = 'pending';
});
 
// ─── NOTES ────────────────────────────────────────────────────────────────────
function renderNotes() {
  const list = document.getElementById('note-list');
  if (notes.length === 0) {
    list.innerHTML = '<div class="empty-state"><span>📋</span>No work notes yet!</div>';
    return;
  }
  list.innerHTML = notes.map(n => `
    <div class="note-card">
      <button class="note-delete" onclick="deleteNote('${n.id}')">×</button>
      <div class="note-card-title">${escHtml(n.title)}</div>
      <div class="note-card-body">${escHtml(n.body || '')}</div>
      <div class="note-card-footer"><span class="tag tag-${n.tag}">${n.tag}</span></div>
    </div>
  `).join('');
}
 
async function deleteNote(id) {
  notes = notes.filter(x => x.id !== id);
  if (useCloud) await sb.from('notes').delete().eq('id', id);
  else saveLocal();
  renderNotes();
}
 
document.getElementById('open-note-modal').addEventListener('click', () => openModal('note-modal'));
document.getElementById('save-note').addEventListener('click', async () => {
  const title = document.getElementById('note-title').value.trim();
  if (!title) return;
  const item = {
    id: Date.now().toString(),
    title,
    body: document.getElementById('note-body').value.trim(),
    tag:  document.getElementById('note-tag').value
  };
  if (useCloud) {
    const { data } = await sb.from('notes').insert({ ...item, user_id: currentUser.id }).select().single();
    if (data) notes.unshift(data);
  } else {
    notes.unshift(item);
    saveLocal();
  }
  renderNotes();
  closeModal('note-modal');
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value = '';
});
 
// ─── HOME ─────────────────────────────────────────────────────────────────────
function renderHome() {
  const homeTodos = document.getElementById('home-todos');
  const recent = todos.filter(t => !t.done).slice(0, 4);
  if (recent.length === 0) {
    homeTodos.innerHTML = '<div style="color:var(--dmuted);font-size:13px;padding:8px 0;">No open tasks — you\'re all caught up!</div>';
  } else {
    homeTodos.innerHTML = recent.map(t => `
      <div class="todo-item" style="background:var(--dbg3);margin-bottom:6px;">
        <div class="todo-check ${t.done ? 'checked' : ''}" onclick="toggleTodo('${t.id}', ${t.done})"></div>
        <span class="todo-text" style="font-size:13px;">${escHtml(t.text)}</span>
        <span class="tag tag-${t.cat}">${t.cat}</span>
      </div>
    `).join('');
  }
  const homeBets = document.getElementById('home-bets');
  const recentBets = bets.slice(0, 4);
  if (recentBets.length === 0) {
    homeBets.innerHTML = '<div style="color:var(--dmuted);font-size:13px;padding:8px 0;">No bets tracked yet.</div>';
  } else {
    homeBets.innerHTML = recentBets.map(b => `
      <div class="bet-item" style="background:var(--dbg3);margin-bottom:6px;">
        <span class="sport-badge">${escHtml(b.sport)}</span>
        <div class="bet-info"><div class="bet-matchup-text" style="font-size:13px;">${escHtml(b.matchup)}</div></div>
        <span class="tag tag-${b.result}">${b.result}</span>
      </div>
    `).join('');
  }
  updateStats();
}
 
function updateStats() {
  document.getElementById('stat-tasks').textContent    = todos.filter(t => !t.done).length;
  document.getElementById('stat-done').textContent     = todos.filter(t => t.done).length;
  document.getElementById('stat-work').textContent     = todos.filter(t => t.cat === 'work' && !t.done).length;
  document.getElementById('stat-personal').textContent = todos.filter(t => t.cat === 'personal' && !t.done).length;
}
 
// ─── MODALS ───────────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
 
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});
 
// ─── UTILS ────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
 
// ─── START ────────────────────────────────────────────────────────────────────
init();
