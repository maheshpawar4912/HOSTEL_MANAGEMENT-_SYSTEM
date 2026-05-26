const express = require('express');
const path = require('path');
const cors = require('cors');
const { db, initialize } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sendDbError(res, err) {
  console.error(err);
  res.status(500).json({ error: 'Database error' });
}

app.get('/api/hostels', (req, res) => {
  db.all('SELECT * FROM hostels ORDER BY id', [], (err, rows) => {
    if (err) return sendDbError(res, err);
    res.json(rows);
  });
});

app.post('/api/hostels', (req, res) => {
  const { name, location, capacity } = req.body;
  if (!name || !location || !capacity) {
    return res.status(400).json({ error: 'Name, location, and capacity are required' });
  }
  db.run(
    'INSERT INTO hostels (name, location, capacity) VALUES (?, ?, ?)',
    [name, location, capacity],
    function (err) {
      if (err) return sendDbError(res, err);
      res.json({ id: this.lastID, name, location, capacity });
    }
  );
});

app.put('/api/hostels/:id', (req, res) => {
  const { id } = req.params;
  const { name, location, capacity } = req.body;
  db.run(
    'UPDATE hostels SET name = ?, location = ?, capacity = ? WHERE id = ?',
    [name, location, capacity, id],
    function (err) {
      if (err) return sendDbError(res, err);
      res.json({ id: Number(id), name, location, capacity });
    }
  );
});

app.delete('/api/hostels/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM hostels WHERE id = ?', [id], function (err) {
    if (err) return sendDbError(res, err);
    res.json({ deleted: this.changes });
  });
});

app.get('/api/rooms', (req, res) => {
  db.all(
    `SELECT rooms.*, hostels.name AS hostel_name
     FROM rooms
     LEFT JOIN hostels ON rooms.hostel_id = hostels.id
     ORDER BY rooms.id`,
    [],
    (err, rows) => {
      if (err) return sendDbError(res, err);
      res.json(rows);
    }
  );
});

app.post('/api/rooms', (req, res) => {
  const { hostel_id, number, type, capacity } = req.body;
  if (!hostel_id || !number || !type || !capacity) {
    return res.status(400).json({ error: 'Hostel, number, type, and capacity are required' });
  }
  db.run(
    'INSERT INTO rooms (hostel_id, number, type, capacity, occupied) VALUES (?, ?, ?, ?, 0)',
    [hostel_id, number, type, capacity],
    function (err) {
      if (err) return sendDbError(res, err);
      res.json({ id: this.lastID, hostel_id, number, type, capacity, occupied: 0 });
    }
  );
});

app.put('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  const { hostel_id, number, type, capacity } = req.body;
  db.run(
    'UPDATE rooms SET hostel_id = ?, number = ?, type = ?, capacity = ? WHERE id = ?',
    [hostel_id, number, type, capacity, id],
    function (err) {
      if (err) return sendDbError(res, err);
      res.json({ id: Number(id), hostel_id, number, type, capacity });
    }
  );
});

app.delete('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM rooms WHERE id = ?', [id], function (err) {
    if (err) return sendDbError(res, err);
    res.json({ deleted: this.changes });
  });
});

app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY id', [], (err, rows) => {
    if (err) return sendDbError(res, err);
    res.json(rows);
  });
});

app.post('/api/students', (req, res) => {
  const { name, roll_number, course, phone, email } = req.body;
  if (!name || !roll_number) {
    return res.status(400).json({ error: 'Name and roll number are required' });
  }
  db.run(
    'INSERT INTO students (name, roll_number, course, phone, email) VALUES (?, ?, ?, ?, ?)',
    [name, roll_number, course || '', phone || '', email || ''],
    function (err) {
      if (err) return sendDbError(res, err);
      res.json({ id: this.lastID, name, roll_number, course, phone, email });
    }
  );
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM students WHERE id = ?', [id], function (err) {
    if (err) return sendDbError(res, err);
    res.json({ deleted: this.changes });
  });
});

app.get('/api/allocations', (req, res) => {
  db.all(
    `SELECT allocations.id, allocations.check_in, allocations.check_out,
      students.name AS student_name, students.roll_number,
      rooms.number AS room_number, rooms.type AS room_type,
      hostels.name AS hostel_name
     FROM allocations
     JOIN students ON allocations.student_id = students.id
     JOIN rooms ON allocations.room_id = rooms.id
     JOIN hostels ON rooms.hostel_id = hostels.id
     ORDER BY allocations.id`,
    [],
    (err, rows) => {
      if (err) return sendDbError(res, err);
      res.json(rows);
    }
  );
});

app.post('/api/allocations', (req, res) => {
  const { student_id, room_id, check_in, check_out } = req.body;
  if (!student_id || !room_id || !check_in) {
    return res.status(400).json({ error: 'Student, room, and check-in date are required' });
  }

  db.get('SELECT capacity, occupied FROM rooms WHERE id = ?', [room_id], (err, room) => {
    if (err) return sendDbError(res, err);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.occupied >= room.capacity) {
      return res.status(400).json({ error: 'Room is already full' });
    }

    db.run(
      'INSERT INTO allocations (student_id, room_id, check_in, check_out) VALUES (?, ?, ?, ?)',
      [student_id, room_id, check_in, check_out || ''],
      function (err) {
        if (err) return sendDbError(res, err);
        db.run('UPDATE rooms SET occupied = occupied + 1 WHERE id = ?', [room_id], (err2) => {
          if (err2) return sendDbError(res, err2);
          res.json({ id: this.lastID, student_id, room_id, check_in, check_out });
        });
      }
    );
  });
});

app.delete('/api/allocations/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT room_id FROM allocations WHERE id = ?', [id], (err, allocation) => {
    if (err) return sendDbError(res, err);
    if (!allocation) return res.status(404).json({ error: 'Allocation not found' });

    db.run('DELETE FROM allocations WHERE id = ?', [id], function (err2) {
      if (err2) return sendDbError(res, err2);
      db.run('UPDATE rooms SET occupied = MAX(occupied - 1, 0) WHERE id = ?', [allocation.room_id], (err3) => {
        if (err3) return sendDbError(res, err3);
        res.json({ deleted: this.changes });
      });
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initialize(() => {
  app.listen(PORT, () => {
    console.log(`Hostel Management System running at http://localhost:${PORT}`);
  });
});
