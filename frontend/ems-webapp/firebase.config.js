import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBU_xkCYLHk7zfRZ2VI8VWaQvmexNi5tkk",
    // authDomain: "energy-management-system-fd6fb.firebaseapp.com",
    // projectId: "energy-management-system-fd6fb",
    // storageBucket: "energy-management-system-fd6fb.firebasestorage.app",
    // messagingSenderId: "916068298986",
    // appId: "1:916068298986:web:e433e47045d60763616793",
    // measurementId: "G-BMK01PQB7D"    // ... other config variables
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
