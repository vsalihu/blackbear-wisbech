const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://blackbear-api.onrender.com';

const form = document.getElementById('performersForm');
const feedback = document.getElementById('performersFeedback');
const submitButton = form?.querySelector('button[type="submit"]');

const setFeedback = (message, type = 'success') => {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.remove('error');
  if (type === 'error') {
    feedback.classList.add('error');
  }
};

const setLoading = (isLoading) => {
  if (!submitButton) return;
  submitButton.disabled = isLoading;
  submitButton.innerHTML = isLoading
    ? '<i class="fa-solid fa-spinner fa-spin"></i> Sending...'
    : '<i class="fa-solid fa-paper-plane"></i> Send proposal';
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form) return;

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  if (!payload.name || !payload.email || !payload.message) {
    setFeedback('Name, email, and message are required.', 'error');
    return;
  }

  try {
    setLoading(true);
    const response = await fetch(`${API_BASE}/api/performers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Unable to submit.');
    }

    setLoading(false);
    form.reset();
    setFeedback('Thank you! Our bookings team will reach out soon.');
  } catch (error) {
    console.error(error);
    setLoading(false);
    setFeedback(error.message || 'Something went wrong, please try again.', 'error');
  }
});
