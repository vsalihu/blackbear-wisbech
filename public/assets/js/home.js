const initHeroShrink = () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const handleScroll = () => {
    if (window.scrollY > 30) {
      hero.classList.add('hero--shrink');
    } else {
      hero.classList.remove('hero--shrink');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();
};

const formatDate = (date, time) => {
  const dateTime = new Date(`${date}T${time}`);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    dateLabel: formatter.format(dateTime),
    timeLabel: timeFormatter.format(dateTime),
  };
};

const pickEventIcon = (title = '') => {
  const normalised = title.toLowerCase();
  if (normalised.includes('jazz') || normalised.includes('live')) return 'fa-music';
  if (normalised.includes('cask') || normalised.includes('ale') || normalised.includes('beer')) return 'fa-beer-mug-empty';
  if (normalised.includes('feast') || normalised.includes('dinner') || normalised.includes('tasting')) return 'fa-utensils';
  if (normalised.includes('harvest') || normalised.includes('season')) return 'fa-leaf';
  return 'fa-star';
};

const renderEvent = (event) => {
  const { id, title, description, date, time } = event;
  const { dateLabel, timeLabel } = formatDate(date, time);
  const iconClass = pickEventIcon(title);

  const wrapper = document.createElement('article');
  wrapper.className = 'event-card';
  wrapper.dataset.animate = '';
  wrapper.dataset.id = id;
  wrapper.innerHTML = `
    <div class="event-card__header">
      <h3 class="event-card__title">
        <span class="event-card__icon"><i class="fa-solid ${iconClass}"></i></span>
        <span class="event-card__title-text">${title}</span>
      </h3>
      <span class="event-card__datetime"><i class="fa-solid fa-calendar-day"></i> ${dateLabel} &bull; <i class="fa-solid fa-clock"></i> ${timeLabel}</span>
    </div>
    <p class="event-card__description">${description}</p>
  `;
  return wrapper;
};

const initEventsPreview = async () => {
  const container = document.getElementById('eventsPreview');
  if (!container) return;

  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error('Failed to load events');
    const events = await response.json();

    if (!events.length) {
      container.innerHTML = '<p data-animate>No upcoming events just yet &mdash; check back soon.</p>';
      return;
    }

    const preview = events.slice(0, 3);
    const fragment = document.createDocumentFragment();
    preview.forEach((item) => {
      fragment.appendChild(renderEvent(item));
    });
    container.innerHTML = '';
    container.appendChild(fragment);

    document.dispatchEvent(new CustomEvent('reinitialize-animations'));
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p data-animate>Events are taking a little longer to pour. Please refresh in a moment.</p>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initHeroShrink();
  initEventsPreview();
});
