(() => {
  'use strict';

  const menu = document.querySelector('#primary-nav');
  const toggle = document.querySelector('.menu-toggle');
  if (menu && toggle) {
    const closeMenu = () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    };
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) closeMenu();
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
  }

  const filters = document.querySelector('.filters');
  const cards = [...document.querySelectorAll('.tool-card[data-category]')];
  const filterStatus = document.querySelector('#filter-status');
  if (filters && cards.length) {
    filters.hidden = false;
    filters.addEventListener('click', event => {
      const button = event.target.closest('button[data-filter]');
      if (!button) return;
      const category = button.dataset.filter;
      filters.querySelectorAll('button').forEach(filter => {
        filter.setAttribute('aria-pressed', String(filter === button));
      });
      let visible = 0;
      cards.forEach(card => {
        card.hidden = category !== 'all' && card.dataset.category !== category;
        if (!card.hidden) visible += 1;
      });
      if (filterStatus) filterStatus.textContent = `${visible} ${visible === 1 ? 'tool' : 'tools'} shown.`;
    });
  }

  const rate = document.querySelector('#demo-rate');
  const hours = document.querySelector('#demo-hours');
  const total = document.querySelector('#demo-total');
  if (rate && hours && total) {
    rate.disabled = false;
    hours.disabled = false;
    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
    const hint = document.querySelector('#demo-hint');
    const updateTotal = () => {
      const validRate = rate.value !== '' && rate.validity.valid;
      const validHours = hours.value !== '' && hours.validity.valid;
      const valid = validRate && validHours;
      rate.setAttribute('aria-invalid', String(!validRate));
      hours.setAttribute('aria-invalid', String(!validHours));
      total.value = valid ? currency.format(rate.valueAsNumber * hours.valueAsNumber) : '—';
      total.parentElement.classList.toggle('is-wide', total.value.length > 12);
      if (hint) hint.textContent = valid
        ? 'Try your numbers. Hourly rate × hours, before extras.'
        : 'Use a rate of $0–$100,000 and 0–100,000 hours in quarter-hour steps.';
    };
    rate.addEventListener('input', updateTotal);
    hours.addEventListener('input', updateTotal);
    updateTotal();
  }

  // Navigation collapses only after its controls are wired up.
  document.documentElement.classList.add('js');
})();
