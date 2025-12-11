// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Config Firebase (ganti dengan project client nanti)
const firebaseConfig = {
  apiKey: "AIzaSyBqTDry_kn-PJVwfc8Fi9BG457hhI2ObPA",
  authDomain: "nurse-alert-001.firebaseapp.com",
  databaseURL: "https://nurse-alert-001-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nurse-alert-001",
  storageBucket: "nurse-alert-001.firebasestorage.app",
  messagingSenderId: "54615268012",
  appId: "1:54615268012:web:775c06120d794eedd69d09"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle login form
const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      console.log("Login sukses:", userCredential.user.email);
      // Redirect ke dashboard
      window.location.href = "dashboard.html";
    })
    .catch(err => {
      errorEl.textContent = "Login gagal: " + err.message;
    });
});
