// Import the functions you need from the SDKs you need
// import firebase from "firebase/compat/app";
import app from "firebase/compat/app";
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import 'firebase/compat/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfYGvsQbJkanh9B6LYQ8MtdApO56Ty98E",
  authDomain: "app-react-native-6236a.firebaseapp.com",
  projectId: "app-react-native-6236a",
  storageBucket: "app-react-native-6236a.firebasestorage.app",
  messagingSenderId: "926023675454",
  appId: "1:926023675454:web:980672f99fc75d2dc3eb6f",
  measurementId: "G-JNRSYKC0PL"
};

// Initialize Firebase
const initApp = app.initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export default initApp; 



import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://xmjahdkkzxvtakmdcoxn.supabase.co'
const supabaseKey = "sb_publishable_Ag_Htqn9o_RwdXTNhSwIfA_20JWv3Zg"
const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase };