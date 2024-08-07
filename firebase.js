import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACbrcT6a5S2wDBKvTYBozSSg889EViItA",
  authDomain: "shelf-aware.firebaseapp.com",
  projectId: "shelf-aware",
  storageBucket: "shelf-aware.appspot.com",
  messagingSenderId: "1089721977345",
  appId: "1:1089721977345:web:39875b2a315317230a4e00",
  measurementId: "G-K257EX16DW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export services and provider
export { auth, firestore, storage, googleProvider };