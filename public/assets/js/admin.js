const state = {
  editingEventId: null,
};

const fetchJSON = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  if (response.status === 204) return null;
  return response.json();
};

const getEventIconClass = (title = '') => {
  const normalised = title.toLowerCase();
  if (normalised.includes('jazz') || normalised.includes('live')) return 'fa-music';
  if (normalised.includes('cask') || normalised.includes('ale') || normalised.includes('beer')) return 'fa-beer-mug-empty';
  if (normalised.includes('feast') || normalised.includes('dinner') || normalised.includes('tasting')) return 'fa-utensils';
  if (normalised.includes('harvest') || normalised.includes('season')) return 'fa-leaf';
  return 'fa-star';
};

const buildEventRow = (event) => {
  const wrapper = document.createElement('article');
  wrapper.className = 'admin-table__item';
  wrapper.dataset.id = event.id;
  const eventDate = new Date(event.dateTime);
  const dateLabel = eventDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const iconClass = getEventIconClass(event.title);

  wrapper.innerHTML = `
    <div>
      <h3 class="event-card__title">
        <span class="event-card__icon"><i class="fa-solid ${iconClass}"></i></span>
        <span class="event-card__title-text">${event.title}</span>
      </h3>
      <p class="event-card__description">${event.description}</p>
    </div>
    <div class="admin-table__meta">
      <span><i class="fa-solid fa-calendar-day"></i> ${dateLabel}</span>
      <span><i class="fa-solid fa-clock"></i> ${event.time}</span>
    </div>
    <div class="admin-table__actions">
      <button class="admin-icon-button" data-action="edit" data-id="${event.id}"><i class="fa-solid fa-pen"></i> Edit</button>
      <button class="admin-icon-button admin-icon-button--danger" data-action="delete" data-id="${event.id}"><i class="fa-solid fa-trash"></i> Delete</button>
    </div>
  `;
  return wrapper;
};

const buildGalleryRow = (item) => {
  const wrapper = document.createElement('article');
  wrapper.className = 'admin-table__item';
  wrapper.dataset.id = item.id;
  wrapper.innerHTML = `
    <div style="display:flex; align-items:center; gap:1rem;">
      <div style="width:72px;height:72px;overflow:hidden;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
        <img src="${item.imageUrl}" alt="${item.title || 'Gallery image'}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div>
        <h3 class="menu-card__title" style="margin:0;font-size:1.1rem;">
          <span class="menu-card__icon"><i class="fa-solid fa-image"></i></span>${item.title || 'Untitled image'}
        </h3>
        <p style="color:rgba(247,247,251,0.6);font-size:0.85rem;word-break:break-all;">
          <i class="fa-solid fa-link"></i> ${item.imageUrl}
        </p>
      </div>
    </div>
    <div class="admin-table__actions">
      <button class="admin-icon-button admin-icon-button--danger" data-action="remove-image" data-id="${item.id}"><i class="fa-solid fa-trash"></i> Remove</button>
    </div>
  `;
  return wrapper;
};

const renderEventsTable = (events) => {
  const container = document.getElementById('eventsTable');
  if (!container) return;
  container.innerHTML = '';

  if (!events.length) {
    container.innerHTML = '<p><i class="fa-solid fa-circle-info"></i> No events yet. Add your first to see it listed here.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  events
    .slice()
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    .forEach((event) => fragment.appendChild(buildEventRow(event)));

  container.appendChild(fragment);
};

const renderGalleryTable = (items) => {
  const container = document.getElementById('galleryTable');
  if (!container) return;
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<p><i class="fa-solid fa-circle-info"></i> The gallery is empty. Add an image URL to populate the View Space.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.appendChild(buildGalleryRow(item)));
  container.appendChild(fragment);
};

const loadEvents = async () => {
  const events = await fetchJSON('/api/events');
  renderEventsTable(events);
};

const loadGallery = async () => {
  const gallery = await fetchJSON('/api/gallery');
  renderGalleryTable(gallery);
};

const resetEventForm = () => {
  const form = document.getElementById('eventForm');
  if (!form) return;
  form.reset();
  state.editingEventId = null;
  document.getElementById('eventSubmitLabel').textContent = 'Add Event';
};

const populateEventForm = (event) => {
  const form = document.getElementById('eventForm');
  if (!form) return;
  state.editingEventId = event.id;
  document.getElementById('eventId').value = event.id;
  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventDescription').value = event.description;
  document.getElementById('eventDate').value = event.date;
  document.getElementById('eventTime').value = event.time;
  document.getElementById('eventSubmitLabel').textContent = 'Update Event';
  window.scrollTo({ top: form.offsetTop - 120, behavior: 'smooth' });
};

const handleEventFormSubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    if (state.editingEventId) {
      await fetchJSON(`/api/events/${state.editingEventId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJSON('/api/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    await loadEvents();
    resetEventForm();
  } catch (error) {
    alert(`We could not save the event. ${error.message}`);
  }
};

const handleEventsTableClick = async (event) => {
  const target = event.target.closest('button[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!id) return;

  if (action === 'edit') {
    try {
      const events = await fetchJSON('/api/events');
      const current = events.find((item) => item.id === id);
      if (current) {
        populateEventForm(current);
      }
    } catch (error) {
      alert(`Unable to fetch event details. ${error.message}`);
    }
  }

  if (action === 'delete') {
    const confirmDelete = window.confirm('Delete this event? This will remove it from the events page.');
    if (!confirmDelete) return;

    try {
      await fetchJSON(`/api/events/${id}`, { method: 'DELETE' });
      await loadEvents();
      if (state.editingEventId === id) {
        resetEventForm();
      }
    } catch (error) {
      alert(`Could not delete the event. ${error.message}`);
    }
  }
};

const handleGalleryFormSubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    await fetchJSON('/api/gallery', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    form.reset();
    await loadGallery();
  } catch (error) {
    alert(`We could not add the image. ${error.message}`);
  }
};

const handleGalleryTableClick = async (event) => {
  const target = event.target.closest('button[data-action="remove-image"]');
  if (!target) return;
  const id = target.dataset.id;
  if (!id) return;

  const confirmDelete = window.confirm('Remove this image from the View Space?');
  if (!confirmDelete) return;

  try {
    await fetchJSON(`/api/gallery/${id}`, { method: 'DELETE' });
    await loadGallery();
  } catch (error) {
    alert(`Unable to remove the image. ${error.message}`);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const eventForm = document.getElementById('eventForm');
  const galleryForm = document.getElementById('galleryForm');
  const eventsTable = document.getElementById('eventsTable');
  const galleryTable = document.getElementById('galleryTable');

  if (eventForm) {
    eventForm.addEventListener('submit', handleEventFormSubmit);
  }
  if (eventsTable) {
    eventsTable.addEventListener('click', handleEventsTableClick);
  }
  if (galleryForm) {
    galleryForm.addEventListener('submit', handleGalleryFormSubmit);
  }
  if (galleryTable) {
    galleryTable.addEventListener('click', handleGalleryTableClick);
  }

  try {
    await Promise.all([loadEvents(), loadGallery()]);
  } catch (error) {
    console.error(error);
  }
});
