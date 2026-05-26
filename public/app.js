const api = {
  hostels: '/api/hostels',
  rooms: '/api/rooms',
  students: '/api/students',
  allocations: '/api/allocations'
};

function $(selector) {
  return document.querySelector(selector);
}

function createRow(cells) {
  const row = document.createElement('tr');
  cells.forEach((cell) => {
    const td = document.createElement('td');
    td.textContent = cell;
    row.appendChild(td);
  });
  return row;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function setStatus(selector, message) {
  $(selector).textContent = message;
  setTimeout(() => { $(selector).textContent = ''; }, 4000);
}

async function reloadHostels() {
  const hostels = await fetchJson(api.hostels);
  const table = $('#hostel-table');
  table.innerHTML = '<tr><th>ID</th><th>Name</th><th>Location</th><th>Capacity</th><th>Actions</th></tr>';
  const select = $('#room-hostel');
  select.innerHTML = '<option value="">Select hostel</option>';
  hostels.forEach((hostel) => {
    const row = createRow([hostel.id, hostel.name, hostel.location, hostel.capacity]);
    const actions = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = async () => {
      await fetchJson(`${api.hostels}/${hostel.id}`, { method: 'DELETE' });
      reloadHostels();
      reloadRooms();
    };
    actions.appendChild(deleteButton);
    row.appendChild(actions);
    table.appendChild(row);

    const option = document.createElement('option');
    option.value = hostel.id;
    option.textContent = `${hostel.name} (${hostel.location})`;
    select.appendChild(option);
  });
}

async function reloadRooms() {
  const rooms = await fetchJson(api.rooms);
  const table = $('#room-table');
  table.innerHTML = '<tr><th>ID</th><th>Hostel</th><th>Number</th><th>Type</th><th>Cap.</th><th>Occ.</th><th>Actions</th></tr>';
  const roomSelect = $('#allocation-room');
  roomSelect.innerHTML = '<option value="">Select room</option>';
  rooms.forEach((room) => {
    const row = createRow([room.id, room.hostel_name, room.number, room.type, room.capacity, room.occupied]);
    const actions = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = async () => {
      await fetchJson(`${api.rooms}/${room.id}`, { method: 'DELETE' });
      reloadRooms();
    };
    actions.appendChild(deleteButton);
    row.appendChild(actions);
    table.appendChild(row);

    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = `${room.hostel_name} / ${room.number} (${room.type})`;
    roomSelect.appendChild(option);
  });
}

async function reloadStudents() {
  const students = await fetchJson(api.students);
  const table = $('#student-table');
  table.innerHTML = '<tr><th>ID</th><th>Name</th><th>Roll</th><th>Course</th><th>Phone</th><th>Email</th><th>Actions</th></tr>';
  const select = $('#allocation-student');
  select.innerHTML = '<option value="">Select student</option>';
  students.forEach((student) => {
    const row = createRow([student.id, student.name, student.roll_number, student.course, student.phone, student.email]);
    const actions = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = async () => {
      await fetchJson(`${api.students}/${student.id}`, { method: 'DELETE' });
      reloadStudents();
    };
    actions.appendChild(deleteButton);
    row.appendChild(actions);
    table.appendChild(row);

    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.name} (${student.roll_number})`;
    select.appendChild(option);
  });
}

async function reloadAllocations() {
  const allocations = await fetchJson(api.allocations);
  const table = $('#allocation-table');
  table.innerHTML = '<tr><th>ID</th><th>Student</th><th>Room</th><th>Hostel</th><th>Check In</th><th>Check Out</th><th>Actions</th></tr>';
  allocations.forEach((allocation) => {
    const row = createRow([allocation.id, `${allocation.student_name} (${allocation.roll_number})`, allocation.room_number, allocation.hostel_name, allocation.check_in, allocation.check_out]);
    const actions = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Release';
    deleteButton.onclick = async () => {
      await fetchJson(`${api.allocations}/${allocation.id}`, { method: 'DELETE' });
      reloadAllocations();
      reloadRooms();
    };
    actions.appendChild(deleteButton);
    row.appendChild(actions);
    table.appendChild(row);
  });
}

async function init() {
  try {
    await reloadHostels();
    await reloadRooms();
    await reloadStudents();
    await reloadAllocations();
  } catch (err) {
    console.error(err);
  }
}

$('#hostel-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = {
      name: $('#hostel-name').value,
      location: $('#hostel-location').value,
      capacity: Number($('#hostel-capacity').value)
    };
    await fetchJson(api.hostels, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setStatus('#hostel-status', 'Hostel saved successfully.');
    $('#hostel-form').reset();
    await reloadHostels();
  } catch (err) {
    setStatus('#hostel-status', err.message);
  }
});

$('#room-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = {
      hostel_id: Number($('#room-hostel').value),
      number: $('#room-number').value,
      type: $('#room-type').value,
      capacity: Number($('#room-capacity').value)
    };
    await fetchJson(api.rooms, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setStatus('#room-status', 'Room saved successfully.');
    $('#room-form').reset();
    await reloadRooms();
  } catch (err) {
    setStatus('#room-status', err.message);
  }
});

$('#student-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = {
      name: $('#student-name').value,
      roll_number: $('#student-roll').value,
      course: $('#student-course').value,
      phone: $('#student-phone').value,
      email: $('#student-email').value
    };
    await fetchJson(api.students, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setStatus('#student-status', 'Student added successfully.');
    $('#student-form').reset();
    await reloadStudents();
  } catch (err) {
    setStatus('#student-status', err.message);
  }
});

$('#allocation-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = {
      student_id: Number($('#allocation-student').value),
      room_id: Number($('#allocation-room').value),
      check_in: $('#allocation-checkin').value,
      check_out: $('#allocation-checkout').value
    };
    await fetchJson(api.allocations, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setStatus('#allocation-status', 'Room allocated successfully.');
    $('#allocation-form').reset();
    await reloadAllocations();
    await reloadRooms();
  } catch (err) {
    setStatus('#allocation-status', err.message);
  }
});

['#hostel-clear', '#room-clear', '#student-clear', '#allocation-clear'].forEach((selector) => {
  $(selector).addEventListener('click', () => {
    const form = $(selector).closest('section').querySelector('form');
    if (form) form.reset();
  });
});

init();
