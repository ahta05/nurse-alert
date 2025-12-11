// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Ganti dengan config dari Firebase (Langkah 3)
const firebaseConfig = {
  apiKey: "AIzaSyBqTDry_kn-PJVwfc8Fi9BG457hhI2ObPA",
  authDomain: "nurse-alert-001.firebaseapp.com",
  databaseURL: "https://nurse-alert-001-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nurse-alert-001",
  storageBucket: "nurse-alert-001.firebasestorage.app",
  messagingSenderId: "54615268012",
  appId: "1:54615268012:web:775c06120d794eedd69d09"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Tab switching
const dashboardEl = document.getElementById('dashboard');
const historyEl = document.getElementById('history');
document.getElementById('tab-dashboard').onclick = () => { dashboardEl.style.display = ''; historyEl.style.display = 'none'; };
document.getElementById('tab-history').onclick = () => { dashboardEl.style.display = 'none'; historyEl.style.display = ''; };

// Render active alerts
const activeList = document.getElementById('active-list');
onValue(ref(db, 'alerts_active'), (snap) => {
  const data = snap.val() || {};
  activeList.innerHTML = '';
  Object.entries(data).forEach(([room, alert]) => {
    const typeClass = alert.type === 'infus' ? 'infus' : alert.type === 'nyeri' ? 'nyeri' : 'bantuan';
    const card = document.createElement('div');
    card.className = `card ${typeClass}`;
    const ts = new Date(alert.timestamp || Date.now()).toLocaleString();
    card.innerHTML = `
      <div><strong>Ruang:</strong> ${room.replace('room_', '')}</div>
      <div><strong>Jenis:</strong> ${alert.type}</div>
      <div class="small"><strong>Status:</strong> ${alert.status} • <strong>Waktu:</strong> ${ts}</div>
      <div class="small">${alert.message || ''}</div>
      <button class="ack-btn">Tangani</button>
    `;
    // Tambah event listener untuk tombol Tangani
    card.querySelector('.ack-btn').onclick = () => {
      const payload = { ...alert, status: 'ack', timestamp: Date.now() };
      // Update active
      fetch(`${firebaseConfig.databaseURL}/alerts_active/${room}.json`, { method: 'PUT', body: JSON.stringify(payload) });
      // Append ke history
      push(ref(db, `alerts_history/${room}`), payload);
    };
    activeList.appendChild(card);
  });
});

// Render history
const historyTable = document.getElementById('history-table');
onValue(ref(db, 'alerts_history'), (snap) => {
  const data = snap.val() || {};
  historyTable.innerHTML = '';
  Object.entries(data).forEach(([room, events]) => {
    Object.values(events || {}).forEach((ev) => {
      const tr = document.createElement('tr');
      const ts = new Date(ev.timestamp || Date.now()).toLocaleString();
      tr.innerHTML = `
        <td>${room.replace('room_', '')}</td>
        <td>${ev.type}</td>
        <td>${ev.status}</td>
        <td>${ts}</td>
      `;
      historyTable.appendChild(tr);
    });
  });
});

// Dev helper: simulasi alert (opsional)
export function simulateAlert(room = 'room_203', type = 'infus') {
  const messageMap = {
    infus: 'Infus pasien hampir habis, segera periksa kondisi cairan.',
    nyeri: 'Pasien melaporkan keluhan, segera lakukan pemeriksaan.',
    bantuan: 'Pasien membutuhkan bantuan non-medis.'
  };
  const payload = {
    type,
    status: 'active',
    timestamp: Date.now(),
    message: messageMap[type]
  };
  // Update active
  fetch(`${firebaseConfig.databaseURL}/alerts_active/${room}.json`, { method: 'PUT', body: JSON.stringify(payload) });
  // Append to history
  push(ref(db, `alerts_history/${room}`), { ...payload });
}

// Contoh pemakaian (hapus saat production):
// simulateAlert('room_203', 'nyeri');
