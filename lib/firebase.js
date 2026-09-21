// Lokasi file: lib/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCwOxkcydudRDC9v1b_XOr8K8FYtpHOY2g",
  authDomain: "kasirquh.firebaseapp.com",
  projectId: "kasirquh",
  storageBucket: "kasirquh.firebasestorage.app",
  messagingSenderId: "87320899036",
  appId: "1:87320899036:web:592c6768ea4aca6bdbb319",
  measurementId: "G-2BL7RJN9Z5"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');
export default app;

