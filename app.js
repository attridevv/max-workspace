/* Max Workspace: Cyber Terminal v2 — focused, addictive, mysterious */

const NOTES_KEY = 'workspace_notes';
const TODOS_KEY = 'workspace_todos';
const CARDS_KEY = 'workspace_cards';
const PLAYER_KEY = 'workspace_player_v1';
const DAILY_KEY = 'workspace_daily_v1';

function safeJsonParse(v, f) {
  try { return JSON.parse(v); } catch { return f; }
}
function todayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function wordCount(t) { return (t||'').trim().split(/\s+/).filter(Boolean).length; }
function escapeHtml(s) {
  return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function $(id) { return document.getElementById(id); }

// ===== TOAST =====
let toastQueue = [];
function toast(title, desc, type = 'default') {
  const host = $('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<div class="t">${escapeHtml(title)}</div><div class="d">${escapeHtml(desc)}</div>`;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(6px) scale(0.96)'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

// ===== DATA =====
function getNotes() { const n = safeJsonParse(localStorage.getItem(NOTES_KEY)||'[]',[]); return Array.isArray(n)?n:[]; }
function saveNotes(n) { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); }
function getTodos() { const t = safeJsonParse(localStorage.getItem(TODOS_KEY)||'[]',[]); return Array.isArray(t)?t:[]; }
function saveTodos(t) { localStorage.setItem(TODOS_KEY, JSON.stringify(t)); }
function defaultCards() { return { todo:[], progress:[], done:[] }; }
function getCards() {
  const c = safeJsonParse(localStorage.getItem(CARDS_KEY)||'null',null);
  if (!c||typeof c!=='object') return defaultCards();
  return { todo: Array.isArray(c.todo)?c.todo:[], progress: Array.isArray(c.progress)?c.progress:[], done: Array.isArray(c.done)?c.done:[] };
}
function saveCards(c) { localStorage.setItem(CARDS_KEY, JSON.stringify(c)); }

function defaultPlayer() {
  return {
    name: 'Operative', title: '???', level: 1, xp: 0, coins: 0, streak: 0, lastActive: null,
    statPoints: 0, stats: { str:1, agi:1, vit:1, int:1, per:1 },
    lifetime: { todosDone:0, cardsDone:0, focusSessions:0, wordsWritten:0 },
    achievements: {}, titlesUnlocked: [], titlesSecret: [],
    firstBoot: true, bootSeen: false,
    settings: { reduceMotion: false },
  };
}
function getPlayer() {
  const p = safeJsonParse(localStorage.getItem(PLAYER_KEY)||'null',null);
  if (!p||typeof p!=='object') return defaultPlayer();
  const base = defaultPlayer();
  return { ...base, ...p, stats:{...base.stats,...(p.stats||{})}, lifetime:{...base.lifetime,...(p.lifetime||{})}, achievements:{...(base.achievements||{}),...(p.achievements||{})} };
}
function savePlayer(p) { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); }

function xpToNext(lv) { return Math.round(50+(lv-1)*15+Math.pow(lv-1,1.25)*6); }
function rankFromLevel(lv) {
  if (lv>=40) return 'S'; if (lv>=30) return 'A'; if (lv>=22) return 'B';
  if (lv>=15) return 'C'; if (lv>=8) return 'D'; return 'E';
}

function onDailyActive(p) {
  const t = todayKey();
  if (p.lastActive === t) return p;
  if (!p.lastActive) { p.streak = 1; }
  else {
    const prev = new Date(p.lastActive+'T00:00:00'), now = new Date(t+'T00:00:00');
    const diff = Math.round((now-prev)/(24*60*60*1000));
    if (diff===1) p.streak += 1; else if (diff>1) p.streak = 1;
  }
  p.lastActive = t;
  return p;
}

function defaultDaily(date=todayKey()) {
  return {
    date, claimed:{},
    progress: { todos:0, cardsDone:0, words:0, focusSessions:0 },
    goals: {
      q1: { id:'q1', title:'Complete 3 tasks', desc:'Check off three items.', metric:'todos', target:3, reward:{xp:30,coins:15} },
      q2: { id:'q2', title:'Board sweep', desc:'Move two cards to Done.', metric:'cardsDone', target:2, reward:{xp:35,coins:20} },
      q3: { id:'q3', title:'Focus dungeon', desc:'Complete one focus session.', metric:'focusSessions', target:1, reward:{xp:45,coins:30} },
    },
  };
}
function getDaily() {
  const raw = safeJsonParse(localStorage.getItem(DAILY_KEY)||'null',null);
  const t = todayKey();
  if (!raw||raw.date!==t) { const next=defaultDaily(t); localStorage.setItem(DAILY_KEY,JSON.stringify(next)); return next; }
  const base = defaultDaily(t);
  return {...base,...raw,progress:{...base.progress,...(raw.progress||{})},goals:{...base.goals,...(raw.goals||{})},claimed:{...(raw.claimed||{})}};
}
function saveDaily(d) { localStorage.setItem(DAILY_KEY, JSON.stringify(d)); }
function bumpDaily(metric, amount) {
  const d = getDaily();
  d.progress[metric] = Math.max(0,(d.progress[metric]||0)+amount);
  saveDaily(d);
}

// ===== ACHIEVEMENTS =====
const ACHIEVEMENTS = [
  { id:'todo_1',    name:'First Mark',    desc:'A single task completed. The journey begins.', metric:'todosDone',     target:1,  reward:{xp:20,coins:10}, unlockTitle:'Marked',     secret:false },
  { id:'todo_10',  name:'Task Soldier',  desc:'Ten tasks cleared. Discipline taking shape.', metric:'todosDone',     target:10, reward:{xp:50,coins:30}, unlockTitle:'Soldier',     secret:false },
  { id:'todo_50',  name:'Task Elite',    desc:'Fifty tasks. You operate on a different level.', metric:'todosDone',  target:50, reward:{xp:100,coins:70}, unlockTitle:'Elite Operative', secret:false },
  { id:'card_10',  name:'Board Clear',   desc:'Ten cards to Done. Every action has weight.', metric:'cardsDone',     target:10, reward:{xp:60,coins:40}, unlockTitle:'Board Clear',   secret:false },
  { id:'focus_1',  name:'Deep Entry',    desc:'First focus session. The dungeon accepts you.', metric:'focusSessions', target:1, reward:{xp:40,coins:25}, unlockTitle:'Dungeon Diver', secret:false },
  { id:'focus_10', name:'Focus Adept',  desc:'Ten sessions. Your mind sharpens each time.', metric:'focusSessions', target:10, reward:{xp:90,coins:60}, unlockTitle:'Focus Adept', secret:false },
  { id:'streak_3', name:'Three Days',    desc:'Three days unbroken. The system takes note.', metric:'streak',        target:3,  reward:{xp:45,coins:30}, unlockTitle:'Unbroken',     secret:false },
  { id:'streak_7', name:'One Week',      desc:'Seven days. The system remembers your pattern.', metric:'streak',       target:7,  reward:{xp:90,coins:70}, unlockTitle:'Relentless',   secret:true  },
  { id:'streak_30',name:'One Month',    desc:'Thirty days. You are the algorithm now.', metric:'streak',            target:30, reward:{xp:200,coins:200}, unlockTitle:'Permanent Record', secret:true },
  { id:'level_5', name:'Rank Up',       desc:'Level 5. The hierarchy shifts.', metric:'level',            target:5,  reward:{xp:80,coins:50}, unlockTitle:'Rising Operative', secret:true },
  { id:'level_10', name:'Awakening',    desc:'Level 10. Something clicks into place.', metric:'level',         target:10, reward:{xp:120,coins:90}, unlockTitle:'Awakened',      secret:true },
  { id:'all_daily',name:'Perfect Day',   desc:'Complete all daily quests in one day.', metric:'_allDaily',    target:1,  reward:{xp:100,coins:80}, unlockTitle:'System Operative', secret:true },
];

const ACH_HIDDEN = { streak_7:'The system watches. What does it record?', streak_30:'Access restricted. Tier 7 clearance required.', level_5:'Something stirs at level 5.', level_10:'??? AWAKENED ???', all_daily:'What makes a perfect day?' };

function achievementById(id) { return ACHIEVEMENTS.find(a=>a.id===id)||null; }
function metricValue(p, metric) {
  if (metric==='todosDone') return p.lifetime.todosDone||0;
  if (metric==='cardsDone') return p.lifetime.cardsDone||0;
  if (metric==='focusSessions') return p.lifetime.focusSessions||0;
  if (metric==='streak') return p.streak||0;
  if (metric==='level') return p.level||1;
  if (metric==='_allDaily') {
    const d = getDaily();
    const allDone = Object.values(d.goals).every(q => (d.progress[q.metric]||0) >= q.target);
    return allDone ? 1 : 0;
  }
  return 0;
}
function ensureTitle(p, title) {
  if (!title) return false;
  if (!Array.isArray(p.titlesUnlocked)) p.titlesUnlocked = [];
  if (p.titlesUnlocked.includes(title)) return false;
  p.titlesUnlocked.push(title);
  return true;
}

function checkAchievements(p, silent=false) {
  let changed = false;
  for (const a of ACHIEVEMENTS) {
    const cur = metricValue(p, a.metric);
    const st = p.achievements[a.id] = p.achievements[a.id]||{};
    const unlocked = !!st.unlockedAt;
    if (!unlocked && cur >= a.target) {
      p.achievements[a.id] = { unlockedAt: Date.now(), claimed: false };
      changed = true;
      if (!silent) toast('Achievement Unlocked', a.name);
      if (a.unlockTitle) { if (ensureTitle(p, a.unlockTitle)) changed = true; }
    }
  }
  if (changed) savePlayer(p);
  return p;
}

// ===== REWARDS =====
function award({ xp=0, coins=0, reason='' }) {
  let p = getPlayer();
  p = onDailyActive(p);
  const oldLevel = p.level;
  p.xp += Math.max(0,xp);
  p.coins += Math.max(0,coins);
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
  if ($('view-system') && !$('view-system').hidden) refreshSystem();

  const parts = [];
  if (xp) parts.push(`+${xp} XP`);
  if (coins) parts.push(`+${coins} coins`);
  if (parts.length) {
    toast('Reward', `${parts.join('  ')}${reason?`  (${reason})`:''}`, 'reward');
    if (xp > 0) animateXPGain(xp);
  }
  if (leveled) {
    toast('LEVEL UP', `LV ${p.level}. +${p.statPoints} SP.`, 'levelup');
  }
}

function claimQuest(id) {
  const d = getDaily();
  const q = d.goals[id];
  if (!q||d.claimed[id]) return;
  if ((d.progress[q.metric]||0) < q.target) return;
  d.claimed[id] = true;
  saveDaily(d);
  award({ xp:q.reward.xp, coins:q.reward.coins, reason:q.title });
  refreshSystem();
}

function claimAchievement(id) {
  const a = achievementById(id);
  if (!a) return;
  const p = getPlayer();
  const st = p.achievements[id];
  if (!st||!st.unlockedAt||st.claimed) return;
  st.claimed = true;
  if (a.unlockTitle) ensureTitle(p, a.unlockTitle);
  savePlayer(p);
  award({ xp:a.reward.xp, coins:a.reward.coins, reason:a.name });
  refreshSystem();
}

function selectTitle(title) {
  const p = getPlayer();
  ensureTitle(p, p.title);
  if (Array.isArray(p.titlesUnlocked) && p.titlesUnlocked.includes(title)) {
    p.title = title; savePlayer(p);
    refreshSystem(); refreshHUD();
  }
}

function incStat(key) {
  const p = getPlayer();
  if (p.statPoints <= 0) return;
  p.statPoints -= 1;
  p.stats[key] = (p.stats[key]||0) + 1;
  savePlayer(p);
  refreshHUD();
  refreshSystem();
}

// ===== XP ANIMATION =====
function animateXPGain(amount) {
  const hudXp = $('hudXp');
  if (!hudXp) return;
  hudXp.classList.remove('xp-pop');
  void hudXp.offsetWidth;
  hudXp.classList.add('xp-pop');
  setTimeout(() => hudXp.classList.remove('xp-pop'), 400);
}

// ===== FOCUS =====
let focus = { presetMin:25, remainingSec:25*60, running:false, t:null, lastTick:null };
function setFocusPreset(min) {
  focus.presetMin = min;
  if (!focus.running) focus.remainingSec = min*60;
  refreshFocusUI();
  ['preset15','preset25','preset50'].forEach(id => $(id).classList.toggle('active', id==='preset'+min));
}
function startFocus() {
  if (focus.running) return;
  focus.running = true; focus.lastTick = Date.now();
  focus.t = setInterval(focusTick, 250);
  refreshFocusUI();
}
function pauseFocus() {
  if (!focus.running) return;
  focus.running = false; clearInterval(focus.t); focus.t = null;
  refreshFocusUI();
}
function resetFocus() { pauseFocus(); focus.remainingSec = focus.presetMin*60; refreshFocusUI(); }
function focusTick() {
  const now = Date.now();
  const dt = (now-(focus.lastTick||now))/1000;
  focus.lastTick = now;
  focus.remainingSec = Math.max(0, focus.remainingSec-dt);
  if (focus.remainingSec <= 0) { pauseFocus(); focus.remainingSec = 0; onFocusComplete(); }
  refreshFocusUI();
}
function refreshFocusUI() {
  const el = $('focusTime'); if (!el) return;
  const m = Math.floor(focus.remainingSec/60), s = Math.floor(focus.remainingSec%60);
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  $('focusStart').disabled = focus.running;
  $('focusPause').disabled = !focus.running;
}
function onFocusComplete() {
  bumpDaily('focusSessions',1);
  const p = getPlayer();
  p.lifetime.focusSessions = (p.lifetime.focusSessions||0)+1;
  savePlayer(p);
  checkAchievements(p);
  award({ xp:55, coins:35, reason:`Focus (${focus.presetMin}m)` });
  toast('Session Complete', 'The dungeon releases you. XP earned.');
}

// ===== BOOT SEQUENCE =====
function shouldShowBoot() {
  const p = getPlayer();
  return p.firstBoot || !p.bootSeen;
}
function runBootSequence(cb) {
  const overlay = document.createElement('div');
  overlay.id = 'boot-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:#070A12;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;transition:opacity 0.8s ease;';
  const lines = [
    'INITIALIZING MAX WORKSPACE...',
    'LOADING NEURAL INTERFACE...',
    'CALIBRATING ATTENTION MATRIX...',
    'ESTABLISHING STREAK PROTOCOL...',
    'SYSTEM READY.',
  ];
  const out = document.createElement('div');
  out.style.cssText = 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#67e8f9;letter-spacing:2px;text-align:left;min-width:340px;';
  overlay.appendChild(out);
  document.body.appendChild(overlay);

  let i = 0;
  function showLine() {
    if (i >= lines.length) {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); if (cb) cb(); }, 900);
      return;
    }
    out.innerHTML += lines[i] + '<br>';
    i++;
    setTimeout(showLine, 400 + Math.random()*200);
  }
  showLine();
}
function markBootSeen() {
  const p = getPlayer();
  p.bootSeen = true;
  p.firstBoot = false;
  savePlayer(p);
}

