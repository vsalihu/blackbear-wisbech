const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const DataStore = require('./lib/dataStore');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'blackbear-admin';
const adminTokens = new Set();

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed.'));
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 8 * 1024 * 1024 },
});

const eventsStore = new DataStore('events.json');
const galleryStore = new DataStore('gallery.json');

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.adminToken = token;
  next();
};

app.post('/api/admin/login', asyncHandler(async (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid password.' });
  }

  const token = uuidv4();
  adminTokens.add(token);
  res.json({ token });
}));

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  adminTokens.delete(req.adminToken);
  res.status(204).end();
});

app.get('/api/events', asyncHandler(async (req, res) => {
  const events = await eventsStore.read();
  const sorted = events.slice().sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  res.json(sorted);
}));

app.post('/api/events', requireAdmin, asyncHandler(async (req, res) => {
  const { title, description, date, time } = req.body;
  if (!title || !description || !date || !time) {
    return res.status(400).json({ message: 'Title, description, date, and time are required.' });
  }

  const dateTime = new Date(`${date}T${time}`);
  if (Number.isNaN(dateTime.getTime())) {
    return res.status(400).json({ message: 'Invalid date or time format.' });
  }

  const events = await eventsStore.read();
  const newEvent = {
    id: uuidv4(),
    title,
    description,
    date,
    time,
    dateTime: dateTime.toISOString(),
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  await eventsStore.write(events);
  res.status(201).json(newEvent);
}));

app.put('/api/events/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time } = req.body;
  const dateTime = new Date(`${date}T${time}`);
  if (!title || !description || !date || !time || Number.isNaN(dateTime.getTime())) {
    return res.status(400).json({ message: 'Valid title, description, date, and time are required.' });
  }

  const events = await eventsStore.read();
  const index = events.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  const updatedEvent = {
    ...events[index],
    title,
    description,
    date,
    time,
    dateTime: dateTime.toISOString(),
    updatedAt: new Date().toISOString(),
  };

  events[index] = updatedEvent;
  await eventsStore.write(events);
  res.json(updatedEvent);
}));

app.delete('/api/events/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const events = await eventsStore.read();
  const index = events.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  const [removed] = events.splice(index, 1);
  await eventsStore.write(events);
  res.json(removed);
}));

app.get('/api/gallery', asyncHandler(async (req, res) => {
  const gallery = await galleryStore.read();
  res.json(gallery);
}));

app.post('/api/gallery', requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
  let { imageUrl, title } = req.body;
  if (typeof title !== 'string') {
    title = '';
  }

  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  } else if (imageUrl) {
    imageUrl = imageUrl.trim();
  }

  if (!imageUrl) {
    return res.status(400).json({ message: 'Provide an image upload or a hosted image URL.' });
  }

  const gallery = await galleryStore.read();
  const newItem = {
    id: uuidv4(),
    imageUrl,
    title: title.trim(),
    createdAt: new Date().toISOString(),
  };
  gallery.push(newItem);
  await galleryStore.write(gallery);
  res.status(201).json(newItem);
}));

app.delete('/api/gallery/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const gallery = await galleryStore.read();
  const index = gallery.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Image not found.' });
  }

  const [removed] = gallery.splice(index, 1);
  await galleryStore.write(gallery);

  if (removed.imageUrl && removed.imageUrl.startsWith('/uploads/')) {
    const relativePath = removed.imageUrl.replace(/^\/+/, '');
    const fileOnDisk = path.join(__dirname, 'public', relativePath);
    if (fileOnDisk.startsWith(uploadsDir)) {
      fs.promises.unlink(fileOnDisk).catch(() => {});
    }
  }

  res.json(removed);
}));

const pageRoutes = {
  '/': 'index.html',
  '/menu': 'menu.html',
  '/events': 'events.html',
  '/view-space': 'view-space.html',
  '/admin': 'admin.html',
};

Object.entries(pageRoutes).forEach(([route, fileName]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', fileName));
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image uploads are allowed.') {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: 'Unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Blackbear server listening on http://localhost:${PORT}`);
});
