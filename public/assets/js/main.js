let animationObserver;

const initNavbar = () => {
  const header = document.querySelector('header');
  const toggle = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__menu');
  const dropdown = document.querySelector('.has-dropdown');
  const dropdownToggle = dropdown?.querySelector('.nav-link');
  let lastScrollY = window.scrollY;

  const closeDropdown = () => {
    if (!dropdown || !dropdownToggle) return;
    dropdown.classList.remove('nav-dropdown--open');
    dropdownToggle.setAttribute('aria-expanded', 'false');
  };

  const dropdownClickHandler = (event) => {
    event.preventDefault();
    if (!dropdown || !dropdownToggle) return;
    const shouldOpen = !dropdown.classList.contains('nav-dropdown--open');
    closeDropdown();
    if (shouldOpen) {
      dropdown.classList.add('nav-dropdown--open');
      dropdownToggle.setAttribute('aria-expanded', 'true');
    }
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('navbar__menu--open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) {
        closeDropdown();
      }
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (link === dropdownToggle) {
          return;
        }
        if (menu.classList.contains('navbar__menu--open')) {
          menu.classList.remove('navbar__menu--open');
          toggle.setAttribute('aria-expanded', 'false');
        }
        closeDropdown();
      });
    });
  }

  const handleHeaderScroll = () => {
    if (!header) return;
    const current = window.scrollY;
    if (current > 120 && current > lastScrollY) {
      header.classList.add('header--hidden');
      closeDropdown();
    } else {
      header.classList.remove('header--hidden');
    }
    lastScrollY = current;
  };

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  if (dropdown && dropdownToggle) {
    dropdownToggle.setAttribute('aria-haspopup', 'true');
    dropdownToggle.setAttribute('aria-expanded', 'false');
    dropdownToggle.addEventListener('click', dropdownClickHandler);

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    });

    const mediaQuery = window.matchMedia('(max-width: 992px)');
    mediaQuery.addEventListener('change', () => {
      closeDropdown();
    });
  }
};

const initActiveNav = () => {
  const page = document.body.dataset.page;
  if (!page) return;
  const targetLink = document.querySelector(`.nav-link[data-nav="${page}"]`);
  if (targetLink) {
    targetLink.classList.add('nav-link--active');
  }
};

const observeAnimatedElements = () => {
  if (!animationObserver) return;
  document.querySelectorAll('[data-animate]').forEach((element) => animationObserver.observe(element));
};

const initScrollAnimations = () => {
  const animatedElements = document.querySelectorAll('[data-animate]');
  if (!animatedElements.length) return;

  animationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        } else {
          entry.target.classList.remove('animate-in');
        }
      });
    },
    {
      threshold: 0.25,
    }
  );

  animatedElements.forEach((element) => animationObserver.observe(element));
};

const initSmoothAnchors = () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (event) {
      const targetId = this.getAttribute('href');
      if (targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
};

const initFooterYear = () => {
  const yearNode = document.getElementById('year');
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initActiveNav();
  if (document.body.dataset.page !== 'admin') {
    initScrollAnimations();
  }
  initSmoothAnchors();
  initFooterYear();
});

document.addEventListener('reinitialize-animations', () => {
  if (document.body.dataset.page === 'admin') {
    return;
  }
  observeAnimatedElements();
});

export { initScrollAnimations };