// ===== UI STATE =====
let currentView = 'todos';

function showView(view) {
  currentView = view;
  const views = document.querySelectorAll('.view');
  for (const v of views) {
    const isTarget = v.dataset.view === view;
    if (isTarget) v.classList.add('active');
    else v.classList.remove('active');
  }
  for (const b of document.querySelectorAll('.nav-btn')) {
    b.classList.toggle('active', b.dataset.view === view);
  }
  if (view === 'todos') renderTodos();
  if (view === 'kanban') renderKanban();
  if (view === 'system') { refreshSystem(); syncStreakAlert(); }
}
function setSidebarOpen(open) { $('sidebar').classList.toggle('open', !!open); }
function maybeCloseSidebar() { if (window.matchMedia('(max-width:980px)').matches) setSidebarOpen(false); }

// ===== TODOS =====
function renderTodos() {
  const todos = getTodos();
  const pending = todos.filter(t=>!t.done).length;
  $('navTodos').textContent = String(pending);

  const list = $('todoList');
  if (!list) return;
  const today = new Date().toISOString().split('T')[0];

  todos.sort((a,b) => {
    if (!!a.done !== !!b.done) return a.done?1:-1;
    return (a.due||'9999') > (b.due||'9999') ? 1 : -1;
  });

  list.innerHTML = todos.length ? todos.map(t => {
    let dc = '';
    if (t.due) {
      if (t.due < today && !t.done) dc = 'overdue';
      else if (t.due === today) dc = 'today';
    }
    return `<li class="todo ${t.done?'done':''}" data-id="${t.id}">
      <input type="checkbox" ${t.done?'checked':''} aria-label="Toggle">
      <div class="txt">${escapeHtml(t.text)}</div>
      ${t.due?`<div class="due ${dc}">${escapeHtml(t.due)}</div>`:''}
      <button class="iconbtn" type="button" data-del="${t.id}" aria-label="Delete">×</button>
    </li>`;
  }).join('') : `<div style="text-align:center;padding:32px;color:rgba(240,248,255,0.35);font-family:var(--mono);font-size:12px;">
    <div style="font-size:32px;margin-bottom:8px;">&#x1F4CB;</div>
    No tasks. Add one above.<br><span style="font-size:10px;opacity:0.6">Every task builds the streak.</span>
  </div>`;

  list.onchange = (e) => {
    const row = e.target.closest('[data-id]');
    if (!row || e.target.type!=='checkbox') return;
    toggleTodo(Number(row.dataset.id));
  };
  list.onclick = (e) => { if (e.target?.dataset?.del) deleteTodo(Number(e.target.dataset.del)); };
}

