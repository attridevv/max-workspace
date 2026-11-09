interface Slip {
  text: string;
  type: string;
  ts: number;
}

const KEY = 'mw-capture-demo-v1';

const form = document.getElementById('cap-form') as HTMLFormElement | null;
const input = document.getElementById('cap-input') as HTMLTextAreaElement | null;
const list = document.getElementById('cap-list');
const empty = document.getElementById('cap-empty');
const typeWrap = document.getElementById('cap-types');
const clearBtn = document.getElementById('cap-clear');

let activeType = 'Highlight';
let slips: Slip[] = [];

function load(): Slip[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(slips));
  } catch {
    /* private mode — keep the demo working in memory */
  }
}

function render() {
  if (!list) return;
  list.innerHTML = '';
  for (const [i, s] of slips.entries()) {
    const li = document.createElement('li');
    li.className = 'cap-item';

    const type = document.createElement('span');
    type.className = 'cap-item-type';
    type.textContent = s.type;

    const text = document.createElement('span');
    text.className = 'cap-item-text';
    text.textContent = s.text;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'cap-item-del';
    del.dataset.index = String(i);
    del.setAttribute('aria-label', 'Remove capture');
    del.textContent = '×';

    li.append(type, text, del);
    list.append(li);
  }
  if (empty) empty.hidden = slips.length > 0;
}

if (typeWrap) {
  typeWrap.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cap-type');
    if (!btn) return;
    activeType = btn.dataset.type || 'Highlight';
    for (const b of typeWrap.querySelectorAll<HTMLButtonElement>('.cap-type')) {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    }
  });
}

if (form && input) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    slips = [{ text: value, type: activeType, ts: Date.now() }, ...slips];
    save();
    render();
    input.value = '';
    input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
}

if (list) {
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cap-item-del');
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    slips = slips.filter((_, i) => i !== idx);
    save();
    render();
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (slips.length && !window.confirm('Clear all captures from this demo?')) return;
    slips = [];
    save();
    render();
  });
}

slips = load();
render();
