(() => {
  'use strict';
  const root = document.getElementById('nydaymuse-profile');
  if (!root) return;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const toggle = document.getElementById('theme-toggle');
  let explicitTheme = null;
  try {
    const saved = window.localStorage.getItem('nydaymuse-theme');
    if (saved === 'light' || saved === 'dark') explicitTheme = saved;
  } catch (_) { /* Gumroad's isolated frame can disable browser storage. */ }
  const setTheme = theme => {
    root.dataset.theme = theme;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      toggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    }
  };
  setTheme(explicitTheme || (preference.matches ? 'dark' : 'light'));
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      explicitTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(explicitTheme);
      try { window.localStorage.setItem('nydaymuse-theme', explicitTheme); } catch (_) { /* In-memory preference still works. */ }
    });
  }
  preference.addEventListener('change', () => {
    if (!explicitTheme) setTheme(preference.matches ? 'dark' : 'light');
  });

  const menu = document.getElementById('profile-nav');
  const menuToggle = document.getElementById('menu-toggle');
  if (menu && menuToggle) {
    const closeMenu = () => {
      menu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    };
    menuToggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); }
    });
    document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
    window.matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);
  }
  root.classList.add('enhanced');
})();