function addTodo() {
  const text = $('todoText').value.trim();
  const due = $('todoDue').value;
  if (!text) return;
  const todos = getTodos();
  todos.push({ id:Date.now(), text, due:due||'', done:false, rewarded:false });
  saveTodos(todos);
  $('todoText').value = ''; $('todoDue').value = '';
  renderTodos(); refreshHUD();
}

function toggleTodo(id) {
  const todos = getTodos();
  const t = todos.find(t=>t.id===id);
  if (!t) return;
  t.done = !t.done;
  if (t.done && !t.rewarded) {
    t.rewarded = true;
    bumpDaily('todos', 1);
    let xp=12, coins=6;
    if (t.due) {
      const today = new Date().toISOString().split('T')[0];
      if (t.due===today) { xp+=3; coins+=2; }
      if (t.due < today) { xp+=6; coins+=3; }
    }
    const p = getPlayer();
    p.lifetime.todosDone = (p.lifetime.todosDone||0)+1;
    savePlayer(p);
    checkAchievements(p);
    award({ xp, coins, reason:'Task done' });
    syncStreakAlert();
  }
  saveTodos(todos);
  renderTodos(); refreshHUD();
}

function deleteTodo(id) {
  saveTodos(getTodos().filter(t=>t.id!==id));
  renderTodos(); refreshHUD();
}

