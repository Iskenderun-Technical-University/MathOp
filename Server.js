const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const bcrypt = require('bcrypt');
const saltRounds = 10; // Adjust based on your security needs

app.use(express.static('public'));
app.use(express.json());

// Connect to SQLite database

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the database');
  }
});

// Define the insert query for user signup
const insertQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';

// Create a table for user accounts
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL
  )
`);

// Create a table for quiz questions
db.run(`
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer INTEGER NOT NULL
  )
`);

// Create a table for quiz attempts
db.run(`
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    question_id INTEGER,
    user_answer INTEGER,
    is_correct INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
  )
`);
// Add this after your existing routes

// Create a table for user sessions
db.run(`
  CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Generate a random session ID
function generateSessionId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const sessionIdLength = 32;
  let sessionId = '';

  for (let i = 0; i < sessionIdLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    sessionId += characters.charAt(randomIndex);
  }

  return sessionId;
}

// Create a user session
app.post('/create_session', (req, res) => {
  const { user_id } = req.body;
  const sessionId = generateSessionId();

  db.run(
    'INSERT INTO user_sessions (user_id, session_id) VALUES (?, ?)',
    [user_id, sessionId],
    (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
      }

      res.status(200).json({ session_id: sessionId });
    }
  );
});



// Handle user signup
app.post('/signup', async (req, res) => {
  console.log('Received signup request:', req.body);
  const { username, password } = req.body;
  console.log('Received signup request:', { username, password });

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await new Promise((resolve, reject) => {
      db.run(insertQuery, [username, hashedPassword], (err) => {
        if (err) {
          console.error('Error during INSERT operation:', err.message);
          reject(err);
        } else {
          console.log('User account created successfully!');
          resolve();
        }
      });
    });

    res.status(200).send('User account created successfully!');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});



app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Received login request:', { username, password });

  try {
    const row = await new Promise((resolve, reject) => {
      // Check if the username exists in the database
      db.get('SELECT id, password FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    console.log('User found in the database:', row);

    if (row) {
      const match = await bcrypt.compare(password, row.password);

      if (match) {
        res.status(200).json({ userId: row.id });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Get a random quiz question for the user
app.get('/get-quiz-question', (req, res) => {
  db.get('SELECT * FROM quiz_questions ORDER BY RANDOM() LIMIT 1', (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Internal Server Error');
    }

    res.status(200).json(row);
  });
});

// Record a quiz attempt
app.post('/record-quiz-attempt', (req, res) => {
  const { user_id, question_id, user_answer, is_correct, start_time, end_time } = req.body;

  db.run(
    'INSERT INTO quiz_attempts (user_id, question_id, user_answer, is_correct, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, question_id, user_answer, is_correct, start_time, end_time],
    (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
      }

      res.status(200).json({ message: 'Quiz attempt recorded successfully!' });
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


// Close the SQLite database connection on application shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Disconnected from the database');
      process.exit(0);
    }
  });
});
