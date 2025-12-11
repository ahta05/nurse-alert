import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Config Firebase
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
document.getElementById('tab-dashboard').onclick = () => { 
  dashboardEl.style.display = ''; 
  historyEl.style.display = 'none'; 
};
document.getElementById('tab-history').onclick = () => { 
  dashboardEl.style.display = 'none'; 
  historyEl.style.display = ''; 
};

const activeList = document.getElementById('active-list');
const handledList = document.getElementById('handled-list');
const historyTable = document.getElementById('history-table');

// Input & button untuk filter/hapus history
const filterDateInput = document.getElementById('filter-date');
const filterBtn = document.getElementById('filter-btn');
const deleteDateInput = document.getElementById('delete-date');
const deleteBtn = document.getElementById('delete-history-btn');

// Fungsi render card
function buildCard(room, alert) {
  const typeClass = alert.type === 'kondisi infus' ? 'kondisi infus' : alert.type === 'pertolongan medis' ? 'pertolongan medis' : 'pertolongan non-medis';
  const statusClass = alert.status === 'Ditangani' ? 'handled' : 'active';
  const card = document.createElement('div');
  card.className = `card ${typeClass} ${statusClass}`;
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
      fetch(`${firebaseConfig.databaseURL}/alerts_active/${room}.json`, { 
        method: 'PUT', 
        body: JSON.stringify(payload) 
      });
      push(ref(db, `alerts_history/${room}`), payload);
      btn.textContent = "Ditangani";
      btn.disabled = true;
      card.classList.remove('active');
      card.classList.add('handled');
    };
  }
  return card;
}

// Render active & handled alerts + auto-clean
onValue(ref(db, 'alerts_active'), (snap) => {
  const data = snap.val() || {};
  activeList.innerHTML = '';
  handledList.innerHTML = '';
  const now = Date.now();

  Object.entries(data).forEach(([room, alert]) => {
    // Auto-clean: hapus card Ditangani lebih dari 24 jam
    if (alert.status === 'Ditangani' && (now - alert.timestamp) > 24*60*60*1000) {
      remove(ref(db, `alerts_active/${room}`));
      return;
    }

    const card = buildCard(room, alert);
    if (alert.status === 'Ditangani') {
      handledList.appendChild(card);
    } else {
      activeList.appendChild(card);
    }
  });
});

// Render history (default semua)
function renderHistory(filterDate = null) {
  onValue(ref(db, 'alerts_history'), (snap) => {
    const data = snap.val() || {};
    historyTable.innerHTML = '';
    Object.entries(data).forEach(([room, events]) => {
      Object.values(events || {}).forEach((ev) => {
        const ts = new Date(ev.timestamp || Date.now());
        const tsDate = ts.toISOString().split('T')[0];
        if (!filterDate || tsDate === filterDate) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${room.replace('room_', '')}</td>
            <td>${ev.type}</td>
            <td>${ev.status}</td>
            <td>${ts.toLocaleString()}</td>
          `;
          historyTable.appendChild(tr);
        }
      });
    });
  });
}
renderHistory(); // awal tampil semua

// Filter history
filterBtn.onclick = () => {
  const selectedDate = filterDateInput.value;
  renderHistory(selectedDate || null);
};

// Hapus history berdasarkan tanggal
deleteBtn.onclick = () => {
  const selectedDate = deleteDateInput.value;
  if (!selectedDate) {
    alert("Pilih tanggal dulu!");
    return;
  }
  onValue(ref(db, 'alerts_history'), (snap) => {
    const data = snap.val() || {};
    Object.entries(data).forEach(([room, events]) => {
      Object.entries(events || {}).forEach(([evKey, ev]) => {
        const tsDate = new Date(ev.timestamp).toISOString().split('T')[0];
        if (tsDate === selectedDate) {
          remove(ref(db, `alerts_history/${room}/${evKey}`));
        }
      });
    });
  }, { onlyOnce: true });
};
