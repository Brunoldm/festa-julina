// ── firebase.js ──────────────────────────────────────────────────
// Inicialização do Firebase + Firestore
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ⚠️ Substitua pelos dados do SEU projeto no Firebase Console
const firebaseConfig = {
  apiKey:            "AIzaSyBzFVxmrSv2_3pF5BeXHUo02Lw29kpadDc",
  authDomain:        "arraia-2026.firebaseapp.com",
  projectId:         "arraia-2026",
  storageBucket:     "arraia-2026.firebasestorage.app",
  messagingSenderId: "41490373458",
  appId:             "1:41490373458:web:2a08c162f1a47e29b0f88b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
