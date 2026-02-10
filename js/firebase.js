import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD92apK91B1M3Jin0p9Jw_68G8uxlsu_Cw",
  authDomain: "catalogo-bonsais.firebaseapp.com",
  projectId: "catalogo-bonsais",
  storageBucket: "catalogo-bonsais.firebasestorage.app",
  messagingSenderId: "733197067098",
  appId: "1:733197067098:web:03babf7f4542468cf68963"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
