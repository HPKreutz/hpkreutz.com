// ─── STATE ───────────────────────────────────────────────────────────────────
let todos = JSON.parse(localStorage.getItem('hpk-todos') || '[]');
let bets  = JSON.parse(localStorage.getItem('hpk-bets')  || '[]');
let notes = JSON.parse(localStorage.getItem('hpk-notes') || '[]');
 
function save() {
  localStorage.setItem('hpk-todos', JSON.stringify(todos));
  localStorage.setItem('hpk-bets',  JSON.stringify(bets));
  localStorage.setItem('hpk-notes', JSON.stringify(notes));
}
 
// ─── GREETING & DATE ─────────────────────────────────────────────────────────
function setGreeting() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greet + ', Hayden.';
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date-display').textContent = new Date().toLocaleDateString('en-US', opts);
}
 
// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
  if (name === 'home') renderHome();
}
 
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
 
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
    return;
  }
 
  list.innerHTML = filtered.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="todo-check ${t.done ? 'checked' : ''}" onclick="toggleTodo('${t.id}')"></div>
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
 
function toggleTodo(id) {
  const t = todos.find(x => x.id === id);
  if (t) { t.done = !t.done; save(); renderTodos(); renderHome(); }
}
 
function deleteTodo(id) {
  todos = todos.filter(x => x.id !== id);
  save(); renderTodos(); renderHome();
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
document.getElementById('save-todo').addEventListener('click', () => {
  const text = document.getElementById('todo-input').value.trim();
  if (!text) return;
  todos.unshift({
    id: Date.now().toString(),
    text,
    cat: document.getElementById('todo-cat').value,
    date: document.getElementById('todo-date').value,
    done: false
  });
  save(); renderTodos(); renderHome();
  closeModal('todo-modal');
  document.getElementById('todo-input').value = '';
  document.getElementById('todo-date').value = '';
});
 
// ─── BETS ─────────────────────────────────────────────────────────────────────
function renderBets() {
  const list = document.getElementById('bet-list');
  if (bets.length === 0) {
    list.innerHTML = '<div class="empty-state"><span>🎯</span>No bets tracked yet — add your first pick!</div>';
  } else {
    list.innerHTML = bets.map(b => `
      <div class="bet-item">
        <span class="sport-badge">${escHtml(b.sport)}</span>
        <div class="bet-info">
          <div class="bet-matchup-text">${escHtml(b.matchup)}</div>
          <div class="bet-pick-text">Pick: ${escHtml(b.pick)} &nbsp;·&nbsp; Odds: ${escHtml(b.odds)}</div>
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
 
function deleteBet(id) {
  bets = bets.filter(x => x.id !== id);
  save(); renderBets(); renderHome();
}
 
function updateBetStats() {
  const won  = bets.filter(b => b.result === 'won');
  const lost = bets.filter(b => b.result === 'lost');
  const totalWon  = won.reduce((s, b)  => s + calcPayout(b.amount, b.odds), 0);
  const totalLost = lost.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const net  = totalWon - totalLost;
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
document.getElementById('save-bet').addEventListener('click', () => {
  const matchup = document.getElementById('bet-matchup').value.trim();
  if (!matchup) return;
  bets.unshift({
    id: Date.now().toString(),
    matchup,
    sport:  document.getElementById('bet-sport').value,
    pick:   document.getElementById('bet-pick').value.trim(),
    odds:   document.getElementById('bet-odds').value.trim(),
    amount: document.getElementById('bet-amount').value,
    result: document.getElementById('bet-result').value
  });
  save(); renderBets(); renderHome();
  closeModal('bet-modal');
  ['bet-matchup','bet-pick','bet-odds','bet-amount'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bet-result').value = 'pending';
});
 
// ─── NOTES ────────────────────────────────────────────────────────────────────
function renderNotes() {
  const list = document.getElementById('note-list');
  if (notes.length === 0) {
    list.innerHTML = '<div class="empty-state"><span>📋</span>No work notes yet — add your first one!</div>';
    return;
  }
  list.innerHTML = notes.map(n => `
    <div class="note-card">
      <button class="note-delete" onclick="deleteNote('${n.id}')">×</button>
      <div class="note-card-title">${escHtml(n.title)}</div>
      <div class="note-card-body">${escHtml(n.body)}</div>
      <div class="note-card-footer">
        <span class="tag tag-${n.tag}">${n.tag}</span>
      </div>
    </div>
  `).join('');
}
 
function deleteNote(id) {
  notes = notes.filter(x => x.id !== id);
  save(); renderNotes();
}
 
document.getElementById('open-note-modal').addEventListener('click', () => openModal('note-modal'));
document.getElementById('save-note').addEventListener('click', () => {
  const title = document.getElementById('note-title').value.trim();
  if (!title) return;
  notes.unshift({
    id: Date.now().toString(),
    title,
    body: document.getElementById('note-body').value.trim(),
    tag:  document.getElementById('note-tag').value
  });
  save(); renderNotes();
  closeModal('note-modal');
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value = '';
});
 
// ─── HOME ─────────────────────────────────────────────────────────────────────
function renderHome() {
  // Recent todos
  const homeTodos = document.getElementById('home-todos');
  const recent = todos.filter(t => !t.done).slice(0, 4);
  if (recent.length === 0) {
    homeTodos.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0;">No open tasks — you\'re all caught up!</div>';
  } else {
    homeTodos.innerHTML = recent.map(t => `
      <div class="todo-item" style="background:var(--bg3);margin-bottom:6px;">
        <div class="todo-check ${t.done ? 'checked' : ''}" onclick="toggleTodo('${t.id}')"></div>
        <span class="todo-text" style="font-size:13px;">${escHtml(t.text)}</span>
        <span class="tag tag-${t.cat}">${t.cat}</span>
      </div>
    `).join('');
  }
 
  // Recent bets
  const homeBets = document.getElementById('home-bets');
  const recentBets = bets.slice(0, 4);
  if (recentBets.length === 0) {
    homeBets.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0;">No bets tracked yet.</div>';
  } else {
    homeBets.innerHTML = recentBets.map(b => `
      <div class="bet-item" style="background:var(--bg3);margin-bottom:6px;">
        <span class="sport-badge">${escHtml(b.sport)}</span>
        <div class="bet-info">
          <div class="bet-matchup-text" style="font-size:13px;">${escHtml(b.matchup)}</div>
        </div>
        <span class="tag tag-${b.result}">${b.result}</span>
      </div>
    `).join('');
  }
 
  updateStats();
}
 
function updateStats() {
  const open     = todos.filter(t => !t.done).length;
  const done     = todos.filter(t => t.done).length;
  const work     = todos.filter(t => t.cat === 'work' && !t.done).length;
  const personal = todos.filter(t => t.cat === 'personal' && !t.done).length;
  document.getElementById('stat-tasks').textContent    = open;
  document.getElementById('stat-done').textContent     = done;
  document.getElementById('stat-work').textContent     = work;
  document.getElementById('stat-personal').textContent = personal;
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
 
// ─── INIT ─────────────────────────────────────────────────────────────────────
setGreeting();
renderHome();
renderTodos();
renderBets();
renderNotes();
