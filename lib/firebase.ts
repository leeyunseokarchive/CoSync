import { initializeApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDIJw3leCw1Ay1wYBgB7jTgLj8lwZkHuOs",
  authDomain: "cosync-d7dd7.firebaseapp.com",
  projectId: "cosync-d7dd7",
  storageBucket: "cosync-d7dd7.firebasestorage.app",
  messagingSenderId: "542201096247",
  appId: "1:542201096247:web:864ef9700f0491e92377b2",
  // GA 속성 cosync-d7dd7 (속성 ID 543348733). 상위 GA 계정(304580556)은 다른
  // 프로젝트와 공유하지만 속성은 이 프로젝트 전용이라 데이터가 섞이지 않는다.
  measurementId: "G-YPY0078KFL"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

declare global {
  // eslint-disable-next-line no-var
  var __cosyncEmulatorConnected: boolean | undefined;
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1" && !globalThis.__cosyncEmulatorConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalThis.__cosyncEmulatorConnected = true;
}
