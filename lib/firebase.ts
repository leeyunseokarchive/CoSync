import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIJw3leCw1Ay1wYBgB7jTgLj8lwZkHuOs",
  authDomain: "cosync-d7dd7.firebaseapp.com",
  projectId: "cosync-d7dd7",
  storageBucket: "cosync-d7dd7.firebasestorage.app",
  messagingSenderId: "542201096247",
  appId: "1:542201096247:web:864ef9700f0491e92377b2"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
