import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  db,
  isFirebaseActive,
  InventoryItem,
  StockAdditionRecord,
  WithdrawalLog,
} from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { GlobalDateFilter, GlobalDateFilterType } from './components/GlobalDateFilter';
import { KpiCards } from './components/KpiCards';
import { AddStockSection, AddStockData } from './components/AddStockSection';
import { WithdrawSection } from './components/WithdrawSection';
import { InventorySection } from './components/InventorySection';
import { SalesLogSection } from './components/SalesLogSection';
import { EditModal } from './components/EditModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { getCurrentTimeString, normalizeArabic, parseTimestamp } from './utils/formatters';
import { useOnlineStatus } from './utils/useOnlineStatus';
import {
  getSyncQueue,
  enqueueSyncAction,
  processSyncQueue,
  getLastSyncTime,
  recordSyncSuccess,
} from './utils/syncManager';

const STORAGE_KEY_INVENTORY = 'mk_system_inventory_v1';
const STORAGE_KEY_LOGS = 'mk_system_logs_v1';
const STORAGE_KEY_DARK_MODE = 'mk_system_dark_mode_v1';

type AppTab = 'dashboard' | 'inventory' | 'logs';

export const App: React.FC = () => {
  // حالة اتصال الإنترنت والمزامنة
  const isOnline = useOnlineStatus();
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getSyncQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => getLastSyncTime());

  // تحميل البيانات المبدئية من LocalStorage لتعمل فوراً حتى لو كان المستخدم بدون إنترنت
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (!saved) return [];
      const parsed: InventoryItem[] = JSON.parse(saved);
      return parsed.map((item) => {
        const isDepleted =
          (item.totalUnits || 0) <= 0 ||
          (Number(item.cartons || 0) === 0 && Number(item.looseUnits || 0) === 0);
        return {
          ...item,
          cartons: isDepleted ? 0 : (item.cartons ?? 0),
          looseUnits: isDepleted ? 0 : (item.looseUnits ?? 0),
          totalUnits: isDepleted ? 0 : (item.totalUnits ?? 0),
          unitsPerCarton: isDepleted ? 0 : (item.unitsPerCarton ?? 0),
        };
      });
    } catch {
      return [];
    }
  });

  const [logs, setLogs] = useState<WithdrawalLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Confirm modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  // التبويب النشط (التنقل بين الصفحات)
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // الوضع الليلي (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DARK_MODE) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_DARK_MODE, String(isDarkMode));
    } catch {
      // ignore storage errors
    }
  }, [isDarkMode]);

  // حالة فلتر التاريخ العام (يرتبط بمؤشرات الأرباح وسجل المسحوبات معاً)
  const todayInput = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [dateFilter, setDateFilter] = useState<GlobalDateFilterType>('all');
  const [startDate, setStartDate] = useState<string>(todayInput);
  const [endDate, setEndDate] = useState<string>(todayInput);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Save to localStorage whenever state updates so local data is permanently preserved
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    } catch (e) {
      console.error('Failed to save inventory to localStorage', e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
    }
  }, [logs]);

  // تحديث عدد الحركات المعلقة في الطابور عند حدوث أي حركة
  useEffect(() => {
    const handleQueueChange = (e: any) => {
      setPendingSyncCount(e.detail?.count ?? getSyncQueue().length);
    };
    window.addEventListener('mk_sync_queue_changed', handleQueueChange);
    return () => window.removeEventListener('mk_sync_queue_changed', handleQueueChange);
  }, []);

  // دالة المزامنة السحابية (رفع أي حركات معلقة إلى فايربيز فور عودة النت أو بالطلب)
  const runCloudSync = useCallback(
    async (notifyIfEmpty = false) => {
      if (!isFirebaseActive || !db) return;
      const currentQueue = getSyncQueue();
      if (currentQueue.length === 0) {
        if (notifyIfEmpty) {
          showNotification('جميع البيانات متزامنة ومحفوظة بالسحابة بالفعل ☁️✅', 'info');
        }
        return;
      }

      setIsSyncing(true);
      try {
        const { syncedCount, remainingCount, errors } = await processSyncQueue(db);
        setPendingSyncCount(remainingCount);
        const now = Date.now();
        setLastSyncTime(now);
        if (syncedCount > 0) {
          showNotification(
            `تمت مزامنة وإرسال ${syncedCount} حركة للتخزين السحابي بنجاح! ☁️✅`,
            'success'
          );
        }
        if (errors.length > 0) {
          console.warn('Some sync items remaining:', errors);
        }
      } catch (e) {
        console.error('Sync failed:', e);
      } finally {
        setIsSyncing(false);
      }
    },
    [showNotification]
  );

  // مراقبة عودة الاتصال التلقائية والمزامنة
  useEffect(() => {
    if (isOnline) {
      runCloudSync(false);
    }
  }, [isOnline, runCloudSync]);

  // فحص دوري كل 30 ثانية لمزامنة أي حركات معلقة إذا كان النت متاحاً
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && getSyncQueue().length > 0) {
        runCloudSync(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isOnline, runCloudSync]);

  // Connect to Firestore realtime listener with persistent offline cache support
  useEffect(() => {
    if (!isFirebaseActive || !db) return;

    let unsubInv: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;

    try {
      const invCol = collection(db, 'inventory');
      unsubInv = onSnapshot(
        invCol,
        (snapshot) => {
          const items: InventoryItem[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            const total = Number(data.totalUnits || 0);
            const c = data.cartons !== undefined ? Number(data.cartons) : 0;
            const l = data.looseUnits !== undefined ? Number(data.looseUnits) : total;
            const isDepleted = total <= 0 || (c === 0 && l === 0);

            // تصفير خانة الكرتونة إذا نفذ الصنف تماماً
            let upc = isDepleted ? 0 : Number(data.unitsPerCarton || 0);
            if (!isDepleted && upc === 0 && c > 0) {
              upc = 1;
            }

            // تنظيف أي صنف نافذ كان مسجلاً برقم قديم في السحابة
            const firestore = db;
            if (isDepleted && Number(data.unitsPerCarton || 0) > 0 && firestore) {
              updateDoc(doc(firestore, 'inventory', d.id), {
                unitsPerCarton: 0,
                cartons: 0,
                looseUnits: 0,
                totalUnits: 0,
              }).catch(() => {});
            }

            items.push({
              id: d.id,
              ...data,
              cartons: isDepleted ? 0 : c,
              looseUnits: isDepleted ? 0 : l,
              totalUnits: isDepleted ? 0 : total,
              unitsPerCarton: upc,
            } as InventoryItem);
          });
          setInventory(items);
          recordSyncSuccess();
          setLastSyncTime(Date.now());
        },
        (error) => {
          console.warn('Firebase snapshot listener (served from offline cache):', error);
        }
      );

      const logsQuery = query(collection(db, 'logs'), orderBy('createdAt', 'desc'));
      unsubLogs = onSnapshot(
        logsQuery,
        (snapshot) => {
          const list: WithdrawalLog[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as WithdrawalLog);
          });
          setLogs(list);
        },
        (error) => {
          console.warn('Firebase logs listener (served from offline cache):', error);
        }
      );
    } catch (e) {
      console.warn('Firebase snapshot listener error:', e);
    }

    return () => {
      if (unsubInv) unsubInv();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  // Helper to scroll to any section smoothly (switches to dashboard tab if needed)
  const scrollToSection = useCallback((id: string) => {
    setActiveTab('dashboard');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  }, []);

  // Add or increment stock (مع دعم العمل بدون إنترنت والمزامنة التلقائية)
  const handleAddStock = async (data: AddStockData) => {
    const existing = data.existingId
      ? inventory.find((i) => i.id === data.existingId)
      : inventory.find(
          (i) => normalizeArabic(i.name) === normalizeArabic(data.name)
        );

    const isExistingDepleted =
      !existing ||
      (existing.totalUnits || 0) <= 0 ||
      (Number(existing.cartons || 0) === 0 && Number(existing.looseUnits || 0) === 0);

    const curCartons = (!existing || isExistingDepleted) ? 0 : Number(existing.cartons || 0);
    const curLoose = (!existing || isExistingDepleted) ? 0 : Number(existing.looseUnits || 0);
    const oldUnitsPerCarton = (!existing || isExistingDepleted) ? 0 : Number(existing.unitsPerCarton || 0);

    let newCartons = 0;
    let newLooseUnits = 0;
    let finalUnitsPerCarton = 0;

    if (data.addType === 'cartons') {
      newCartons = curCartons + data.quantity;
      newLooseUnits = curLoose;
      finalUnitsPerCarton = Math.max(1, data.unitsPerCarton || oldUnitsPerCarton || 1);
    } else {
      newCartons = curCartons;
      newLooseUnits = curLoose + data.quantity;
      finalUnitsPerCarton = curCartons > 0 ? oldUnitsPerCarton : 0;
    }

    const newTotalUnits = (newCartons * (finalUnitsPerCarton > 0 ? finalUnitsPerCarton : 1)) + newLooseUnits;

    const addedDescription =
      data.addType === 'cartons'
        ? `${data.quantity} كرتونة`
        : `${data.quantity} قطعة فرط`;

    const nowMs = Date.now();
    const newAdditionRecord: StockAdditionRecord = {
      id: 'add_' + nowMs + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: nowMs,
      dateStr: new Date(nowMs).toISOString(),
      type: data.addType,
      quantity: data.quantity,
      text: `+${addedDescription}`,
      note: data.note ? data.note.trim() : undefined,
    };

    const prevHistory = existing && Array.isArray(existing.additionHistory) ? existing.additionHistory : [];
    const updatedHistory = [newAdditionRecord, ...prevHistory].slice(0, 30);

    const itemId = existing ? existing.id : ('item_' + nowMs);
    const itemPayload = {
      name: data.name,
      cartons: newCartons,
      looseUnits: newLooseUnits,
      totalUnits: newTotalUnits,
      unitsPerCarton: finalUnitsPerCarton,
      unitBuyPrice: data.unitBuyPrice,
      cartonBuyPrice: data.cartonBuyPrice,
      unitSellPrice: data.unitSellPrice,
      cartonSellPrice: data.cartonSellPrice,
      note: data.note || (existing ? existing.note : '') || '',
      lastAddedAt: nowMs,
      lastAddedQuantity: data.quantity,
      lastAddedType: data.addType,
      lastAddedText: `+${addedDescription}`,
      additionHistory: updatedHistory,
      ...(existing ? {} : { createdAt: nowMs }),
    };

    // تحديث الحالة المحلية فوراً (0 ثانية انتظار)
    if (existing) {
      setInventory((prev) =>
        prev.map((item) => (item.id === existing.id ? { ...item, ...itemPayload } : item))
      );
    } else {
      setInventory((prev) => [{ id: itemId, ...itemPayload }, ...prev]);
    }

    // محاولة الحفظ في فايربيز مع دعم المزامنة التلقائية إذا كان أوفلاين
    let syncedToCloud = false;
    if (isOnline && isFirebaseActive && db) {
      try {
        if (existing) {
          await updateDoc(doc(db, 'inventory', existing.id), {
            ...itemPayload,
            lastAddedAt: serverTimestamp(),
          });
        } else {
          await setDoc(doc(db, 'inventory', itemId), {
            ...itemPayload,
            createdAt: serverTimestamp(),
            lastAddedAt: serverTimestamp(),
          });
        }
        syncedToCloud = true;
        recordSyncSuccess();
        setLastSyncTime(Date.now());
      } catch (err) {
        console.warn('Direct cloud write failed, enqueuing for offline sync:', err);
      }
    }

    if (!syncedToCloud) {
      enqueueSyncAction({
        action: existing ? 'update_item' : 'add_item',
        targetId: itemId,
        data: itemPayload,
      });
      showNotification(
        `تم حفظ ${data.name} محلياً (${addedDescription}) - سيتم إرساله للسحابة فور توفر النت 📴`,
        'info'
      );
    } else {
      showNotification(
        existing
          ? `تمت زيادة رصيد ${existing.name} بمقدار ${addedDescription} وحفظه بالسحابة ☁️`
          : `تم إضافة ${data.name} للمخزن برصيد ${addedDescription} وحفظه بالسحابة ☁️`,
        'success'
      );
    }
  };

  // Withdraw / Sell stock (مع دعم العمل بدون إنترنت والمزامنة التلقائية)
  const handleWithdraw = async (data: {
    itemId: string;
    type: 'cartons' | 'units';
    qty: number;
    note: string;
  }) => {
    const item = inventory.find((i) => i.id === data.itemId);
    if (!item) return;

    const uPerCarton = Math.max(1, item.unitsPerCarton || 1);
    const curCartons = item.cartons !== undefined
      ? item.cartons
      : Math.floor(item.totalUnits / uPerCarton);
    const curLoose = item.looseUnits !== undefined
      ? item.looseUnits
      : item.totalUnits % uPerCarton;

    let newCartons = curCartons;
    let newLooseUnits = curLoose;

    if (data.type === 'cartons') {
      if (curCartons < data.qty) {
        showNotification(
          `رصيد الكراتين ميكفيش! المتاح بالمخزن: ${curCartons} كرتونة`,
          'error'
        );
        return;
      }
      newCartons = curCartons - data.qty;
    } else {
      if (curLoose >= data.qty) {
        newLooseUnits = curLoose - data.qty;
      } else {
        const totalAvail = (curCartons * uPerCarton) + curLoose;
        if (totalAvail < data.qty) {
          showNotification(
            `رصيد المخزن ميكفيش! المتاح: ${curCartons} كرتونة و ${curLoose} قطعة فرط`,
            'error'
          );
          return;
        }
        const needed = data.qty - curLoose;
        const cartonsToOpen = Math.ceil(needed / uPerCarton);
        newCartons = curCartons - cartonsToOpen;
        newLooseUnits = (curLoose + (cartonsToOpen * uPerCarton)) - data.qty;
      }
    }

    const newTotalUnits = (newCartons * uPerCarton) + newLooseUnits;
    const unitsToDeduct = item.totalUnits - newTotalUnits;
    const isNowOutOfStock = newTotalUnits <= 0 || (newCartons <= 0 && newLooseUnits <= 0);
    const finalCartons = isNowOutOfStock ? 0 : Math.max(0, newCartons);
    const finalLoose = isNowOutOfStock ? 0 : Math.max(0, newLooseUnits);
    const finalTotal = isNowOutOfStock ? 0 : Math.max(0, newTotalUnits);
    const finalUnitsPerCarton = isNowOutOfStock ? 0 : (item.unitsPerCarton || 0);

    const cost =
      data.type === 'cartons'
        ? data.qty * item.cartonBuyPrice
        : data.qty * item.unitBuyPrice;
    const income =
      data.type === 'cartons'
        ? data.qty * item.cartonSellPrice
        : data.qty * item.unitSellPrice;
    const profit = income - cost;
    const timeStr = getCurrentTimeString();
    const typeLabel = data.type === 'cartons' ? `${data.qty} كرتونة` : `${data.qty} قطعة`;

    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newLog: WithdrawalLog = {
      id: logId,
      itemName: item.name,
      withdrawTypeLabel: typeLabel,
      unitsDeducted: unitsToDeduct,
      costValue: cost,
      incomeValue: income,
      profit: profit,
      note: data.note,
      timestamp: timeStr,
      createdAt: Date.now(),
    };

    // تحديث الحالة المحلية فوراً
    setInventory((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              cartons: finalCartons,
              looseUnits: finalLoose,
              totalUnits: finalTotal,
              unitsPerCarton: finalUnitsPerCarton,
            }
          : i
      )
    );
    setLogs((prev) => [newLog, ...prev]);

    const itemUpdatePayload = {
      cartons: finalCartons,
      looseUnits: finalLoose,
      totalUnits: finalTotal,
      unitsPerCarton: finalUnitsPerCarton,
    };

    let syncedToCloud = false;
    if (isOnline && isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'inventory', item.id), itemUpdatePayload);
        await setDoc(doc(db, 'logs', logId), newLog);
        syncedToCloud = true;
        recordSyncSuccess();
        setLastSyncTime(Date.now());
      } catch (err) {
        console.warn('Cloud withdrawal write failed, queueing for sync:', err);
      }
    }

    if (!syncedToCloud) {
      enqueueSyncAction({
        action: 'update_item',
        targetId: item.id,
        data: itemUpdatePayload,
      });
      enqueueSyncAction({
        action: 'add_log',
        targetId: logId,
        data: newLog,
      });
      showNotification('تم البيع وخصم البضاعة محلياً (سيتم المزامنة مع السحابة فور عودة النت) 📴', 'info');
    } else {
      showNotification('تم البيع وخصم البضاعة وحفظ الحركة في السحابة ☁️', 'success');
    }
  };

  // Edit item (مع دعم العمل بدون إنترنت والمزامنة التلقائية)
  const handleSaveEdit = async (updatedItem: InventoryItem) => {
    const isDepleted =
      (updatedItem.totalUnits || 0) <= 0 ||
      (Number(updatedItem.cartons || 0) === 0 && Number(updatedItem.looseUnits || 0) === 0);

    const finalCartons = isDepleted ? 0 : (updatedItem.cartons ?? 0);
    const finalLoose = isDepleted ? 0 : (updatedItem.looseUnits ?? 0);
    const finalTotal = isDepleted ? 0 : updatedItem.totalUnits;
    const finalUnitsPerCarton = isDepleted
      ? 0
      : (finalCartons > 0 ? (updatedItem.unitsPerCarton || 0) : 0);

    const editPayload = {
      name: updatedItem.name,
      cartons: finalCartons,
      looseUnits: finalLoose,
      totalUnits: finalTotal,
      unitsPerCarton: finalUnitsPerCarton,
      unitBuyPrice: updatedItem.unitBuyPrice,
      cartonBuyPrice: updatedItem.cartonBuyPrice,
      unitSellPrice: updatedItem.unitSellPrice,
      cartonSellPrice: updatedItem.cartonSellPrice,
      note: updatedItem.note || '',
    };

    setInventory((prev) =>
      prev.map((i) =>
        i.id === updatedItem.id
          ? {
              ...updatedItem,
              ...editPayload,
            }
          : i
      )
    );
    setIsEditModalOpen(false);
    setEditingItem(null);

    let synced = false;
    if (isOnline && isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'inventory', updatedItem.id), editPayload);
        synced = true;
        recordSyncSuccess();
        setLastSyncTime(Date.now());
      } catch (err) {
        console.warn('Cloud edit failed, queuing for sync:', err);
      }
    }

    if (!synced) {
      enqueueSyncAction({
        action: 'update_item',
        targetId: updatedItem.id,
        data: editPayload,
      });
      showNotification('تم حفظ التعديل محلياً (سيُرفع للسحابة عند توفر النت) 📴', 'info');
    } else {
      showNotification('تم التعديل والمزامنة بنجاح ☁️', 'success');
    }
  };

  // Delete item with confirmation
  const handleDeleteItem = (item: InventoryItem) => {
    setConfirmConfig({
      isOpen: true,
      message: `عايز تحذف ${item.name} خالص؟`,
      onConfirm: async () => {
        setInventory((prev) => prev.filter((i) => i.id !== item.id));
        if (selectedItemId === item.id) {
          setSelectedItemId('');
        }

        let synced = false;
        if (isOnline && isFirebaseActive && db) {
          try {
            await deleteDoc(doc(db, 'inventory', item.id));
            synced = true;
            recordSyncSuccess();
            setLastSyncTime(Date.now());
          } catch (err) {
            console.warn('Cloud delete failed, queueing for sync:', err);
          }
        }

        if (!synced) {
          enqueueSyncAction({
            action: 'delete_item',
            targetId: item.id,
          });
          showNotification(`تم حذف ${item.name} محلياً (سيُحذف من السحابة عند توفر النت) 📴`, 'info');
        } else {
          showNotification(`تم حذف ${item.name} من المخزن والسحابة ☁️`, 'success');
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete single movement/transaction from withdrawals log
  const handleDeleteLog = (log: WithdrawalLog) => {
    setConfirmConfig({
      isOpen: true,
      message: `متأكد إنك عايز تحذف حركة (${log.itemName} - ${log.withdrawTypeLabel}) من سجل المسحوبات؟`,
      onConfirm: async () => {
        setLogs((prev) => prev.filter((l) => l.id !== log.id));

        let synced = false;
        if (isOnline && isFirebaseActive && db) {
          try {
            await deleteDoc(doc(db, 'logs', log.id));
            synced = true;
            recordSyncSuccess();
            setLastSyncTime(Date.now());
          } catch (err) {
            console.warn('Cloud log delete failed, queueing for sync:', err);
          }
        }

        if (!synced) {
          enqueueSyncAction({
            action: 'delete_log',
            targetId: log.id,
          });
          showNotification('تم حذف الحركة محلياً (ستُحذف من السحابة عند توفر النت) 📴', 'info');
        } else {
          showNotification('تم حذف الحركة من سجل المسحوبات والسحابة ☁️', 'success');
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Clear all data with confirmation
  const handleClearAll = () => {
    setConfirmConfig({
      isOpen: true,
      message: 'تحذير: هل أنت متأكد من تصفير وحذف كل بيانات المخزن والحركات بالكامل؟',
      onConfirm: async () => {
        setInventory([]);
        setLogs([]);
        setSelectedItemId('');
        localStorage.removeItem(STORAGE_KEY_INVENTORY);
        localStorage.removeItem(STORAGE_KEY_LOGS);

        let synced = false;
        if (isOnline && isFirebaseActive && db) {
          try {
            const invSnapshot = await getDocs(collection(db, 'inventory'));
            for (const d of invSnapshot.docs) {
              await deleteDoc(d.ref);
            }
            const logSnapshot = await getDocs(collection(db, 'logs'));
            for (const d of logSnapshot.docs) {
              await deleteDoc(d.ref);
            }
            synced = true;
            recordSyncSuccess();
            setLastSyncTime(Date.now());
          } catch (err) {
            console.warn('Cloud clear failed, queueing for sync:', err);
          }
        }

        if (!synced) {
          enqueueSyncAction({ action: 'clear_all' });
          showNotification('تم تصفير المخزن محلياً (سيتم تصفير السحابة فور عودة النت) 📴', 'info');
        } else {
          showNotification('تم تصفير المخزن بالكامل في السحابة ومحلياً ☁️', 'success');
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Quick action from inventory card
  const handleQuickWithdraw = (itemId: string) => {
    setSelectedItemId(itemId);
    scrollToSection('sectionWithdraw');
  };

  // Open edit modal
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Calculate KPI values
  const { totalCartons, totalUnits, totalAllPieces, totalCost, totalSellValue } = useMemo(() => {
    let cartons = 0;
    let units = 0;
    let allPieces = 0;
    let cost = 0;
    let sell = 0;

    inventory.forEach((item) => {
      const uPerCarton = Math.max(1, item.unitsPerCarton || 1);
      const itemCartons = item.cartons !== undefined
        ? item.cartons
        : Math.floor(item.totalUnits / uPerCarton);
      const itemLoose = item.looseUnits !== undefined
        ? item.looseUnits
        : item.totalUnits % uPerCarton;

      const itemCost = (itemCartons * item.cartonBuyPrice) + (itemLoose * item.unitBuyPrice);
      const itemSell = (itemCartons * item.cartonSellPrice) + (itemLoose * item.unitSellPrice);

      const itemTotalPieces = (item.unitsPerCarton && item.unitsPerCarton > 0)
        ? (itemCartons * item.unitsPerCarton) + itemLoose
        : (item.totalUnits || itemLoose);

      cartons += itemCartons;
      units += itemLoose;
      allPieces += itemTotalPieces;
      cost += itemCost;
      sell += itemSell;
    });

    return {
      totalCartons: cartons,
      totalUnits: units,
      totalAllPieces: allPieces,
      totalCost: cost,
      totalSellValue: sell,
    };
  }, [inventory]);

  // Helper shared between Logs and Inventory for Global Date Filter
  const isInGlobalDateRange = useCallback(
    (timestampMs: number) => {
      if (dateFilter === 'all') return true;
      if (!timestampMs) return false;

      const now = new Date();
      if (dateFilter === 'today') {
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        ).getTime();
        return timestampMs >= startOfToday;
      }
      if (dateFilter === 'week') {
        return timestampMs >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
      }
      if (dateFilter === 'month') {
        return timestampMs >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
      }
      if (dateFilter === 'custom') {
        const startMs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
        const endMs = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Number.MAX_SAFE_INTEGER;
        return timestampMs >= startMs && timestampMs <= endMs;
      }
      return true;
    },
    [dateFilter, startDate, endDate]
  );

  // Global date filter computation (filters KPI profits/income, SalesLogSection, and InventorySection)
  const globallyFilteredLogs = useMemo(() => {
    if (dateFilter === 'all') return logs;
    return logs.filter((log) => isInGlobalDateRange(parseTimestamp(log.createdAt)));
  }, [logs, dateFilter, isInGlobalDateRange]);

  const globallyFilteredInventory = useMemo(() => {
    if (dateFilter === 'all') return inventory;

    return inventory.filter((item) => {
      const createdMs = parseTimestamp(item.createdAt);
      const lastAddedMs = parseTimestamp(item.lastAddedAt);
      const fallbackIdMs =
        !createdMs && !lastAddedMs && item.id?.startsWith('item_')
          ? Number(item.id.replace('item_', '')) || 0
          : 0;

      const hasMatchingHistory =
        Array.isArray(item.additionHistory) &&
        item.additionHistory.some((rec) => isInGlobalDateRange(parseTimestamp(rec.timestamp)));

      return (
        isInGlobalDateRange(createdMs) ||
        isInGlobalDateRange(lastAddedMs) ||
        isInGlobalDateRange(fallbackIdMs) ||
        hasMatchingHistory
      );
    });
  }, [inventory, dateFilter, isInGlobalDateRange]);

  const dateFilterLabel = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return 'النهاردة';
      case 'week':
        return 'آخر 7 أيام';
      case 'month':
        return 'آخر 30 يوم';
      case 'custom':
        return startDate && endDate ? `${startDate} ← ${endDate}` : 'فترة مخصصة';
      default:
        return 'كل الأوقات';
    }
  }, [dateFilter, startDate, endDate]);

  // Realized profit and income from globally filtered logs
  const { realizedProfit, totalIncome } = useMemo(() => {
    let income = 0;
    let profit = 0;

    globallyFilteredLogs.forEach((l) => {
      income += Number(l.incomeValue || 0);
      profit += Number(l.profit || 0);
    });

    return { realizedProfit: profit, totalIncome: income };
  }, [globallyFilteredLogs]);

  const tabs: { id: AppTab; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: 'fa-house' },
    { id: 'inventory', label: 'بضاعة المخزن', icon: 'fa-boxes-stacked', badge: globallyFilteredInventory.length },
    { id: 'logs', label: 'سجل المسحوبات', icon: 'fa-clipboard-list', badge: globallyFilteredLogs.length },
  ];

  return (
    <div className="text-slate-800 dark:text-slate-100 min-h-screen flex flex-col pb-6 bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Edit Item Modal */}
      <EditModal
        item={editingItem}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Header مع مؤشرات السحابة والاتصال والوضع الليلي والـ PWA */}
      <Header
        onClearAll={handleClearAll}
        onScrollTo={scrollToSection}
        isFirebaseActive={isFirebaseActive}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onTriggerSync={() => runCloudSync(true)}
        lastSyncTime={lastSyncTime}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* شريط تنبيه وضع عدم الاتصال والمزامنة */}
      <OfflineBanner
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onTriggerSync={() => runCloudSync(true)}
      />

      {/* Top Controls: Global Date Filter + Top Tabbed Navigation */}
      <div className="max-w-4xl w-full mx-auto px-4 pt-4 space-y-3">
        <GlobalDateFilter
          dateFilter={dateFilter}
          startDate={startDate}
          endDate={endDate}
          onDateFilterChange={setDateFilter}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          filteredCount={activeTab === 'inventory' ? globallyFilteredInventory.length : globallyFilteredLogs.length}
          totalCount={activeTab === 'inventory' ? inventory.length : logs.length}
          unitLabel={activeTab === 'inventory' ? 'صنف' : 'حركة'}
        />

        {/* شريط التبويبات العلوي */}
        <nav
          aria-label="التنقل الرئيسي"
          className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl soft-shadow border border-slate-200/80 dark:border-slate-800 flex items-stretch gap-1 sm:gap-1.5"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex justify-center items-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[10px] min-[375px]:text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-brand-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <i
                  className={`fa-solid ${tab.icon} text-[11px] sm:text-xs shrink-0 ${
                    isActive ? 'text-brand-accent dark:text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                ></i>
                <span className="whitespace-normal text-center leading-tight">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-en px-1 sm:px-1.5 py-0.5 rounded-md font-extrabold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content (Active Tab Only) */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-4 space-y-5">
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-fade">
            {/* KPI Dashboard */}
            <KpiCards
              totalCartons={totalCartons}
              totalUnits={totalUnits}
              totalAllPieces={totalAllPieces}
              totalCost={totalCost}
              totalSellValue={totalSellValue}
              realizedProfit={realizedProfit}
              totalIncome={totalIncome}
              dateFilterLabel={dateFilter !== 'all' ? dateFilterLabel : undefined}
            />

            {/* Add Stock Section */}
            <AddStockSection inventory={inventory} onAddStock={handleAddStock} />

            {/* Withdraw Section */}
            <WithdrawSection
              inventory={inventory}
              selectedItemId={selectedItemId}
              onSelectItemId={setSelectedItemId}
              onWithdraw={handleWithdraw}
            />
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventorySection
            inventory={globallyFilteredInventory}
            totalInventoryCount={inventory.length}
            activeDateLabel={dateFilterLabel}
            onQuickWithdraw={handleQuickWithdraw}
            onEditItem={handleOpenEdit}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'logs' && (
          <SalesLogSection
            logs={globallyFilteredLogs}
            onDeleteLog={handleDeleteLog}
            activeDateLabel={dateFilterLabel}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 border-t border-slate-200 dark:border-slate-800 mt-auto flex flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
          <span>MK SYSTEM</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <i className={`fa-solid ${isOnline ? 'fa-cloud-check text-emerald-500' : 'fa-hard-drive text-amber-500'}`}></i>
            {isOnline ? 'مزامنة سحابية نشطة' : 'وضع أوفلاين محلي'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          يعمل بدون إنترنت وتتم المزامنة تلقائياً مع السحابة فور عودة الاتصال
        </p>
      </footer>
    </div>
  );
};

export default App;
