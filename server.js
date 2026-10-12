const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ===================== DB HELPERS =====================
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { karyawan: [], makanan: [], pakaian: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function genId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ===================== CRUD ROUTER FACTORY =====================
function createCrudRouter(resource) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const db = readDB();
    res.json({ success: true, data: db[resource] });
  });

  router.get('/:id', (req, res) => {
    const db = readDB();
    const item = db[resource].find(x => String(x.id) === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    res.json({ success: true, data: item });
  });

  router.post('/', (req, res) => {
    const db = readDB();
    const newItem = { id: genId(), ...req.body };
    db[resource].push(newItem);
    writeDB(db);
    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan.', data: newItem });
  });

  router.put('/:id', (req, res) => {
    const db = readDB();
    const idx = db[resource].findIndex(x => String(x.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    db[resource][idx] = { ...db[resource][idx], ...req.body, id: db[resource][idx].id };
    writeDB(db);
    res.json({ success: true, message: 'Data berhasil diperbarui.', data: db[resource][idx] });
  });

  router.delete('/:id', (req, res) => {
    const db = readDB();
    const idx = db[resource].findIndex(x => String(x.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    const deleted = db[resource].splice(idx, 1)[0];
    writeDB(db);
    res.json({ success: true, message: 'Data berhasil dihapus.', data: deleted });
  });

  return router;
}

// ===================== API ROUTES =====================
app.use('/api/karyawan', createCrudRouter('karyawan'));
app.use('/api/makanan',  createCrudRouter('makanan'));
app.use('/api/pakaian',  createCrudRouter('pakaian'));

app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
    counts: {
      karyawan: db.karyawan.length,
      makanan:  db.makanan.length,
      pakaian:  db.pakaian.length,
    }
  });
});

// ===================== PAGE ROUTES =====================
app.get('/',          (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login',     (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/karyawan',  (req, res) => res.sendFile(path.join(__dirname, 'karyawan.html')));
app.get('/makanan',   (req, res) => res.sendFile(path.join(__dirname, 'makanan.html')));
app.get('/pakaian',   (req, res) => res.sendFile(path.join(__dirname, 'pakaian.html')));
// Legacy redirect
app.get('/dashboard.html', (req, res) => res.redirect('/karyawan'));

// ===================== START =====================
app.listen(PORT, () => {
  console.log(`\n🧪 QA Demo API Server running!`);
  console.log(`📡 API Base   : http://localhost:${PORT}/api`);
  console.log(`🌐 Web App    : http://localhost:${PORT}`);
  console.log(`\nPage Routes:`);
  console.log(`  GET  /              → Login`);
  console.log(`  GET  /karyawan      → Halaman Karyawan`);
  console.log(`  GET  /makanan       → Halaman Makanan`);
  console.log(`  GET  /pakaian       → Halaman Pakaian`);
  console.log(`\nAPI Endpoints (contoh untuk karyawan):`);
  console.log(`  GET    /api/karyawan`);
  console.log(`  GET    /api/karyawan/:id`);
  console.log(`  POST   /api/karyawan`);
  console.log(`  PUT    /api/karyawan/:id`);
  console.log(`  DELETE /api/karyawan/:id`);
  console.log('\nPress Ctrl+C to stop.\n');
});
