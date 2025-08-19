// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/analytics";
import "firebase/compat/auth";
import "firebase/compat/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqFBGQRjNnl8601dM15VzC3wNumFlVu-U",
  authDomain: "suivi-conso-ev-online.firebaseapp.com",
  projectId: "suivi-conso-ev-online",
  storageBucket: "suivi-conso-ev-online.firebasestorage.app",
  messagingSenderId: "7486913118",
  appId: "1:7486913118:web:2e5c811aea07e85c5fd2cf",
  measurementId: "G-27MYJHRQKF"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  try {
    firebase.analytics();
  } catch (e) {
    console.error('Firebase Analytics initialization failed.', e);
  }
}

const auth = firebase.auth();
const db = firebase.firestore();

// We create a promise that resolves once persistence is enabled.
// This prevents race conditions where we try to read/write data
// before the offline cache is ready.
const firestorePromise = db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // This can happen if multiple tabs are open.
      console.warn("Firestore offline persistence failed: multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      // The browser may not support all features required for persistence.
      console.warn("Firestore offline persistence is not supported in this browser.");
    }
  });


export { auth, db, firestorePromise };