// backend/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

// ----- MIDDLEWARE -----
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173', // tumhara React dev URL (Vite)
    credentials: true,               // cookies allow
  })
);
app.use(cookieParser());

// ----- FAKE USERS (NO DATABASE) -----
const USERS = [
  { username: 'shubh', password: '1234' },
  { username: 'khandani', password: '7891' } // example user
];

// in-memory sessions: token -> username
const sessions = new Map();

// in-memory notes: username -> [ { id, title, details } ]
const notesByUser = new Map();

// ----- HELPER: AUTH MIDDLEWARE -----
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const username = sessions.get(token);
  req.user = username;
  next();
}

// ----- ROUTES -----

// Check if user already logged in
app.get('/api/me', (req, res) => {
  const token = req.cookies.token;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ loggedIn: false });
  }
  const username = sessions.get(token);
  return res.json({ loggedIn: true, username });
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // make session token
  const token = crypto.randomBytes(16).toString('hex');
  sessions.set(token, user.username);

  // set cookie
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
  });

  // init empty notes if first time
  if (!notesByUser.has(user.username)) {
    notesByUser.set(user.username, []);
  }

  return res.json({ message: 'Login successful', username: user.username });
});

// Logout route
app.post('/api/logout', requireAuth, (req, res) => {
  const token = req.cookies.token;
  sessions.delete(token);
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Get notes of logged in user
app.get('/api/notes', requireAuth, (req, res) => {
  const username = req.user;
  const notes = notesByUser.get(username) || [];
  res.json(notes);
});

// Add note
app.post('/api/notes', requireAuth, (req, res) => {
  const username = req.user;
  const { title, details } = req.body;

  if (!title || !details) {
    return res.status(400).json({ message: 'Title and details are required' });
  }

  const userNotes = notesByUser.get(username) || [];
  const newNote = {
    id: Date.now().toString(),
    title,
    details,
  };

  userNotes.push(newNote);
  notesByUser.set(username, userNotes);

  res.status(201).json(newNote);
});

// Delete note by id
app.delete('/api/notes/:id', requireAuth, (req, res) => {
  const username = req.user;
  const noteId = req.params.id;

  const userNotes = notesByUser.get(username) || [];
  const filtered = userNotes.filter((note) => note.id !== noteId);
  notesByUser.set(username, filtered);

  res.json({ message: 'Note deleted' });
});

// ----- START SERVER -----
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
