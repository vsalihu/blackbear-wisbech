const state = {
  editingEventId: null,
  token: null,
};

const STORAGE_KEY = 'blackbearAdminToken';

const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://blackbear-api.onrender.com'; // replace with your API URL

const elements = {
  authOverlay: document.getElementById('adminAuth'),
  authError: document.getElementById('adminAuthError'),
  shell: document.getElementById('adminShell'),
  loginForm: document.getElementById('adminLoginForm'),
  passwordInput: document.getElementById('adminPassword'),
  logoutButton: document.getElementById('adminLogout'),
  eventForm: document.getElementById('eventForm'),
  eventResetButton: document.getElementById('eventResetButton'),
  eventsTable: document.getElementById('eventsTable'),
  galleryForm: document.getElementById('galleryForm'),
  galleryTable: document.getElementById('galleryTable'),
  galleryUpload: document.getElementById('galleryUpload'),
  galleryImageUrl: document.getElementById('galleryImage'),
  performerTable: document.getElementById('performerTable'),
};

const saveToken = (token) => {
  state.token = token;
  localStorage.setItem(STORAGE_KEY, token);
};

const clearToken = () => {
  state.token = null;
  localStorage.removeItem(STORAGE_KEY);
};

const showAuthOverlay = () => {
  elements.authOverlay.classList.add('admin-auth--visible');
  elements.shell.setAttribute('aria-hidden', 'true');
};

const hideAuthOverlay = () => {
  elements.authOverlay.classList.remove('admin-auth--visible');
  elements.shell.removeAttribute('aria-hidden');
};

const handleUnauthorized = () => {
  clearToken();
  showAuthOverlay();
  if (elements.authError) {
    elements.authError.textContent = 'Session expired. Please sign in again.';
  }
  if (elements.passwordInput) {
    elements.passwordInput.focus();
  }
};

const request = async (path, { method = 'GET', body, isForm = false } = {}) => {
  const headers = {};
  if (state.token) {
    headers['x-admin-token'] = state.token;
  }

  const options = { method, headers };

  if (isForm) {
    options.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, options);

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
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
  const container = elements.eventsTable;
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
  const container = elements.galleryTable;
  if (!container) return;
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<p><i class="fa-solid fa-circle-info"></i> Add a photo to populate the View Space gallery.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.appendChild(buildGalleryRow(item)));
  container.appendChild(fragment);
};

const renderPerformersTable = (items) => {
  const container = elements.performerTable;
  if (!container) return;
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<p><i class="fa-solid fa-circle-info"></i> No enquiries yet. When performers reach out they will appear here.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const created = new Date(item.createdAt || Date.now()).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const card = document.createElement('article');
    card.className = 'admin-performer-card';
    card.dataset.id = item.id;
    card.innerHTML = `
      <header class="admin-performer-card__header">
        <div>
          <h4>${item.name}</h4>
          <p class="admin-performer-card__meta"><i class="fa-solid fa-calendar-plus"></i> ${created}</p>
        </div>
        <div class="admin-performer-card__actions">
          <a class="admin-icon-button" href="mailto:${item.email}" title="Reply"><i class="fa-solid fa-envelope"></i> Email</a>
          <button class="admin-icon-button admin-icon-button--danger" data-action="delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i> Remove</button>
        </div>
      </header>
      <dl class="admin-performer-card__details">
        <div><dt>Email</dt><dd><a href="mailto:${item.email}">${item.email}</a></dd></div>
        ${item.actType ? `<div><dt>Act</dt><dd>${item.actType}</dd></div>` : ''}
        ${item.availability ? `<div><dt>Availability</dt><dd>${item.availability}</dd></div>` : ''}
        ${item.promoLink ? `<div><dt>Promo</dt><dd><a href="${item.promoLink}" target="_blank" rel="noreferrer">${item.promoLink}</a></dd></div>` : ''}
      </dl>
      <p class="admin-performer-card__message">${item.message}</p>
    `;
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
};

const loadEvents = () => request('/api/events').then(renderEventsTable);
const loadGallery = () => request('/api/gallery').then(renderGalleryTable);
const loadPerformers = () => request('/api/performers').then(renderPerformersTable);

const bootstrapData = async () => {
  await Promise.all([loadEvents(), loadGallery(), loadPerformers()]);
};

const resetEventForm = () => {
  if (!elements.eventForm) return;
  elements.eventForm.reset();
  const hiddenId = document.getElementById('eventId');
  if (hiddenId) hiddenId.value = '';
  state.editingEventId = null;
  const submitLabel = document.getElementById('eventSubmitLabel');
  if (submitLabel) {
    submitLabel.textContent = 'Add event';
  }
};

