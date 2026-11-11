/* Accessible tabs (WAI-ARIA tabs pattern, automatic activation).
   <div data-tabs> <div role="tablist"> <button role="tab" aria-controls="p1"> … </div> <div role="tabpanel" id="p1"> … */
export function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

    const select = (index, focus = false) => {
      tabs.forEach((t, i) => {
        const on = i === index;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        const horizontalNext = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const horizontalPrev = document.documentElement.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
        let next = null;
        if (e.key === 'ArrowDown' || e.key === horizontalNext) next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowUp' || e.key === horizontalPrev) next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });
    select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')));
  });
}
