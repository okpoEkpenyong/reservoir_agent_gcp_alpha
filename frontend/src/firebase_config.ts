// firebase_config.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAMGpj92VVKtQQWZYcJGQksYFYZfwzNbXE",
  authDomain: "exzingdb.firebaseapp.com",
  databaseURL: "https://exzingdb-default-rtdb.firebaseio.com",
  projectId: "exzingdb",
  storageBucket: "exzingdb.appspot.com",
  messagingSenderId: "478816800318",
  appId: "1:478816800318:web:af95a9b473d45d5740cb6f",
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);