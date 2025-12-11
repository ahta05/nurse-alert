import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Ganti dengan config Firebase kamu
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

const activeList = document.getElementById('active-list');
const handledList = document.getElementById('handled-list');
const historyTable = document.getElementById('history-table');

// --- Tambahan untuk sound alert & volume control ---
const alertSound = document.getElementById('alert-sound'); // <audio> di HTML
const volumeControl = document.getElementById('volume-control'); // slider di HTML

// Atur volume dari slider
if (volumeControl) {
  volumeControl.addEventListener('input', () => {
    alertSound.volume = volumeControl.value;
  });
}

// Fungsi render card
function buildCard(room, alert) {
  const typeClass = alert.type === 'infus' ? 'infus' : alert.type === 'nyeri' ? 'nyeri' : 'bantuan';
  const card = document.createElement('div');
  card.className = `card ${typeClass}`;
  const ts = new Date(alert.timestamp || Date.now()).toLocaleString();

  card.innerHTML = `
    <div class="details">
      <div class="row"><div class="label">Ruang</div><div class="colon">:</div><div class="value">${room.replace('room_', '')}</div></div>
      <div class="row"><div class="label">Jenis</div><div class="colon">:</div><div class="value">${alert.type}</div></div>
      <div class="row"><div class="label">Status</div><div class="colon">:</div><div class="value">${alert.status}</div></div>
      <div class="row"><div class="label">Waktu</div><div class="colon">:</div><div class="value">${ts}</div></div>
      <div class="row"><div class="label">Pesan</div><div class="colon">:</div><div class="value">${alert.message || ''}</div></div>
    </div>
    <div class="footer">
      <button class="ack-btn">${alert.status === 'Ditangani' ? 'Ditangani' : 'Tangani'}</button>
    </div>
  `;

  const btn = card.querySelector('.ack-btn');
  if (alert.status === 'Ditangani') {
    btn.disabled = true;
  } else {
    btn.onclick = () => {
      const payload = { ...alert, status: 'Ditangani', timestamp: Date.now() };
      fetch(`${firebaseConfig.databaseURL}/alerts_active/${room}.json`, { method: 'PUT', body: JSON.stringify(payload) });
      push(ref(db, `alerts_history/${room}`), payload);
      btn.textContent = "Ditangani";
      btn.disabled = true;
      btn.style.background = "#555";
      btn.style.color = "#aaa";
    };
  }
  return card;
}

// Render active & handled alerts
onValue(ref(db, 'alerts_active'), (snap) => {
  const data = snap.val() || {};
  activeList.innerHTML = '';
  handledList.innerHTML = '';
  Object.entries(data).forEach(([room, alert]) => {
    const card = buildCard(room, alert);
    if (alert.status === 'Ditangani') {
      handledList.appendChild(card);
    } else {
      activeList.appendChild(card);

      // --- Glow + bunyi beep untuk alert baru ---
      if (alert.status === 'active') {
        if (alertSound) {
          alertSound.currentTime = 0;
          alertSound.play();
        }
        card.classList.add('glow');
        setTimeout(() => {
          card.classList.remove('glow');
        }, 1500); // glow hilang setelah 1.5 detik
      }
    }
  });
});

// Render history
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
