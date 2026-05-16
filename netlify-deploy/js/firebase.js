// Firebase Configuration and Initialization
// The Pizza Club and Grill - Food Ordering Website

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDxXDUdtFqdoevcKXRFyVc1d8xclBQNZGQ",
    authDomain: "food-ordering-website-2025.firebaseapp.com",
    databaseURL: "https://food-ordering-website-2025-default-rtdb.firebaseio.com",
    projectId: "food-ordering-website-2025",
    storageBucket: "food-ordering-website-2025.firebasestorage.app",
    messagingSenderId: "508891231316",
    appId: "1:508891231316:web:8c3149437d625d1ecce9c1",
    measurementId: "G-7MNJK563HH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

console.log('Firebase initialized successfully');
