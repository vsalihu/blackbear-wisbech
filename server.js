const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const DataStore = require('./lib/dataStore');

const app = express();
const PORT = process.env.PORT || 3000;

const eventsStore = new DataStore('events.json');
const galleryStore = new DataStore('gallery.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Events API
app.get('/api/events', asyncHandler(async (req, res) => {
  const events = await eventsStore.read();
  const sorted = events.slice().sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  res.json(sorted);
}));

app.post('/api/events', asyncHandler(async (req, res) => {
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

app.put('/api/events/:id', asyncHandler(async (req, res) => {
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

app.delete('/api/events/:id', asyncHandler(async (req, res) => {
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

// Gallery API
app.get('/api/gallery', asyncHandler(async (req, res) => {
  const gallery = await galleryStore.read();
  res.json(gallery);
}));

app.post('/api/gallery', asyncHandler(async (req, res) => {
  const { imageUrl, title } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required.' });
  }

  const gallery = await galleryStore.read();
  const newItem = {
    id: uuidv4(),
    imageUrl,
    title: title || '',
    createdAt: new Date().toISOString(),
  };
  gallery.push(newItem);
  await galleryStore.write(gallery);
  res.status(201).json(newItem);
}));

app.delete('/api/gallery/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const gallery = await galleryStore.read();
  const index = gallery.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Image not found.' });
  }

  const [removed] = gallery.splice(index, 1);
  await galleryStore.write(gallery);
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
  console.error(err);
  res.status(500).json({ message: 'Unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Blackbear server listening on http://localhost:${PORT}`);
});
