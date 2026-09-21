# Phase 26 — Firebase Auth Modular Stabilization

## Tujuan
Memisahkan Firebase Authentication dari Compat API tanpa mengubah Firebase config, Firestore compat, Functions compat, Gateway, atau order backend.

## Baseline
- Source baseline: `QP_V4_PHASE25_GATEWAY_MANUAL_STORE_CONTEXT.zip`
- Firebase JS SDK package: `10.14.1`
- Firebase config: dipertahankan apa adanya.

## Perubahan
- `lib/firebase.js`
  - tetap memakai Compat untuk Firestore dan Functions agar jalur legacy V4 tidak ikut berubah.
  - Auth memakai `firebase/app` + `firebase/auth` modular.
  - Auth memakai named modular app `kasirquh-auth-v4` dengan guard `getApps()` agar aman dari duplicate initialization.
- `lib/services/authService.js`
  - `signInWithEmailAndPassword(auth, email, password)`.
  - `createUserWithEmailAndPassword(auth, email, password)`.
  - `signOut(auth)`.
  - `deleteUser(auth.currentUser)`.
- `components/CustomerSessionContext.jsx`
  - `onAuthStateChanged(auth, ...)` modular.
- `components/AdminSessionContext.jsx`
  - `onAuthStateChanged(auth, ...)` modular.
- `components/AuthPanel.jsx`
  - `onAuthStateChanged(auth, ...)` modular.

## Tidak disentuh
- `firebaseConfig`.
- Firestore compat API.
- Firebase Functions compat API.
- Gateway / Store Context.
- API route/backend callable.

## QA statis
- Tidak ada lagi `firebase/compat/auth`.
- Tidak ada lagi `firebase.auth()` pada jalur aplikasi.
- Semua listener Auth menggunakan modular `onAuthStateChanged`.
- Semua login/register/logout/delete menggunakan modular Auth.

## Batas verifikasi
Build dan runtime Firebase belum diverifikasi di environment ini. Error `auth/api-key-not-valid` harus diuji setelah deployment agar dapat dibedakan dari masalah runtime/environment.
