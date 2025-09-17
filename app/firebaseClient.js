// firebaseClient.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5pffaROTgtIHgT80na_hFfa-JT1dbmiY",
  authDomain: "aufondue-login.firebaseapp.com",
  projectId: "aufondue-login",
  appId: "1:587016056468:web:3658898d514aaa8d90ce81",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
