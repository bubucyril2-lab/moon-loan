import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhPdnMeN-TbAhOrW8D_q6tcgWnKkSesQs",
  authDomain: "moon2-65d32.firebaseapp.com",
  projectId: "moon2-65d32",
  storageBucket: "moon2-65d32.firebasestorage.app",
  messagingSenderId: "866724596112",
  appId: "1:866724596112:web:ac2030ece93f47eb4a8b15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
