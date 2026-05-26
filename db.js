const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'hostel.db'));

function initialize(callback) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS hostels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        capacity INTEGER NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostel_id INTEGER NOT NULL,
        number TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        occupied INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(hostel_id) REFERENCES hostels(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        roll_number TEXT NOT NULL UNIQUE,
        course TEXT,
        phone TEXT,
        email TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `, callback);
  });
}

module.exports = { db, initialize };