// ===== KANBAN =====
let draggedCardId = null, draggedFromStatus = null;

function renderKanban() {
  const cards = getCards();
  const total = cards.todo.length + cards.progress.length + cards.done.length;
  $('navCards').textContent = String(total);
  const cols = { todo:{body:$('colTodo'),count:$('countTodo')}, progress:{body:$('colProgress'),count:$('countProgress')}, done:{body:$('colDone'),count:$('countDone')} };
  for (const s of ['todo','progress','done']) {
    cols[s].count.textContent = String(cards[s].length);
    cols[s].body.innerHTML = cards[s].map(c => {
      const tag = c.tag?`<div class="tags"><span class="tag ${escapeHtml(c.tag)}">${escapeHtml(c.tag)}</span></div>`:'';
      const desc = c.desc?`<p>${escapeHtml(c.desc)}</p>`:'';
      return `<div class="kcard" draggable="true" data-id="${c.id}" data-status="${s}"><h4>${escapeHtml(c.title)}</h4>${desc}${tag}</div>`;
    }).join('');
    cols[s].body.ondragover = e => { e.preventDefault(); cols[s].body.classList.add('drag'); };
    cols[s].body.ondragleave = () => cols[s].body.classList.remove('drag');
    cols[s].body.ondrop = e => { e.preventDefault(); cols[s].body.classList.remove('drag'); dropCard(s); };
  }
  const board = $('kanban');
  board.ondragstart = e => { const c=e.target.closest('.kcard'); if(!c)return; draggedCardId=Number(c.dataset.id); draggedFromStatus=c.dataset.status; c.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; };
  board.ondragend = e => { if(e.target.closest('.kcard')) e.target.closest('.kcard').classList.remove('dragging'); };
}

