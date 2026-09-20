// Lokasi file: lib/firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/functions';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwOxkcydduRDC9v1b_XOr8K8FYtpHOY2g",
  authDomain: "kasirquh.firebaseapp.com",
  projectId: "kasirquh",
  storageBucket: "kasirquh.firebasestorage.app",
  messagingSenderId: "87320899036",
  appId: "1:87320899036:web:592c6768ea4aca6bdbb319",
  measurementId: "G-2BL7RJN9Z5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export const functions = firebase.app().functions('us-central1');
export default firebase;
