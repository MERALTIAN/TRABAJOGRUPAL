import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuración Web de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA5GSVfwGFzxWOcTRPjoMlpxvzLYXUqa44",
  authDomain: "grupal-technowell.firebaseapp.com",
  projectId: "grupal-technowell",
  storageBucket: "grupal-technowell.firebasestorage.app",
  messagingSenderId: "118234581644",
  appId: "1:118234581644:web:31809a05aa92a3643f49a9",
  measurementId: "G-F5S166WDZX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Servicios
const db = getFirestore(app);

export { app, db };