function dropCard(toStatus) {
  if (!draggedCardId||draggedFromStatus===toStatus) return;
  const cards = getCards();
  const idx = cards[draggedFromStatus].findIndex(c=>c.id===draggedCardId);
  if (idx===-1) return;
  const card = cards[draggedFromStatus].splice(idx,1)[0];
  cards[toStatus].push(card);
  if (toStatus==='done' && !card.rewardedDone) {
    card.rewardedDone = true;
    bumpDaily('cardsDone',1);
    const bonus = card.tag==='urgent'?6:card.tag==='bug'?4:card.tag==='feature'?5:0;
    const p = getPlayer();
    p.lifetime.cardsDone = (p.lifetime.cardsDone||0)+1;
    savePlayer(p);
    checkAchievements(p);
    award({ xp:18+bonus, coins:10+Math.floor(bonus/2), reason:'Card cleared' });
    syncStreakAlert();
  }
  saveCards(cards);
  renderKanban(); refreshHUD();
}

function openCardModal(status) {
  $('cardStatus').value = status;
  $('cardTitle').value = ''; $('cardDesc').value = ''; $('cardTag').value = '';
  $('cardModal').classList.add('active');
  $('cardTitle').focus();
}
function closeCardModal() { $('cardModal').classList.remove('active'); }
function saveCard() {
  const status = $('cardStatus').value;
  const title = $('cardTitle').value.trim();
  if (!title) return;
  const cards = getCards();
  cards[status].push({ id:Date.now(), title, desc:$('cardDesc').value.trim(), tag:$('cardTag').value, rewardedDone:false });
  saveCards(cards);
  closeCardModal(); renderKanban(); refreshHUD();
}