const populateEventForm = (event) => {
  if (!elements.eventForm) return;
  state.editingEventId = event.id;
  document.getElementById('eventId').value = event.id;
  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventDescription').value = event.description;
  document.getElementById('eventDate').value = event.date;
  document.getElementById('eventTime').value = event.time;
  const submitLabel = document.getElementById('eventSubmitLabel');
  if (submitLabel) {
    submitLabel.textContent = 'Update event';
  }
};

const handleEventFormSubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    if (state.editingEventId) {
      await request(`/api/events/${state.editingEventId}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      await request('/api/events', {
        method: 'POST',
        body: payload,
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
      const events = await request('/api/events');
      const current = events.find((item) => item.id === id);
      if (current) {
        populateEventForm(current);
        window.scrollTo({ top: elements.eventForm.offsetTop - 120, behavior: 'smooth' });
      }
    } catch (error) {
      alert(`Unable to fetch event details. ${error.message}`);
    }
  }

  if (action === 'delete') {
    const confirmDelete = window.confirm('Delete this event? This will remove it from the events page.');
    if (!confirmDelete) return;

    try {
      await request(`/api/events/${id}`, { method: 'DELETE' });
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
  const fileInput = elements.galleryUpload;
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;
  const title = (formData.get('title') || '').trim();
  const imageUrl = (formData.get('imageUrl') || '').trim();

  try {
    if (file) {
      const uploadData = new FormData();
      uploadData.append('image', file);
      if (title) uploadData.append('title', title);
      if (imageUrl) uploadData.append('imageUrl', imageUrl);
      await request('/api/gallery', { method: 'POST', body: uploadData, isForm: true });
    } else if (imageUrl) {
      await request('/api/gallery', {
        method: 'POST',
        body: { imageUrl, title },
      });
    } else {
      alert('Please upload a photo or provide an image link.');
      return;
    }

    form.reset();
    if (fileInput) fileInput.value = '';
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
    await request(`/api/gallery/${id}`, { method: 'DELETE' });
    await loadGallery();
  } catch (error) {
    alert(`Unable to remove the image. ${error.message}`);
  }
};

const handlePerformerTableClick = async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (!id) return;

  if (action === 'delete') {
    const confirmed = window.confirm('Remove this enquiry?');
    if (!confirmed) return;

    try {
      await request(`/api/performers/${id}`, { method: 'DELETE' });
      await loadPerformers();
    } catch (error) {
      alert(`Unable to remove the enquiry. ${error.message}`);
    }
  }
};

const handleLoginSubmit = async (event) => {
  event.preventDefault();
  const password = elements.passwordInput.value.trim();
  if (!password) {
    elements.authError.textContent = 'Password is required.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Invalid password');
    }

    const data = await response.json();
    saveToken(data.token);
    elements.loginForm.reset();
    elements.authError.textContent = '';
    hideAuthOverlay();
    await bootstrapData();
  } catch (error) {
    elements.authError.textContent = error.message || 'Unable to authenticate.';
  }
};

const handleLogout = async () => {
  try {
    if (state.token) {
      await request('/api/admin/logout', { method: 'POST' });
    }
  } catch (error) {
    console.warn('Logout request failed', error);
  } finally {
    clearToken();
    showAuthOverlay();
    resetEventForm();
    if (elements.galleryForm) elements.galleryForm.reset();
    if (elements.galleryTable) elements.galleryTable.innerHTML = '';
    if (elements.eventsTable) elements.eventsTable.innerHTML = '';
    if (elements.performerTable) elements.performerTable.innerHTML = '';
  }
};

const initAdmin = async () => {
  const storedToken = localStorage.getItem(STORAGE_KEY);
  if (storedToken) {
    state.token = storedToken;
    try {
      hideAuthOverlay();
      await bootstrapData();
      return;
    } catch (error) {
      handleUnauthorized();
    }
  }

  showAuthOverlay();
};

const bindEvents = () => {
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', handleLoginSubmit);
  }

  if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', handleLogout);
  }

  if (elements.eventForm) {
    elements.eventForm.addEventListener('submit', handleEventFormSubmit);
  }

  if (elements.eventResetButton) {
    elements.eventResetButton.addEventListener('click', resetEventForm);
  }

  if (elements.eventsTable) {
    elements.eventsTable.addEventListener('click', handleEventsTableClick);
  }

  if (elements.galleryForm) {
    elements.galleryForm.addEventListener('submit', handleGalleryFormSubmit);
  }

  if (elements.galleryTable) {
    elements.galleryTable.addEventListener('click', handleGalleryTableClick);
  }

  if (elements.performerTable) {
    elements.performerTable.addEventListener('click', handlePerformerTableClick);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  initAdmin();
});
