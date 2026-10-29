import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
} from 'firebase/firestore';

export interface InventoryItem {
  id: string;
  name: string;
  unitsPerCarton: number;
  totalUnits: number;
  cartons?: number;      // عدد الكراتين الفعلية المحددة عند التسجيل
  looseUnits?: number;   // عدد القطع الفرط الفعلية المحددة عند التسجيل
  unitBuyPrice: number;
  cartonBuyPrice: number;
  unitSellPrice: number;
  cartonSellPrice: number;
  note?: string;
  createdAt?: any;
}

export interface WithdrawalLog {
  id: string;
  itemName: string;
  withdrawTypeLabel: string;
  unitsDeducted: number;
  costValue: number;
  incomeValue: number;
  profit: number;
  note?: string;
  timestamp: string;
  createdAt: number;
}

const firebaseConfig = {
  apiKey: "AIzaSyBFhU-YB96tVy8uT5ageeuLekXBBqfRHQ4",
  authDomain: "mohammed-al---kailani.firebaseapp.com",
  projectId: "mohammed-al---kailani",
  storageBucket: "mohammed-al---kailani.firebasestorage.app",
  messagingSenderId: "720694796330",
  appId: "1:720694796330:web:a1bc0de8d3640211e96353",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isFirebaseActive = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  isFirebaseActive = true;
} catch (e) {
  console.warn("Firebase initialization warning:", e);
  isFirebaseActive = false;
}

export { db, isFirebaseActive };