// ===== HUD =====
function refreshHUD() {
  let p = getPlayer();
  p = onDailyActive(p);
  savePlayer(p);
  checkAchievements(p, true);
  const need = xpToNext(p.level);
  const pct = clamp(Math.round((p.xp/need)*100),0,100);
  const r = rankFromLevel(p.level);
  $('hudRank').textContent = r;
  $('hudLevel').textContent = String(p.level);
  $('hudCoins').textContent = String(p.coins);
  $('hudXp').textContent = `${p.xp}/${need}`;
  $('hudXpBar').style.width = pct+'%';
  $('brandSub').textContent = `RANK ${r}`;
  $('sideStreak').textContent = String(p.streak);
  $('navTodos').textContent = String(getTodos().filter(t=>!t.done).length);
}

// ===== STREAK ALERT =====
function syncStreakAlert() {
  const p = getPlayer();
  const d = getDaily();
  const hasTasksDone = (d.progress.todos||0) > 0;
  const alert = $('streakAlert');
  if (!alert) return;
  if (p.streak === 0 || hasTasksDone) {
    alert.classList.add('hidden');
  } else {
    alert.classList.remove('hidden');
  }
}

// ===== CHARACTER / SYSTEM =====
function refreshSystem() {
  const sv = $('view-system');
  if (!sv || !sv.classList.contains('active')) return;
  let p = getPlayer();
  p = onDailyActive(p);
  savePlayer(p);
  p = checkAchievements(p, true);

  const r = rankFromLevel(p.level);
  $('charRank').textContent = r;
  $('playerName').value = p.name;
  $('charLevel').textContent = String(p.level);
  $('charStreak').textContent = String(p.streak);
  $('charCoins').textContent = String(p.coins);
  $('playerName').textContent = p.name;

  const titles = Array.isArray(p.titlesUnlocked) ? Array.from(new Set(p.titlesUnlocked)) : [];
  const ordered = [p.title, ...titles.filter(t=>t!==p.title&&t!=='???').sort((a,b)=>a.localeCompare(b))];
  $('titleSelect').innerHTML = ordered.map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  if (ordered.includes(p.title)) $('titleSelect').value = p.title;

  $('stats').innerHTML = [
    { key:'str', label:'STR' }, { key:'agi', label:'AGI' },
    { key:'vit', label:'VIT' }, { key:'int', label:'INT' }, { key:'per', label:'PER' },
  ].map(s => {
    const v = p.stats[s.key]||0;
    const disabled = p.statPoints <= 0;
    return `<div class="stat-row-inner">
      <div class="l">${s.label}</div>
      <div class="r"><span>${v}</span><button type="button" data-inc="${s.key}" ${disabled?'disabled':''}>+</button></div>
    </div>`;
  }).join('');

  const d = getDaily();
  $('quests').innerHTML = Object.values(d.goals).map(q => {
    const cur = d.progress[q.metric]||0;
    const pct = clamp(Math.round((cur/q.target)*100),0,100);
    const isDone = cur >= q.target;
    const claimed = !!d.claimed[q.id];
    return `<div class="quest">
      <div class="top">
        <div class="name">${escapeHtml(q.title)}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--muted);">+${q.reward.xp} XP  +${q.reward.coins}C</div>
      </div>
      <div class="desc">${escapeHtml(q.desc)}</div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="meta"><span>${cur}/${q.target}</span><span>${pct}%</span></div>
      <button class="btn primary claim" type="button" data-claimq="${q.id}" ${(isDone&&!claimed)?'':'disabled'}>${claimed?'CLAIMED':isDone?'CLAIM':'IN PROGRESS'}</button>
    </div>`;
  }).join('');

  $('achievements').innerHTML = ACHIEVEMENTS.map(a => {
    const cur = metricValue(p, a.metric);
    const pct = clamp(Math.round((cur/a.target)*100),0,100);
    const st = p.achievements[a.id]||{};
    const unlocked = !!st.unlockedAt;
    const claimed = !!st.claimed;
    const hidden = a.secret && !unlocked;
    const badge = claimed?'CLAIMED':unlocked?'UNLOCKED':'LOCKED';
    const canClaim = unlocked && !claimed;
    return `<div class="ach ${unlocked?'':'locked'}">
      <div style="flex:1;">
        <div class="name">${hidden?'?????????':escapeHtml(a.name)}</div>
        <div class="desc">${hidden?(ACH_HIDDEN[a.id]||'Locked.'):escapeHtml(a.desc)}</div>
        ${hidden?'':`<div class="bar" style="margin-top:6px;"><span style="width:${pct}%"></span></div><div class="meta"><span>${Math.min(cur,a.target)}/${a.target}</span><span>${pct}%</span></div>`}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
        <div class="badge ${unlocked?'unlocked':''}">${badge}</div>
        ${canClaim?`<button class="btn" style="font-size:10px;padding:5px 8px;" type="button" data-claima="${a.id}">CLAIM</button>`:''}
      </div>
    </div>`;
  }).join('');
}

