const buildGalleryItem = (item) => {
  const container = document.createElement('article');
  container.className = 'gallery-item';
  container.dataset.id = item.id;
  container.dataset.animate = '';
  container.innerHTML = `
    <img src="${item.imageUrl}" alt="${item.title || 'Blackbear Wisbech'}" loading="lazy" />
    <div class="gallery-item__caption">${item.title || ''}</div>
  `;
  return container;
};

const openLightbox = (imageUrl, caption) => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  if (!lightbox || !lightboxImage || !lightboxCaption) return;

  lightboxImage.src = imageUrl;
  lightboxCaption.textContent = caption || '';
  lightbox.classList.add('lightbox--open');
  lightbox.setAttribute('aria-hidden', 'false');
};

const closeLightbox = () => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  lightbox.classList.remove('lightbox--open');
  lightbox.setAttribute('aria-hidden', 'true');
};

const initLightboxInteractions = () => {
  const lightbox = document.getElementById('lightbox');
  const closeButton = document.querySelector('.lightbox__close');
  if (closeButton) {
    closeButton.addEventListener('click', closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.classList.contains('lightbox--open')) {
        closeLightbox();
      }
    });
  }
};

const initGallery = async () => {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  try {
    const response = await fetch('/api/gallery');
    if (!response.ok) throw new Error('Unable to fetch gallery');
    const items = await response.json();

    if (!items.length) {
      grid.innerHTML = '<p data-animate>The gallery is being refreshed. Check back shortly.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const galleryItem = buildGalleryItem(item);
      fragment.appendChild(galleryItem);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);

    grid.addEventListener('click', (event) => {
      const target = event.target.closest('.gallery-item');
      if (!target) return;
      const image = target.querySelector('img');
      const caption = target.querySelector('.gallery-item__caption');
      if (image) {
        openLightbox(image.src, caption?.textContent);
      }
    });

    document.dispatchEvent(new CustomEvent('reinitialize-animations'));
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<p data-animate>We could not retrieve the gallery right now. Please try again later.</p>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initLightboxInteractions();
});
