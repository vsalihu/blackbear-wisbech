const pickEventIcon = (title = '') => {
  const normalised = title.toLowerCase();
  if (normalised.includes('jazz') || normalised.includes('live')) return 'fa-music';
  if (normalised.includes('cask') || normalised.includes('ale') || normalised.includes('beer')) return 'fa-beer-mug-empty';
  if (normalised.includes('feast') || normalised.includes('dinner') || normalised.includes('tasting')) return 'fa-utensils';
  if (normalised.includes('harvest') || normalised.includes('season')) return 'fa-leaf';
  return 'fa-star';
};

const buildEventCard = (event) => {
  const { id, title, description, date, time } = event;
  const dateTime = new Date(`${date}T${time}`);
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateTime);
  const timeLabel = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateTime);
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

const renderEvents = (events) => {
  const container = document.getElementById('eventList');
  if (!container) return;

  if (!events.length) {
    container.innerHTML = '<p data-animate>Our next events are being curated. Check back very soon.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  events
    .slice()
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    .forEach((event) => {
      fragment.appendChild(buildEventCard(event));
    });

  container.innerHTML = '';
  container.appendChild(fragment);
  document.dispatchEvent(new CustomEvent('reinitialize-animations'));
};

const fetchEvents = async () => {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error('Unable to fetch events');
    const data = await response.json();
    renderEvents(data);
  } catch (error) {
    console.error(error);
    const container = document.getElementById('eventList');
    if (container) {
      container.innerHTML = '<p data-animate>We could not load the events calendar at the moment. Please refresh later.</p>';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fetchEvents();
});