// ===== WIRING =====
function wire() {
  for (const b of document.querySelectorAll('.nav-btn')) {
    b.addEventListener('click', () => { showView(b.dataset.view); maybeCloseSidebar(); });
  }
  $('menuBtn').addEventListener('click', () => setSidebarOpen(true));
  $('closeSidebarBtn').addEventListener('click', () => setSidebarOpen(false));

  // Todos
  $('addTodoBtn').addEventListener('click', () => { document.querySelector('#todoText').focus(); });
  $('addTodoBtn2')?.addEventListener('click', () => { document.querySelector('#todoText').focus(); });
  $('addTodoBtn3')?.addEventListener('click', () => { document.querySelector('#todoText').focus(); });
  $('todoText').addEventListener('keydown', e => { if(e.key==='Enter') addTodo(); });
  $('todoDue').addEventListener('keydown', e => { if(e.key==='Enter') addTodo(); });
  $('addTodoEnter')?.addEventListener('click', addTodo);

  // Kanban
  $('addCardTodo').addEventListener('click', ()=>openCardModal('todo'));
  $('addCardProgress').addEventListener('click', ()=>openCardModal('progress'));
  $('addCardDone').addEventListener('click', ()=>openCardModal('done'));
  $('cardCancel').addEventListener('click', closeCardModal);
  $('cardSave').addEventListener('click', saveCard);
  $('cardTitle').addEventListener('keydown', e=>{ if(e.key==='Enter') saveCard(); });
  $('cardModal').addEventListener('click', e=>{ if(e.target.id==='cardModal') closeCardModal(); });

  // System
  $('view-system').addEventListener('click', e => {
    const inc = e.target?.dataset?.inc; if (inc) { incStat(inc); return; }
    const q = e.target?.dataset?.claimq; if (q) { claimQuest(q); return; }
    const a = e.target?.dataset?.claima; if (a) { claimAchievement(a); return; }
  });
  $('titleSelect').addEventListener('change', e=>selectTitle(e.target.value));
  $('playerName').addEventListener('change', e=>{
    const p=getPlayer(); p.name=e.target.value.slice(0,20); savePlayer(p);
  });

  // Focus
  $('preset15').addEventListener('click',()=>setFocusPreset(15));
  $('preset25').addEventListener('click',()=>setFocusPreset(25));
  $('preset50').addEventListener('click',()=>setFocusPreset(50));
  $('focusStart').addEventListener('click',startFocus);
  $('focusPause').addEventListener('click',pauseFocus);
  $('focusReset').addEventListener('click',resetFocus);

  // Keyboard shortcut: Ctrl+N = focus task input
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key === 'n') {
      e.preventDefault();
      document.querySelector('#todoText')?.focus();
      toast('Quick Add', 'Type your task. Hit Enter.', 'default');
    }
  });
}

function init() {
  let p = getPlayer();
  p = onDailyActive(p);
  savePlayer(p);
  checkAchievements(p);

  // migrations
  const todos = getTodos();
  let changed = false;
  for (const t of todos) { if (t && typeof t==='object' && t.rewarded===undefined) { t.rewarded=!!t.done; changed=true; } }
  if (changed) saveTodos(todos);
  const cards = getCards();
  changed = false;
  for (const c of cards.done) { if (c && typeof c==='object' && c.rewardedDone===undefined) { c.rewardedDone=true; changed=true; } }
  if (changed) saveCards(cards);

  refreshHUD();
  renderTodos();
  renderKanban();

  showView('todos');
  setSidebarOpen(false);

  if (shouldShowBoot()) {
    runBootSequence(() => {
      markBootSeen();
      wire();
      syncStreakAlert();
      // welcome toast after boot
      setTimeout(() => toast('Welcome', 'Complete tasks. Build your streak.', 'reward'), 500);
    });
  } else {
    wire();
    syncStreakAlert();
    setTimeout(() => toast('Welcome back', `Streak: ${p.streak} days.`, 'default'), 600);
  }
}

init();
