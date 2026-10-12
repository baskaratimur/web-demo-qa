// ===================== CONFIG & ENVIRONMENT =====================
// Deteksi otomatis apakah aplikasi jalan di GitHub Pages, file://, atau server lokal
const isStaticHost =
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:' ||
  (window.location.port !== '3000' && !window.location.hostname.includes('localhost'));

const API_BASE = '/api';

// ===================== DEFAULT SEED DATA (Untuk GitHub Pages & LocalStorage) =====================
const DEFAULT_DATA = {
  karyawan: [
    {
      id: 1791790878307,
      nama: 'Bagus Setiawan',
      nik: '3276111',
      jabatan: 'Staff',
      departemen: 'IT & Engineering',
      bergabung: '2025-12-31',
      status: 'Aktif'
    },
    {
      id: 1791790878308,
      nama: 'Sarah Amanda',
      nik: '3276222',
      jabatan: 'Supervisor',
      departemen: 'Marketing & Sales',
      bergabung: '2024-05-15',
      status: 'Aktif'
    }
  ],
  makanan: [
    {
      id: 1791790878401,
      nama: 'Nasi Goreng Spesial',
      kategori: 'Makanan Berat',
      harga: '25000',
      stok: '30',
      kalori: '450',
      deskripsi: 'Nasi goreng dengan telur dan ayam suwir',
      tersedia: 'Tersedia'
    },
    {
      id: 1791790878402,
      nama: 'Es Teh Manis Segar',
      kategori: 'Minuman',
      harga: '5000',
      stok: '50',
      kalori: '90',
      deskripsi: 'Es teh jasmine manis dingin',
      tersedia: 'Tersedia'
    }
  ],
  pakaian: [
    {
      id: 1791790371659,
      nama: 'Kaos Metal',
      merek: 'Metalica',
      gender: 'Pria',
      ukuran: ['XL'],
      kondisi: 'Baru',
      warna: 'Biru Marun',
      warna_hex: '#6c63ff',
      harga: '26000',
      stok: '5'
    }
  ]
};

// ===================== LOCAL STORAGE DB ADAPTER =====================
const LocalDB = {
  _getKey(resource) {
    return 'qa_db_' + resource;
  },
  _get(resource) {
    const raw = localStorage.getItem(this._getKey(resource));
    if (!raw) {
      const init = DEFAULT_DATA[resource] || [];
      this._set(resource, init);
      return init;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_DATA[resource] || [];
    }
  },
  _set(resource, data) {
    localStorage.setItem(this._getKey(resource), JSON.stringify(data));
  },
  getAll(resource) {
    return Promise.resolve({ success: true, data: this._get(resource) });
  },
  getById(resource, id) {
    const list = this._get(resource);
    const item = list.find(x => String(x.id) === String(id));
    if (!item) return Promise.reject(new Error('Data tidak ditemukan'));
    return Promise.resolve({ success: true, data: item });
  },
  create(resource, body) {
    const list = this._get(resource);
    const newItem = { id: Date.now() + Math.floor(Math.random() * 1000), ...body };
    list.push(newItem);
    this._set(resource, list);
    return Promise.resolve({ success: true, message: 'Data berhasil ditambahkan.', data: newItem });
  },
  update(resource, id, body) {
    const list = this._get(resource);
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return Promise.reject(new Error('Data tidak ditemukan'));
    list[idx] = { ...list[idx], ...body, id: list[idx].id };
    this._set(resource, list);
    return Promise.resolve({ success: true, message: 'Data berhasil diperbarui.', data: list[idx] });
  },
  delete(resource, id) {
    const list = this._get(resource);
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return Promise.reject(new Error('Data tidak ditemukan'));
    const deleted = list.splice(idx, 1)[0];
    this._set(resource, list);
    return Promise.resolve({ success: true, message: 'Data berhasil dihapus.', data: deleted });
  }
};

// ===================== COOKIE / AUTH STORAGE =====================
const Cookie = {
  set(name, value) {
    localStorage.setItem('cookie_' + name, String(value));
  },
  get(name) {
    return localStorage.getItem('cookie_' + name);
  },
  remove(name) {
    localStorage.removeItem('cookie_' + name);
  }
};

// ===================== API UTILS (Server & LocalStorage Fallback) =====================
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request gagal');
    return json;
  } catch (err) {
    throw err;
  }
}

const Api = {
  getAll: (resource) => {
    if (isStaticHost) return LocalDB.getAll(resource);
    return apiFetch(`/${resource}`).catch(() => LocalDB.getAll(resource));
  },
  getById: (resource, id) => {
    if (isStaticHost) return LocalDB.getById(resource, id);
    return apiFetch(`/${resource}/${id}`).catch(() => LocalDB.getById(resource, id));
  },
  create: (resource, body) => {
    if (isStaticHost) return LocalDB.create(resource, body);
    return apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(body) })
      .catch(() => LocalDB.create(resource, body));
  },
  update: (resource, id, body) => {
    if (isStaticHost) return LocalDB.update(resource, id, body);
    return apiFetch(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      .catch(() => LocalDB.update(resource, id, body));
  },
  delete: (resource, id) => {
    if (isStaticHost) return LocalDB.delete(resource, id);
    return apiFetch(`/${resource}/${id}`, { method: 'DELETE' })
      .catch(() => LocalDB.delete(resource, id));
  },
};

// ===================== TOAST =====================
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===================== CONFIRM DIALOG =====================
let _confirmResolve = null;

function showConfirm(title, desc) {
  return new Promise(resolve => {
    _confirmResolve = resolve;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-desc').textContent = desc;
    document.getElementById('confirm-overlay').classList.remove('hidden');
  });
}

function setupConfirm() {
  document.getElementById('confirm-yes').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
  });
  document.getElementById('confirm-no').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
  });
}

// ===================== AUTH =====================
function isLoggedIn() {
  return Cookie.get('x-token') === 'true';
}

function guardPage() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function setupLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const ok = await showConfirm('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar dari sistem?');
    if (ok) {
      Cookie.set('x-token', 'false');
      showToast('Berhasil logout.', 'info');
      setTimeout(() => { window.location.href = 'index.html'; }, 700);
    }
  });
}

// ===================== TOPBAR ACTIVE NAV =====================
function setupTopbarNav() {
  const file = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    const isCurrent =
      file === href ||
      (href === 'karyawan.html' && (file === '' || file === 'karyawan'));
    link.classList.toggle('active', isCurrent);
  });
}

// ===================== MODAL =====================
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function setupModalClose() {
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.add('hidden');
    });
  });
}

// ===================== LOGIN SETUP =====================
function setupLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');
    const errorEl  = document.getElementById('login-error');

    errorEl.classList.add('hidden');
    btn.textContent = 'Masuk...';
    btn.disabled = true;

    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        Cookie.set('x-token', 'true');
        showToast('Login berhasil! Selamat datang, Admin.', 'success');
        setTimeout(() => { window.location.href = 'karyawan.html'; }, 800);
      } else {
        errorEl.textContent = 'Username atau password salah. Gunakan admin / admin.';
        errorEl.classList.remove('hidden');
        btn.textContent = 'Masuk';
        btn.disabled = false;
        document.getElementById('login-password').value = '';
      }
    }, 600);
  });

  const toggleBtn = document.getElementById('toggle-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const pwdInput = document.getElementById('login-password');
      const isText = pwdInput.type === 'text';
      pwdInput.type = isText ? 'password' : 'text';
      toggleBtn.textContent = isText ? '👁️' : '🙈';
    });
  }
}
