import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnwcdRp0V_9cBVPEXmG2IItV8uz7xUyE4",
  authDomain: "catalogoflores.firebaseapp.com",
  projectId: "catalogoflores",
  storageBucket: "catalogoflores.firebasestorage.app",
  messagingSenderId: "103143202684",
  appId: "1:103143202684:web:c9800a695458568ef74ef9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
