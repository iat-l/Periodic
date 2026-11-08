/* Soft scroll-in for the long editorial pages. Elements keep their normal
   layout; only opacity and translate change, so scrolling stays compositor
   friendly. Reduced-motion visitors (and browsers without IO) see everything
   immediately. */

(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const selector = [
    '#page-courses .courses-hero',
    '#page-courses .courses-level',
    '#page-courses .course-card',
    '#page-profile .profile-hero',
    '#page-profile .profile-stats',
    '#page-profile .profile-section',
  ].join(', ');

  const items = [...document.querySelectorAll(selector)];
  if (!items.length) return;

  items.forEach((el, index) => {
    el.classList.add('is-reveal');
    el.style.setProperty('--ri', String(index % 7));
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-seen');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  items.forEach((el) => observer.observe(el));
})();
