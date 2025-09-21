const initMenuScrollSpy = () => {
  const sections = document.querySelectorAll('[data-menu-section]');
  if (!sections.length) return;
  const links = Array.from(document.querySelectorAll('.has-dropdown .nav-dropdown a'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => link.classList.remove('nav-link--active'));
          const activeLink = links.find((link) => link.getAttribute('href') === `#${entry.target.id}`);
          if (activeLink) {
            activeLink.classList.add('nav-link--active');
          }
        }
      });
    },
    {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.menu-section').forEach((section) => section.setAttribute('data-menu-section', ''));
  initMenuScrollSpy();
});
