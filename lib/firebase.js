// Lokasi file: lib/firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import { getApp, getApps, initializeApp as initializeModularApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCwOxkcydudRDC9v1b_XOr8K8FYtpHOY2g",
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

// Firestore/Functions masih memakai compat untuk menjaga seluruh backend V4 tetap stabil.
// Auth dipisahkan ke modular SDK agar jalur login tidak lagi bergantung pada compat auth.
const modularAuthApp = getApps().some((app) => app.name === 'kasirquh-auth-v4')
  ? getApp('kasirquh-auth-v4')
  : initializeModularApp(firebaseConfig, 'kasirquh-auth-v4');

export const db = firebase.firestore();
export const auth = getAuth(modularAuthApp);
export const functions = firebase.app().functions('us-central1');

// Diagnostic aman untuk membedakan masalah config runtime vs Firebase Auth.
// Tidak pernah mengekspos API key penuh.
const runtimeOptions = auth.app?.options || firebaseConfig;
const runtimeApiKey = String(runtimeOptions.apiKey || '');
export const firebaseRuntimeDiagnostics = Object.freeze({
  projectId: runtimeOptions.projectId || '',
  authDomain: runtimeOptions.authDomain || '',
  appId: runtimeOptions.appId || '',
  apiKeyFingerprint: runtimeApiKey ? `${runtimeApiKey.slice(0, 6)}…${runtimeApiKey.slice(-4)}` : '(kosong)',
  apiKeyLength: runtimeApiKey.length,
  authAppName: auth.app?.name || '(unknown)',
});

export default firebase;
