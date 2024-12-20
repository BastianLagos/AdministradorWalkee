// firebase.js en el directorio `src`
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAWua4wh4p5zbpzydMwQ7d60L8aB0N8t8k",
  authDomain: "walkee-136cb.firebaseapp.com",
  databaseURL: "https://walkee-136cb-default-rtdb.firebaseio.com",
  projectId: "walkee-136cb",
  storageBucket: "walkee-136cb.appspot.com",
  messagingSenderId: "980813949669",
  appId: "1:980813949669:web:8fee23b072f29a23ba420c",
  measurementId: "G-HWG87FBJYY"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Inicializa Realtime Database
const analytics = getAnalytics(app);

export { database, analytics }; // Exporta `database` para ser usado en otros archivos
