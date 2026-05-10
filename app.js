/* Max Workspace: Cyber Terminal build (no deps) */

// Storage keys (keep stable across redesigns)
const NOTES_KEY = 'workspace_notes';
const TODOS_KEY = 'workspace_todos';
const CARDS_KEY = 'workspace_cards';
const PLAYER_KEY = 'workspace_player_v1';
const DAILY_KEY = 'workspace_daily_v1';

// ===== Utils =====
function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toast(title, desc) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="t">${escapeHtml(title)}</div><div class="d">${escapeHtml(desc)}</div>`;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px) scale(0.98)';
  }, 2200);
  setTimeout(() => el.remove(), 2600);
}

// ===== Data =====
function getNotes() {
  const n = safeJsonParse(localStorage.getItem(NOTES_KEY) || '[]', []);
  return Array.isArray(n) ? n : [];
}
function saveNotes(n) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(n));
}

function getTodos() {
  const t = safeJsonParse(localStorage.getItem(TODOS_KEY) || '[]', []);
  return Array.isArray(t) ? t : [];
}
function saveTodos(t) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(t));
}

function defaultCards() {
  return { todo: [], progress: [], done: [] };
}
function getCards() {
  const c = safeJsonParse(localStorage.getItem(CARDS_KEY) || 'null', null);
  if (!c || typeof c !== 'object') return defaultCards();
  return {
    todo: Array.isArray(c.todo) ? c.todo : [],
    progress: Array.isArray(c.progress) ? c.progress : [],
    done: Array.isArray(c.done) ? c.done : [],
  };
}
function saveCards(c) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(c));
}

function defaultPlayer() {
  return {
    name: 'Player',
    title: 'The System is watching.',
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0,
    lastActive: null,
    statPoints: 0,
    stats: { str: 1, agi: 1, vit: 1, int: 1, per: 1 },
    lifetime: { todosDone: 0, cardsDone: 0, focusSessions: 0, wordsWritten: 0 },
    achievements: {},
    titlesUnlocked: ['The System is watching.'],
    settings: { reduceMotion: false },
  };
}

function getPlayer() {
  const p = safeJsonParse(localStorage.getItem(PLAYER_KEY) || 'null', null);
  if (!p || typeof p !== 'object') return defaultPlayer();
  const base = defaultPlayer();
  return {
    ...base,
    ...p,
    stats: { ...base.stats, ...(p.stats || {}) },
    lifetime: { ...base.lifetime, ...(p.lifetime || {}) },
    achievements: { ...(base.achievements || {}), ...(p.achievements || {}) },
    titlesUnlocked: Array.isArray(p.titlesUnlocked) ? p.titlesUnlocked : base.titlesUnlocked,
    settings: { ...base.settings, ...(p.settings || {}) },
  };
}

function savePlayer(p) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(p));
}

function xpToNext(level) {
  return Math.round(50 + (level - 1) * 15 + Math.pow(level - 1, 1.25) * 6);
}

function rankFromLevel(level) {
  if (level >= 40) return 'S';
  if (level >= 30) return 'A';
  if (level >= 22) return 'B';
  if (level >= 15) return 'C';
  if (level >= 8) return 'D';
  return 'E';
}

function onDailyActive(p) {
  const t = todayKey();
  if (p.lastActive === t) return p;

  if (!p.lastActive) {
    p.streak = 1;
  } else {
    const prev = new Date(p.lastActive + 'T00:00:00');
    const now = new Date(t + 'T00:00:00');
    const diffDays = Math.round((now - prev) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) p.streak += 1;
    else if (diffDays > 1) p.streak = 1;
  }
  p.lastActive = t;
  return p;
}

function defaultDaily(date = todayKey()) {
  return {
    date,
    claimed: {},
    progress: { todos: 0, cardsDone: 0, words: 0, focusSessions: 0 },
    goals: {
      q1: { id: 'q1', title: 'Daily Quest: Clear 3 tasks', desc: 'Complete 3 todos.', metric: 'todos', target: 3, reward: { xp: 30, coins: 15 } },
      q2: { id: 'q2', title: 'Daily Quest: Finish a card', desc: 'Move 2 kanban cards to Done.', metric: 'cardsDone', target: 2, reward: { xp: 35, coins: 20 } },
      q3: { id: 'q3', title: 'Daily Quest: Record your thoughts', desc: 'Write 200 words in Notes.', metric: 'words', target: 200, reward: { xp: 40, coins: 25 } },
      q4: { id: 'q4', title: 'Daily Quest: Focus session', desc: 'Complete 1 focus session.', metric: 'focusSessions', target: 1, reward: { xp: 45, coins: 30 } },
    },
  };
}

function getDaily() {
  const raw = safeJsonParse(localStorage.getItem(DAILY_KEY) || 'null', null);
  const t = todayKey();
  if (!raw || raw.date !== t) {
    const next = defaultDaily(t);
    localStorage.setItem(DAILY_KEY, JSON.stringify(next));
    return next;
  }
  const base = defaultDaily(t);
  return {
    ...base,
    ...raw,
    progress: { ...base.progress, ...(raw.progress || {}) },
    goals: { ...base.goals, ...(raw.goals || {}) },
    claimed: { ...(raw.claimed || {}) },
  };
}

function saveDaily(d) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(d));
}

function bumpDaily(metric, amount) {
  const d = getDaily();
  d.progress[metric] = Math.max(0, (d.progress[metric] || 0) + amount);
  saveDaily(d);
}

// ===== Achievements =====
const ACHIEVEMENTS = [
  {
    id: 'todo_1',
    name: 'First Blood',
    desc: 'Complete your first todo.',
    metric: 'todosDone',
    target: 1,
    reward: { xp: 20, coins: 10 },
    unlockTitles: ['Task Rookie'],
  },
  {
    id: 'todo_25',
    name: 'Task Slayer',
    desc: 'Complete 25 todos.',
    metric: 'todosDone',
    target: 25,
    reward: { xp: 60, coins: 40 },
    unlockTitles: ['Quest Clearer'],
  },
  {
    id: 'card_10',
    name: 'Board Cleaner',
    desc: 'Move 10 kanban cards to Done.',
    metric: 'cardsDone',
    target: 10,
    reward: { xp: 70, coins: 45 },
    unlockTitles: ['Dungeon Sweeper'],
  },
  {
    id: 'focus_5',
    name: 'Deep Work',
    desc: 'Finish 5 focus sessions.',
    metric: 'focusSessions',
    target: 5,
    reward: { xp: 80, coins: 55 },
    unlockTitles: ['Focus Adept'],
  },
  {
    id: 'words_1000',
    name: 'Scribe',
    desc: 'Write 1,000 words in Notes.',
    metric: 'wordsWritten',
    target: 1000,
    reward: { xp: 85, coins: 60 },
    unlockTitles: ['Scribe'],
  },
  {
    id: 'streak_3',
    name: 'Streak Starter',
    desc: 'Maintain a 3-day streak.',
    metric: 'streak',
    target: 3,
    reward: { xp: 45, coins: 30 },
    unlockTitles: ['Consistent Hunter'],
  },
  {
    id: 'streak_7',
    name: 'Unbroken',
    desc: 'Maintain a 7-day streak.',
    metric: 'streak',
    target: 7,
    reward: { xp: 90, coins: 70 },
    unlockTitles: ['Iron Will'],
  },
  {
    id: 'level_10',
    name: 'Awakening',
    desc: 'Reach Level 10.',
    metric: 'level',
    target: 10,
    reward: { xp: 120, coins: 90 },
    unlockTitles: ['Awakened'],
  },
];

function achievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}

function metricValue(p, metric) {
  if (metric === 'todosDone') return p.lifetime.todosDone || 0;
  if (metric === 'cardsDone') return p.lifetime.cardsDone || 0;
  if (metric === 'focusSessions') return p.lifetime.focusSessions || 0;
  if (metric === 'wordsWritten') return p.lifetime.wordsWritten || 0;
  if (metric === 'streak') return p.streak || 0;
  if (metric === 'level') return p.level || 1;
  return 0;
}

function metricLabel(metric) {
  if (metric === 'todosDone') return 'todos';
  if (metric === 'cardsDone') return 'cards';
  if (metric === 'focusSessions') return 'sessions';
  if (metric === 'wordsWritten') return 'words';
  if (metric === 'streak') return 'days';
  if (metric === 'level') return 'levels';
  return metric;
}

function ensureTitleUnlocked(p, title) {
  if (!title) return false;
  if (!Array.isArray(p.titlesUnlocked)) p.titlesUnlocked = [];
  if (p.titlesUnlocked.includes(title)) return false;
  p.titlesUnlocked.push(title);
  return true;
}

function checkAchievements(p) {
  let changed = false;
  for (const a of ACHIEVEMENTS) {
    const cur = metricValue(p, a.metric);
    const st = p.achievements[a.id] || {};
    const alreadyUnlocked = !!st.unlockedAt;
    if (!alreadyUnlocked && cur >= a.target) {
      p.achievements[a.id] = { unlockedAt: Date.now(), claimed: false };
      changed = true;
      toast('Achievement Unlocked', a.name);
      if (Array.isArray(a.unlockTitles)) {
        for (const t of a.unlockTitles) {
          if (ensureTitleUnlocked(p, t)) changed = true;
        }
      }
    }
  }
  if (ensureTitleUnlocked(p, p.title)) changed = true;
  if (changed) savePlayer(p);
  return p;
}

function award({ xp = 0, coins = 0, reason = '' }) {
  let p = getPlayer();
  p = onDailyActive(p);

  const oldLevel = p.level;
  p.xp += Math.max(0, xp);
  p.coins += Math.max(0, coins);

  let leveled = false;
  while (p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level += 1;
    p.statPoints += 3;
    leveled = true;
  }

  savePlayer(p);
  checkAchievements(p);

  refreshHUD();
  refreshSystem();

  if (xp || coins) {
    const parts = [];
    if (xp) parts.push(`+${xp} XP`);
    if (coins) parts.push(`+${coins} coins`);
    toast('Reward', `${parts.join('  ')}${reason ? `  (${reason})` : ''}`);
  }
  if (leveled) {
    toast('LEVEL UP', `You reached LV ${p.level}. +${p.level - oldLevel} level(s), +${(p.level - oldLevel) * 3} SP.`);
  }
}

function claimQuest(id) {
  const d = getDaily();
  const q = d.goals[id];
  if (!q) return;
  if (d.claimed[id]) return;
  const cur = d.progress[q.metric] || 0;
  if (cur < q.target) return;

  d.claimed[id] = true;
  saveDaily(d);
  award({ xp: q.reward.xp, coins: q.reward.coins, reason: q.title });
}

function claimAchievement(id) {
  const a = achievementById(id);
  if (!a) return;
  const p = getPlayer();
  const st = p.achievements[id];
  if (!st || !st.unlockedAt || st.claimed) return;

  st.claimed = true;
  if (Array.isArray(a.unlockTitles)) {
    for (const t of a.unlockTitles) ensureTitleUnlocked(p, t);
  }
  savePlayer(p);
  award({ xp: a.reward.xp, coins: a.reward.coins, reason: a.name });
}

function selectTitle(title) {
  const p = getPlayer();
  ensureTitleUnlocked(p, p.title);
  const titles = Array.isArray(p.titlesUnlocked) ? p.titlesUnlocked : [];
  if (titles.includes(title)) {
    p.title = title;
    savePlayer(p);
    refreshSystem();
    refreshHUD();
  }
}

// ===== UI State =====
let currentView = 'notes';
let currentNoteId = null;

let focus = {
  presetMin: 25,
  remainingSec: 25 * 60,
  running: false,
  t: null,
  lastTick: null,
};

// ===== DOM helpers =====
function $(id) {
  return document.getElementById(id);
}

function showView(view) {
  currentView = view;
  const navView = view === 'editor' ? 'notes' : view;
  const views = document.querySelectorAll('.view');
  for (const v of views) {
    const isTarget = v.dataset.view === view;
    v.hidden = !isTarget;
    if (isTarget) {
      const inner = v.querySelector('.view-inner');
      if (inner) {
        inner.classList.remove('fade-enter');
        // restart animation
        void inner.offsetWidth;
        inner.classList.add('fade-enter');
      }
    }
  }

  for (const b of document.querySelectorAll('.nav-btn')) {
    b.classList.toggle('active', b.dataset.view === navView);
  }

  // Render per view
  if (view === 'notes') renderNotes();
  if (view === 'todos') renderTodos();
  if (view === 'kanban') renderKanban();
  if (view === 'system') refreshSystem();
}

function setSidebarOpen(open) {
  const sb = $('sidebar');
  if (!sb) return;
  sb.classList.toggle('open', !!open);
}

function maybeCloseSidebarForMobile() {
  if (window.matchMedia('(max-width: 980px)').matches) setSidebarOpen(false);
}

// ===== Notes =====
function renderNotes() {
  const notes = getNotes();
  $('navNotes').textContent = String(notes.length);
  const grid = $('notesGrid');
  if (!grid) return;

  const cards = notes.map(n => {
    const title = n.title?.trim() ? n.title.trim() : 'Untitled';
    const snippet = (n.content || '').trim().slice(0, 140);
    const updated = n.updated ? new Date(n.updated).toLocaleDateString() : '';
    return `
      <div class="card note" data-note="${n.id}">
        <button class="x" type="button" data-del="${n.id}" aria-label="Delete note">×</button>
        <div class="t">${escapeHtml(title)}</div>
        <p class="p">${escapeHtml(snippet || 'Empty note...')}</p>
        <div class="meta"><span>UPDATED</span><span>${escapeHtml(updated)}</span></div>
      </div>
    `;
  }).join('');

  grid.innerHTML = cards + `
    <div class="card new" id="newNoteCard">+ NEW NOTE</div>
  `;

  grid.onclick = (e) => {
    const del = e.target?.dataset?.del;
    if (del) {
      e.stopPropagation();
      deleteNote(Number(del));
      return;
    }
    const noteEl = e.target.closest('[data-note]');
    if (noteEl) {
      openNote(Number(noteEl.dataset.note));
      return;
    }
    const newCard = e.target.closest('#newNoteCard');
    if (newCard) createNote();
  };
}

function createNote() {
  const notes = getNotes();
  const note = { id: Date.now(), title: '', content: '', updated: Date.now() };
  notes.unshift(note);
  saveNotes(notes);
  openNote(note.id);
}

function openNote(id) {
  currentNoteId = id;
  const notes = getNotes();
  const note = notes.find(n => n.id === id);
  if (!note) return;

  $('noteTitle').value = note.title || '';
  $('noteBody').value = note.content || '';
  $('editorHeader').textContent = (note.title || 'Note Editor').trim() || 'Note Editor';
  $('editorSub').textContent = 'Autosaves. XP drops on real writing.';

  showView('editor');
  $('noteTitle').focus();
}

function backToNotes() {
  currentNoteId = null;
  showView('notes');
}

function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  const notes = getNotes().filter(n => n.id !== id);
  saveNotes(notes);
  if (currentNoteId === id) currentNoteId = null;
  renderNotes();
  refreshHUD();
  return true;
}

function saveNoteContent() {
  if (!currentNoteId) return;
  const notes = getNotes();
  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;

  const title = $('noteTitle').value;
  const content = $('noteBody').value;
  note.title = title;
  note.content = content;
  note.updated = Date.now();

  // Word progress (only increases are counted)
  const words = wordCount(content);
  note.maxWords = Math.max(note.maxWords || 0, words);
  if (note._awardedWords == null) note._awardedWords = 0;
  const prev = note._awardedWords;
  if (note.maxWords > prev) {
    const delta = note.maxWords - prev;
    note._awardedWords = note.maxWords;
    bumpDaily('words', delta);
    const p = getPlayer();
    p.lifetime.wordsWritten = (p.lifetime.wordsWritten || 0) + delta;
    savePlayer(p);
    checkAchievements(p);

    const dripXp = Math.min(8, Math.floor(delta / 25) * 2);
    if (dripXp > 0) award({ xp: dripXp, coins: 0, reason: 'Notes writing' });
  }

  saveNotes(notes);
  $('editorHeader').textContent = (title || 'Note Editor').trim() || 'Note Editor';
  refreshHUD();
}

// ===== Todos =====
function renderTodos() {
  const todos = getTodos();
  $('navTodos').textContent = String(todos.filter(t => !t.done).length);

  const list = $('todoList');
  if (!list) return;

  const today = new Date().toISOString().split('T')[0];

  todos.sort((a, b) => {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;
    return (a.due || '9999') > (b.due || '9999') ? 1 : -1;
  });

  list.innerHTML = todos.map(t => {
    let dueClass = '';
    if (t.due) {
      if (t.due < today && !t.done) dueClass = 'overdue';
      else if (t.due === today) dueClass = 'today';
    }
    return `
      <li class="todo ${t.done ? 'done' : ''}" data-id="${t.id}">
        <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Toggle todo">
        <div class="txt">${escapeHtml(t.text)}</div>
        ${t.due ? `<div class="due ${dueClass}">${escapeHtml(t.due)}</div>` : ''}
        <button class="iconbtn" type="button" data-del="${t.id}" aria-label="Delete todo">×</button>
      </li>
    `;
  }).join('') || `<div class="card" style="padding:14px; font-family: var(--mono); color: rgba(240,248,255,0.6);">No todos yet. Add one above.</div>`;

  list.onchange = (e) => {
    const row = e.target.closest('[data-id]');
    if (!row) return;
    if (e.target.type !== 'checkbox') return;
    toggleTodo(Number(row.dataset.id));
  };
  list.onclick = (e) => {
    const del = e.target?.dataset?.del;
    if (del) deleteTodo(Number(del));
  };
}

function addTodo() {
  const text = $('todoText').value.trim();
  const due = $('todoDue').value;
  if (!text) return;

  const todos = getTodos();
  todos.push({ id: Date.now(), text, due: due || '', done: false, rewarded: false });
  saveTodos(todos);

  $('todoText').value = '';
  $('todoDue').value = '';
  renderTodos();
  refreshHUD();
}

function toggleTodo(id) {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  todo.done = !todo.done;

  if (todo.done && !todo.rewarded) {
    todo.rewarded = true;
    bumpDaily('todos', 1);

    let xp = 12;
    let coins = 6;
    if (todo.due) {
      const today = new Date().toISOString().split('T')[0];
      if (todo.due === today) { xp += 3; coins += 2; }
      if (todo.due < today) { xp += 6; coins += 3; }
    }

    const p = getPlayer();
    p.lifetime.todosDone = (p.lifetime.todosDone || 0) + 1;
    savePlayer(p);
    checkAchievements(p);

    award({ xp, coins, reason: 'Todo completed' });
  }

  saveTodos(todos);
  renderTodos();
  refreshHUD();
}

function deleteTodo(id) {
  const todos = getTodos().filter(t => t.id !== id);
  saveTodos(todos);
  renderTodos();
  refreshHUD();
}

// ===== Kanban =====
let draggedCardId = null;
let draggedFromStatus = null;

function renderKanban() {
  const cards = getCards();
  const total = cards.todo.length + cards.progress.length + cards.done.length;
  $('navCards').textContent = String(total);

  const cols = {
    todo: { body: $('colTodo'), count: $('countTodo') },
    progress: { body: $('colProgress'), count: $('countProgress') },
    done: { body: $('colDone'), count: $('countDone') },
  };

  for (const status of ['todo', 'progress', 'done']) {
    cols[status].count.textContent = String(cards[status].length);
    cols[status].body.innerHTML = cards[status].map(c => {
      const tag = c.tag ? `<div class="tags"><span class="tag ${escapeHtml(c.tag)}">${escapeHtml(c.tag)}</span></div>` : '';
      const desc = c.desc ? `<p>${escapeHtml(c.desc)}</p>` : '';
      return `
        <div class="kcard" draggable="true" data-id="${c.id}" data-status="${status}">
          <h4>${escapeHtml(c.title)}</h4>
          ${desc}
          ${tag}
        </div>
      `;
    }).join('');

    // DnD
    cols[status].body.ondragover = (e) => {
      e.preventDefault();
      cols[status].body.classList.add('drag');
    };
    cols[status].body.ondragleave = () => cols[status].body.classList.remove('drag');
    cols[status].body.ondrop = (e) => {
      e.preventDefault();
      cols[status].body.classList.remove('drag');
      dropCard(status);
    };
  }

  // Attach dragstart once (event delegation)
  const board = $('kanban');
  board.ondragstart = (e) => {
    const cardEl = e.target.closest('.kcard');
    if (!cardEl) return;
    draggedCardId = Number(cardEl.dataset.id);
    draggedFromStatus = cardEl.dataset.status;
    cardEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  };
  board.ondragend = (e) => {
    const cardEl = e.target.closest('.kcard');
    if (cardEl) cardEl.classList.remove('dragging');
  };
}

function dropCard(toStatus) {
  if (!draggedCardId || draggedFromStatus === toStatus) return;
  const cards = getCards();
  const idx = cards[draggedFromStatus].findIndex(c => c.id === draggedCardId);
  if (idx === -1) return;
  const card = cards[draggedFromStatus].splice(idx, 1)[0];
  cards[toStatus].push(card);

  if (toStatus === 'done' && !card.rewardedDone) {
    card.rewardedDone = true;
    bumpDaily('cardsDone', 1);
    const bonus = card.tag === 'urgent' ? 6 : card.tag === 'bug' ? 4 : card.tag === 'feature' ? 5 : 0;
    const p = getPlayer();
    p.lifetime.cardsDone = (p.lifetime.cardsDone || 0) + 1;
    savePlayer(p);
    checkAchievements(p);
    award({ xp: 18 + bonus, coins: 10 + Math.floor(bonus / 2), reason: 'Kanban card cleared' });
  }

  saveCards(cards);
  renderKanban();
  refreshHUD();

  draggedCardId = null;
  draggedFromStatus = null;
}

function openCardModal(status) {
  $('cardStatus').value = status;
  $('cardTitle').value = '';
  $('cardDesc').value = '';
  $('cardTag').value = '';
  $('cardModal').classList.add('active');
  $('cardTitle').focus();
}

function closeCardModal() {
  $('cardModal').classList.remove('active');
}

function saveCard() {
  const status = $('cardStatus').value;
  const title = $('cardTitle').value.trim();
  const desc = $('cardDesc').value.trim();
  const tag = $('cardTag').value;
  if (!title) return;

  const cards = getCards();
  cards[status].push({ id: Date.now(), title, desc, tag, rewardedDone: false });
  saveCards(cards);
  closeCardModal();
  renderKanban();
}

// ===== System UI =====
const STAT_LABELS = [
  { key: 'str', label: 'STR' },
  { key: 'agi', label: 'AGI' },
  { key: 'vit', label: 'VIT' },
  { key: 'int', label: 'INT' },
  { key: 'per', label: 'PER' },
];

function refreshHUD() {
  let p = getPlayer();
  p = onDailyActive(p);
  savePlayer(p);
  checkAchievements(p);

  const need = xpToNext(p.level);
  const pct = clamp(Math.round((p.xp / need) * 100), 0, 100);
  const r = rankFromLevel(p.level);

  $('hudRank').textContent = r;
  $('hudLevel').textContent = String(p.level);
  $('hudCoins').textContent = String(p.coins);
  $('hudStreak').textContent = String(p.streak);
  $('hudXp').textContent = `${p.xp}/${need}`;
  $('hudXpBar').style.width = pct + '%';

  $('navLevel').textContent = `LV ${p.level}`;
  $('brandSub').textContent = `RANK ${r}  |  STREAK ${p.streak}`;
}

function refreshSystem() {
  const systemView = $('view-system');
  if (!systemView || systemView.hidden) return;

  let p = getPlayer();
  p = onDailyActive(p);
  savePlayer(p);
  p = checkAchievements(p);

  const need = xpToNext(p.level);
  const r = rankFromLevel(p.level);
  $('playerName').textContent = p.name;
  $('playerSp').textContent = String(p.statPoints);
  $('playerRank').textContent = `${r}-Rank`;
  $('playerLevel').textContent = String(p.level);
  $('playerXp').textContent = `${p.xp} / ${need}`;
  $('playerCoins').textContent = String(p.coins);
  $('playerStreak').textContent = String(p.streak);

  // Titles
  const titles = Array.isArray(p.titlesUnlocked) ? Array.from(new Set(p.titlesUnlocked)) : [p.title];
  const ordered = [p.title, ...titles.filter(t => t !== p.title).sort((a, b) => a.localeCompare(b))];
  $('titleSelect').innerHTML = ordered.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  $('titleSelect').value = p.title;

  // Stats
  $('stats').innerHTML = STAT_LABELS.map(s => {
    const v = p.stats[s.key] || 0;
    const disabled = p.statPoints <= 0;
    return `
      <div class="stat">
        <div class="l">${s.label}</div>
        <div class="r"><span>${v}</span> <button type="button" data-inc="${s.key}" ${disabled ? 'disabled' : ''}>+</button></div>
      </div>
    `;
  }).join('');

  // Quests
  const d = getDaily();
  $('quests').innerHTML = Object.values(d.goals).map(q => {
    const cur = d.progress[q.metric] || 0;
    const pct = clamp(Math.round((cur / q.target) * 100), 0, 100);
    const isDone = cur >= q.target;
    const claimed = !!d.claimed[q.id];
    const canClaim = isDone && !claimed;
    return `
      <div class="quest">
        <div class="top">
          <div class="name">${escapeHtml(q.title)}</div>
          <div class="hud-chip"><span>Reward</span> <strong>+${q.reward.xp} XP</strong> <span style="opacity:0.7">+${q.reward.coins}C</span></div>
        </div>
        <div class="desc">${escapeHtml(q.desc)}</div>
        <div class="bar"><span style="width:${pct}%;"></span></div>
        <div class="meta"><span>${cur}/${q.target} ${escapeHtml(q.metric)}</span><span>${pct}%</span></div>
        <button class="btn primary claim" type="button" data-claimq="${q.id}" ${canClaim ? '' : 'disabled'}>${claimed ? 'CLAIMED' : isDone ? 'CLAIM' : 'IN PROGRESS'}</button>
      </div>
    `;
  }).join('');

  // Achievements
  $('achievements').innerHTML = ACHIEVEMENTS.map(a => {
    const cur = metricValue(p, a.metric);
    const pct = clamp(Math.round((cur / a.target) * 100), 0, 100);
    const st = p.achievements[a.id] || {};
    const unlocked = !!st.unlockedAt;
    const claimed = !!st.claimed;
    const badge = claimed ? 'CLAIMED' : unlocked ? 'UNLOCKED' : 'LOCKED';
    const canClaim = unlocked && !claimed;
    return `
      <div class="ach ${unlocked ? '' : 'locked'}">
        <div style="flex:1;">
          <div class="name">${escapeHtml(a.name)}</div>
          <div class="desc">${escapeHtml(a.desc)}</div>
          <div class="bar"><span style="width:${pct}%;"></span></div>
          <div class="meta"><span>${Math.min(cur, a.target)}/${a.target} ${escapeHtml(metricLabel(a.metric))}</span><span>${pct}%</span></div>
        </div>
        <div style="display:flex; flex-direction: column; gap: 10px; align-items: flex-end;">
          <div class="badge ${unlocked ? 'unlocked' : ''}">${badge}</div>
          <button class="btn primary" type="button" data-claima="${a.id}" ${canClaim ? '' : 'disabled'}>CLAIM +${a.reward.xp} XP, +${a.reward.coins}C</button>
        </div>
      </div>
    `;
  }).join('');

  refreshFocusUI();
}

function incStat(key) {
  const p = getPlayer();
  if (p.statPoints <= 0) return;
  p.statPoints -= 1;
  p.stats[key] = (p.stats[key] || 0) + 1;
  savePlayer(p);
  refreshHUD();
  refreshSystem();
}

// ===== Focus =====
function setFocusPreset(min) {
  focus.presetMin = min;
  if (!focus.running) {
    focus.remainingSec = min * 60;
    refreshFocusUI();
  }
  $('preset15').classList.toggle('active', min === 15);
  $('preset25').classList.toggle('active', min === 25);
  $('preset50').classList.toggle('active', min === 50);
}

function startFocus() {
  if (focus.running) return;
  focus.running = true;
  focus.lastTick = Date.now();
  focus.t = setInterval(focusTick, 250);
  refreshFocusUI();
}

function pauseFocus() {
  if (!focus.running) return;
  focus.running = false;
  if (focus.t) clearInterval(focus.t);
  focus.t = null;
  refreshFocusUI();
}

function resetFocus() {
  pauseFocus();
  focus.remainingSec = focus.presetMin * 60;
  refreshFocusUI();
}

function focusTick() {
  const now = Date.now();
  const dt = (now - (focus.lastTick || now)) / 1000;
  focus.lastTick = now;
  focus.remainingSec = Math.max(0, focus.remainingSec - dt);
  if (focus.remainingSec <= 0) {
    pauseFocus();
    focus.remainingSec = 0;
    onFocusComplete();
  }
  refreshFocusUI();
}

function refreshFocusUI() {
  const el = $('focusTime');
  if (!el) return;
  const m = Math.floor(focus.remainingSec / 60);
  const s = Math.floor(focus.remainingSec % 60);
  el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  $('focusStart').disabled = focus.running;
  $('focusPause').disabled = !focus.running;
  const sub = $('focusSub');
  if (sub) {
    const left = focus.running ? 'Stay in the dungeon. No distractions.' : 'Complete sessions to earn XP.';
    sub.querySelector('span').textContent = left;
  }
}

function onFocusComplete() {
  bumpDaily('focusSessions', 1);
  const p = getPlayer();
  p.lifetime.focusSessions = (p.lifetime.focusSessions || 0) + 1;
  savePlayer(p);
  checkAchievements(p);
  award({ xp: 55, coins: 35, reason: `Focus session (${focus.presetMin}m)` });
  toast('Session Complete', 'Quest progress updated.');
}

// ===== Wiring =====
function wire() {
  // Sidebar nav
  for (const b of document.querySelectorAll('.nav-btn')) {
    b.addEventListener('click', () => {
      showView(b.dataset.view);
      maybeCloseSidebarForMobile();
    });
  }
  $('menuBtn').addEventListener('click', () => setSidebarOpen(true));
  $('closeSidebarBtn').addEventListener('click', () => setSidebarOpen(false));
  $('statusBtn').addEventListener('click', () => showView('system'));

  // Notes
  $('newNoteBtn').addEventListener('click', createNote);
  $('backToNotesBtn').addEventListener('click', backToNotes);
  $('deleteNoteBtn').addEventListener('click', () => {
    if (!currentNoteId) return;
    const deleted = deleteNote(currentNoteId);
    if (deleted) backToNotes();
  });
  $('noteTitle').addEventListener('input', saveNoteContent);
  $('noteBody').addEventListener('input', saveNoteContent);

  // Todos
  $('addTodoBtn').addEventListener('click', addTodo);
  $('todoText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });

  // Kanban add buttons
  $('addCardTodo').addEventListener('click', () => openCardModal('todo'));
  $('addCardProgress').addEventListener('click', () => openCardModal('progress'));
  $('addCardDone').addEventListener('click', () => openCardModal('done'));
  $('cardCancel').addEventListener('click', closeCardModal);
  $('cardSave').addEventListener('click', saveCard);
  $('cardTitle').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveCard();
  });
  $('cardModal').addEventListener('click', (e) => {
    if (e.target.id === 'cardModal') closeCardModal();
  });

  // System: event delegation
  $('view-system').addEventListener('click', (e) => {
    const inc = e.target?.dataset?.inc;
    if (inc) incStat(inc);
    const q = e.target?.dataset?.claimq;
    if (q) { claimQuest(q); refreshSystem(); }
    const a = e.target?.dataset?.claima;
    if (a) { claimAchievement(a); refreshSystem(); }
  });
  $('titleSelect').addEventListener('change', (e) => selectTitle(e.target.value));

  // Focus
  $('preset15').addEventListener('click', () => setFocusPreset(15));
  $('preset25').addEventListener('click', () => setFocusPreset(25));
  $('preset50').addEventListener('click', () => setFocusPreset(50));
  $('focusStart').addEventListener('click', startFocus);
  $('focusPause').addEventListener('click', pauseFocus);
  $('focusReset').addEventListener('click', resetFocus);
}

function init() {
  // Ensure player/streak is updated.
  let p = getPlayer();
  p = onDailyActive(p);
  savePlayer(p);
  checkAchievements(p);

  // Lightweight migrations to prevent reward farming on old data.
  {
    const todos = getTodos();
    let changed = false;
    for (const t of todos) {
      if (t && typeof t === 'object' && t.rewarded === undefined) {
        t.rewarded = !!t.done;
        changed = true;
      }
    }
    if (changed) saveTodos(todos);
  }
  {
    const cards = getCards();
    let changed = false;
    for (const c of cards.done) {
      if (c && typeof c === 'object' && c.rewardedDone === undefined) {
        c.rewardedDone = true;
        changed = true;
      }
    }
    if (changed) saveCards(cards);
  }

  // Initial renders
  refreshHUD();
  renderNotes();
  renderTodos();
  renderKanban();

  // Default view
  showView('notes');
  setSidebarOpen(false);
  wire();
}

init();
