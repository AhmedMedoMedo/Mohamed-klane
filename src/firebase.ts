import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

export interface StockAdditionRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  type: 'cartons' | 'units';
  quantity: number;
  text: string;
  note?: string;
}

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
  createdAt?: any;               // تاريخ ووقت أول تسجيل للصنف في المخزن
  lastAddedAt?: any;             // موعد وتاريخ آخر إضافة أو توريد للصنف
  lastAddedQuantity?: number;    // كمية آخر إضافة
  lastAddedType?: 'cartons' | 'units'; // نوع آخر إضافة (كرتونة أو قطعة فرط)
  lastAddedText?: string;        // وصف آخر إضافة مثل "+5 كرتونة" أو "+10 قطعة فرط"
  additionHistory?: StockAdditionRecord[]; // سجل التوريدات والإضافات السابقة للصنف
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

  // تفعيل التخزين المؤقت المحلي المستمر (IndexedDB Persistence)
  // يتيح للنظام العمل بدون إنترنت كلياً، وحفظ كل العمليات محلياً ومزامنتها فور عودة الاتصال
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (initErr) {
    console.warn("Using existing Firestore instance:", initErr);
    db = getFirestore(app);
  }
  isFirebaseActive = true;
} catch (e) {
  console.warn("Firebase initialization warning:", e);
  isFirebaseActive = false;
}

export { db, isFirebaseActive };
