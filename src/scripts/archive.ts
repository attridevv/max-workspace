const tabs = document.querySelectorAll<HTMLButtonElement>('[data-month-tab]');
const panels = document.querySelectorAll<HTMLElement>('[data-month-panel]');

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    const id = tab.dataset.monthTab;
    for (const t of tabs) {
      const on = t.dataset.monthTab === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    }
    for (const p of panels) {
      p.classList.toggle('active', p.dataset.monthPanel === id);
    }
  });
}
