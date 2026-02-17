// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3Br7iDX-2irFrN9dLE6vjtsuWFQzfo2U",
    authDomain: "portfolio-chess.firebaseapp.com",
    projectId: "portfolio-chess",
    storageBucket: "portfolio-chess.firebasestorage.app",
    messagingSenderId: "5157075220",
    appId: "1:5157075220:web:68efc5fed277db42f8ea01",
    measurementId: "G-NJVP8F749N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
