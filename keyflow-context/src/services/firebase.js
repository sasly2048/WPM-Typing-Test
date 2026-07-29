import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBeM4vaVpsu9qnke8H0DKFj6NM263fPAIY',
  authDomain: 'keyflow-typing-app.firebaseapp.com',
  projectId: 'keyflow-typing-app',
  storageBucket: 'keyflow-typing-app.firebasestorage.app',
  messagingSenderId: '951401349557',
  appId: '1:951401349557:web:649528c023d100022a19fc',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
