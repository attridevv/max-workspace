interface ExampleData {
  month: string;
  year: number;
  total: number;
  today: number;
  highlights: Record<string, string>;
  habits: { id: string; name: string; count: number; pct: number }[];
}

const el = document.getElementById('example-data');
if (el) {
  const data: ExampleData = JSON.parse(el.textContent || '{}');

  const grid = document.getElementById('egrid');
  const quote = document.getElementById('hl-quote');
  const dateLabel = document.getElementById('hl-date');
  const note = document.getElementById('hl-note');
  const stats = document.getElementById('habit-stats');
  const count = document.getElementById('reader-count');

  const nameButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-habit-name]'));
  const dayButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-day-btn]'));

  let selectedDay = data.today;
  let focusedHabit: string | null = null;

  function renderDay() {
    const text = data.highlights[String(selectedDay)] || 'Nothing recorded.';
    if (quote) {
      quote.style.opacity = '0';
      window.setTimeout(() => {
        quote.textContent = text;
        quote.style.opacity = '1';
      }, 120);
    }
    if (dateLabel) dateLabel.textContent = `${selectedDay} ${data.month} ${data.year}`;
    if (note) note.textContent = selectedDay === data.today ? 'today' : `highlight ${selectedDay} of ${data.total}`;
    if (count) count.textContent = `${selectedDay} / ${data.total}`;

    for (const b of dayButtons) {
      const d = Number(b.dataset.dayBtn);
      b.classList.toggle('sel', d === selectedDay);
      b.setAttribute('aria-pressed', String(d === selectedDay));
    }
    for (const h of document.querySelectorAll<HTMLElement>('.eday')) {
      const idx = h.parentElement ? Array.from(h.parentElement.children).indexOf(h) : -1;
      h.classList.toggle('sel', idx === selectedDay);
    }
  }

  function renderHabit() {
    if (grid) grid.classList.toggle('has-focus', focusedHabit !== null);
    for (const row of document.querySelectorAll<HTMLElement>('[data-habit-row]')) {
      row.classList.toggle('focused', row.dataset.habitRow === focusedHabit);
    }
    for (const b of nameButtons) {
      b.setAttribute('aria-pressed', String(b.dataset.habitName === focusedHabit));
    }
    if (stats) {
      if (focusedHabit) {
        const h = data.habits.find((x) => x.id === focusedHabit);
        stats.textContent = h ? `${h.name} — ${h.count} of ${data.total} days · ${h.pct}%` : '';
      } else {
        stats.textContent = 'Click a habit name to see its pattern';
      }
    }
  }

  if (grid) {
    grid.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const nameBtn = target.closest<HTMLButtonElement>('[data-habit-name]');
      if (nameBtn) {
        const id = nameBtn.dataset.habitName || null;
        focusedHabit = focusedHabit === id ? null : id;
        renderHabit();
        return;
      }
      const cell = target.closest<HTMLButtonElement>('.ecell');
      if (cell) {
        focusedHabit = cell.dataset.habit || null;
        selectedDay = Number(cell.dataset.day);
        renderHabit();
        renderDay();
      }
    });
  }

  for (const b of dayButtons) {
    b.addEventListener('click', () => {
      selectedDay = Number(b.dataset.dayBtn);
      renderDay();
    });
  }

  renderDay();
  renderHabit();
}
