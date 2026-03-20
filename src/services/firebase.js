import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFymwE_bSub-ZZeRiG3wcKdjuA3nvPQZY",
  authDomain: "posgemma.firebaseapp.com",
  projectId: "posgemma",
  storageBucket: "posgemma.firebasestorage.app",
  messagingSenderId: "162306845209",
  appId: "1:162306845209:web:15a3f353c64217b1dd5888"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Database so our app can use them!
export const auth = getAuth(app);
export const db = getFirestore(app);