
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  "projectId": "studio-7123558124-d8495",
  "appId": "1:621606526544:web:273a5da26917c45816fb55",
  "apiKey": "AIzaSyCLVesKpDxqIPZ7FpRU2tsu5dtqfijzM2M",
  "authDomain": "studio-7123558124-d8495.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "621606526544"
};

// Initialize Firebase
console.log("Using Firebase config:", firebaseConfig);

export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
