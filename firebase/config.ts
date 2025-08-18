// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqFBGQRjNnl8601dM15VzC3wNumFlVu-U",
  authDomain: "suivi-conso-ev-online.firebaseapp.com",
  projectId: "suivi-conso-ev-online",
  storageBucket: "suivi-conso-ev-online.appspot.com",
  messagingSenderId: "7486913118",
  appId: "1:7486913118:web:2e5c811aea07e85c5fd2cf",
  measurementId: "G-27MYJHRQKF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // This can happen if multiple tabs are open.
      console.warn("Firestore persistence failed: multiple tabs open. Offline mode will not work in this tab.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence.
      console.warn("Firestore persistence is not supported in this browser. App will not work offline.");
    }
  });


// Initialize and export Firebase services
export const auth = getAuth(app);
export { db };
