// frontend/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBAxi4OxA0MYeVfN5G6AfgDGDjdNjqHUdI",
  authDomain: "campus-food-share-10f92.firebaseapp.com",
  projectId: "campus-food-share-10f92",
  storageBucket: "campus-food-share-10f92.firebasestorage.app",
  messagingSenderId: "555571522109",
  appId: "1:555571522109:web:32b2ed15e22f2d027b1854"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);