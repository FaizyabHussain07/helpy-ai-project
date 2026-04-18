import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBPPrHx1_b52yBKJjWg3-6aVJzC2nedMV8",
  authDomain: "final-hackathon-project-33441.firebaseapp.com",
  projectId: "final-hackathon-project-33441",
  storageBucket: "final-hackathon-project-33441.firebasestorage.app",
  messagingSenderId: "555325316416",
  appId: "1:555325316416:web:4e46a74203d9ee609c6ea5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
