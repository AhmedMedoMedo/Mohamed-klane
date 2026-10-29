import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  db,
  isFirebaseActive,
  InventoryItem,
  WithdrawalLog,
} from './firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { AddStockSection, AddStockData } from './components/AddStockSection';
import { WithdrawSection } from './components/WithdrawSection';
import { InventorySection } from './components/InventorySection';
import { SalesLogSection } from './components/SalesLogSection';
import { EditModal } from './components/EditModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { formatCartonBreakdown, getCurrentTimeString, normalizeArabic } from './utils/formatters';

const STORAGE_KEY_INVENTORY = 'mk_system_inventory_v1';
const STORAGE_KEY_LOGS = 'mk_system_logs_v1';

export const App: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
      return saved ? JSON.parse(saved) : [];
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

  // Track filtered logs for KPI updates
  const [activeFilteredLogs, setActiveFilteredLogs] = useState<WithdrawalLog[]>(logs);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Save to localStorage when state updates
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

  // Connect to Firestore if available
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
            const upc = Math.max(1, Number(data.unitsPerCarton) || 1);
            const total = Number(data.totalUnits || 0);
            const c = data.cartons !== undefined ? Number(data.cartons) : Math.floor(total / upc);
            const l = data.looseUnits !== undefined ? Number(data.looseUnits) : total % upc;
            items.push({
              id: d.id,
              ...data,
              cartons: c,
              looseUnits: l,
              totalUnits: total,
              unitsPerCarton: upc,
            } as InventoryItem);
          });
          setInventory(items);
        },
        (error) => {
          console.warn('Firebase read error (inventory):', error);
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
          console.warn('Firebase read error (logs):', error);
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

  // Helper to scroll to any section smoothly
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add or increment stock
  const handleAddStock = async (data: AddStockData) => {
    // Check if item exists by selectedId or normalized name
    const existing = data.existingId
      ? inventory.find((i) => i.id === data.existingId)
      : inventory.find(
          (i) => normalizeArabic(i.name) === normalizeArabic(data.name)
        );

    const uPerCarton = data.addType === 'cartons'
      ? Math.max(1, data.unitsPerCarton || 1)
      : (existing && existing.cartons && existing.cartons > 0 ? (existing.unitsPerCarton || 0) : 0);

    let newCartons = 0;
    let newLooseUnits = 0;

    if (existing) {
      const curCartons = existing.cartons !== undefined
        ? existing.cartons
        : (uPerCarton > 0 ? Math.floor(existing.totalUnits / uPerCarton) : 0);
      const curLoose = existing.looseUnits !== undefined
        ? existing.looseUnits
        : (uPerCarton > 0 ? existing.totalUnits % uPerCarton : existing.totalUnits);

      if (data.addType === 'cartons') {
        newCartons = curCartons + data.quantity;
        newLooseUnits = curLoose; // لا تتحول القطع الفرط إلى كرتونة تلقائياً
      } else {
        newCartons = curCartons; // لا تزيد الكراتين وتزيد القطع الفرط فقط
        newLooseUnits = curLoose + data.quantity;
      }
    } else {
      if (data.addType === 'cartons') {
        newCartons = data.quantity;
        newLooseUnits = 0;
      } else {
        newCartons = 0;
        newLooseUnits = data.quantity;
      }
    }

    const newTotalUnits = (newCartons * Math.max(1, uPerCarton)) + newLooseUnits;

    const addedDescription =
      data.addType === 'cartons'
        ? `${data.quantity} كرتونة`
        : `${data.quantity} قطعة فرط`;

    try {
      if (isFirebaseActive && db) {
        if (existing) {
          await updateDoc(doc(db, 'inventory', existing.id), {
            cartons: newCartons,
            looseUnits: newLooseUnits,
            totalUnits: newTotalUnits,
            unitsPerCarton: uPerCarton,
            unitBuyPrice: data.unitBuyPrice,
            cartonBuyPrice: data.cartonBuyPrice,
            unitSellPrice: data.unitSellPrice,
            cartonSellPrice: data.cartonSellPrice,
            note: data.note || existing.note || '',
          });
          showNotification(`تمت زيادة رصيد ${existing.name} بمقدار ${addedDescription}`, 'success');
        } else {
          await addDoc(collection(db, 'inventory'), {
            name: data.name,
            cartons: newCartons,
            looseUnits: newLooseUnits,
            totalUnits: newTotalUnits,
            unitsPerCarton: uPerCarton,
            unitBuyPrice: data.unitBuyPrice,
            cartonBuyPrice: data.cartonBuyPrice,
            unitSellPrice: data.unitSellPrice,
            cartonSellPrice: data.cartonSellPrice,
            note: data.note,
            createdAt: serverTimestamp(),
          });
          showNotification(
            `تم إضافة ${data.name} للمخزن برصيد ${addedDescription}`,
            'success'
          );
        }
      } else {
        // Local state fallback
        if (existing) {
          setInventory((prev) =>
            prev.map((item) =>
              item.id === existing.id
                ? {
                    ...item,
                    cartons: newCartons,
                    looseUnits: newLooseUnits,
                    totalUnits: newTotalUnits,
                    unitsPerCarton: uPerCarton,
                    unitBuyPrice: data.unitBuyPrice,
                    cartonBuyPrice: data.cartonBuyPrice,
                    unitSellPrice: data.unitSellPrice,
                    cartonSellPrice: data.cartonSellPrice,
                    note: data.note || item.note || '',
                  }
                : item
            )
          );
          showNotification(`تمت زيادة رصيد ${existing.name} بمقدار ${addedDescription}`, 'success');
        } else {
          const newItem: InventoryItem = {
            id: 'item_' + Date.now(),
            name: data.name,
            cartons: newCartons,
            looseUnits: newLooseUnits,
            totalUnits: newTotalUnits,
            unitsPerCarton: uPerCarton,
            unitBuyPrice: data.unitBuyPrice,
            cartonBuyPrice: data.cartonBuyPrice,
            unitSellPrice: data.unitSellPrice,
            cartonSellPrice: data.cartonSellPrice,
            note: data.note,
            createdAt: Date.now(),
          };
          setInventory((prev) => [newItem, ...prev]);
          showNotification(
            `تم إضافة ${data.name} للمخزن برصيد ${addedDescription}`,
            'success'
          );
        }
      }
    } catch (e) {
      console.error(e);
      showNotification('حصلت مشكلة وقت الحفظ', 'error');
    }
  };

  // Withdraw / Sell stock
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
      // سحب قطع فرط
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

    try {
      if (isFirebaseActive && db) {
        await updateDoc(doc(db, 'inventory', item.id), {
          cartons: newCartons,
          looseUnits: newLooseUnits,
          totalUnits: newTotalUnits,
        });

        await addDoc(collection(db, 'logs'), {
          itemName: item.name,
          withdrawTypeLabel: typeLabel,
          unitsDeducted: unitsToDeduct,
          costValue: cost,
          incomeValue: income,
          profit: profit,
          note: data.note,
          timestamp: timeStr,
          createdAt: Date.now(),
        });
      } else {
        // Local state
        setInventory((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  cartons: newCartons,
                  looseUnits: newLooseUnits,
                  totalUnits: newTotalUnits,
                }
              : i
          )
        );
        const newLog: WithdrawalLog = {
          id: 'log_' + Date.now(),
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
        setLogs((prev) => [newLog, ...prev]);
      }

      showNotification('تم البيع وخصم البضاعة من المخزن', 'success');
    } catch (e) {
      console.error(e);
      showNotification('حصلت مشكلة وقت البيع', 'error');
    }
  };

  // Edit item
  const handleSaveEdit = async (updatedItem: InventoryItem) => {
    try {
      if (isFirebaseActive && db) {
        await updateDoc(doc(db, 'inventory', updatedItem.id), {
          name: updatedItem.name,
          cartons: updatedItem.cartons ?? 0,
          looseUnits: updatedItem.looseUnits ?? 0,
          totalUnits: updatedItem.totalUnits,
          unitsPerCarton: updatedItem.unitsPerCarton,
          unitBuyPrice: updatedItem.unitBuyPrice,
          cartonBuyPrice: updatedItem.cartonBuyPrice,
          unitSellPrice: updatedItem.unitSellPrice,
          cartonSellPrice: updatedItem.cartonSellPrice,
          note: updatedItem.note || '',
        });
      } else {
        setInventory((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );
      }
      setIsEditModalOpen(false);
      setEditingItem(null);
      showNotification('تم التعديل بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showNotification('مقدرناش نحفظ التعديل', 'error');
    }
  };

  // Delete item with confirmation
  const handleDeleteItem = (item: InventoryItem) => {
    setConfirmConfig({
      isOpen: true,
      message: `عايز تحذف ${item.name} خالص؟`,
      onConfirm: async () => {
        try {
          if (isFirebaseActive && db) {
            await deleteDoc(doc(db, 'inventory', item.id));
          } else {
            setInventory((prev) => prev.filter((i) => i.id !== item.id));
          }
          if (selectedItemId === item.id) {
            setSelectedItemId('');
          }
          showNotification(`تم حذف ${item.name}`, 'success');
        } catch (e) {
          console.error(e);
          showNotification('حصلت مشكلة وقت الحذف', 'error');
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
        try {
          if (isFirebaseActive && db) {
            await deleteDoc(doc(db, 'logs', log.id));
          } else {
            setLogs((prev) => prev.filter((l) => l.id !== log.id));
          }
          showNotification('تم حذف الحركة من سجل المسحوبات بنجاح', 'success');
        } catch (e) {
          console.error(e);
          showNotification('حصلت مشكلة وقت حذف الحركة', 'error');
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Clear all data
  const handleClearAll = () => {
    setConfirmConfig({
      isOpen: true,
      message: 'متأكد إنك عايز تصفر المخزن وتمسح كل حاجة؟',
      onConfirm: async () => {
        try {
          if (isFirebaseActive && db) {
            const invSnapshot = await getDocs(collection(db, 'inventory'));
            for (const d of invSnapshot.docs) {
              await deleteDoc(d.ref);
            }
            const logSnapshot = await getDocs(collection(db, 'logs'));
            for (const d of logSnapshot.docs) {
              await deleteDoc(d.ref);
            }
          }
          setInventory([]);
          setLogs([]);
          setSelectedItemId('');
          localStorage.removeItem(STORAGE_KEY_INVENTORY);
          localStorage.removeItem(STORAGE_KEY_LOGS);
          showNotification('تم تصفير المخزن بالكامل', 'success');
        } catch (e) {
          console.error(e);
          showNotification('مشكلة في التصفير', 'error');
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Quick action from inventory card: preselects item and scrolls to withdraw section
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

  // Realized profit and income from active filtered logs
  const { realizedProfit, totalIncome } = useMemo(() => {
    let income = 0;
    let profit = 0;

    activeFilteredLogs.forEach((l) => {
      income += Number(l.incomeValue || 0);
      profit += Number(l.profit || 0);
    });

    return { realizedProfit: profit, totalIncome: income };
  }, [activeFilteredLogs]);

  return (
    <div className="text-slate-800 min-h-screen flex flex-col pb-6 bg-slate-100">
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

      {/* Header */}
      <Header onClearAll={handleClearAll} onScrollTo={scrollToSection} />

      {/* Main Content */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-5 space-y-5">
        {/* KPI Dashboard */}
        <KpiCards
          totalCartons={totalCartons}
          totalUnits={totalUnits}
          totalAllPieces={totalAllPieces}
          totalCost={totalCost}
          totalSellValue={totalSellValue}
          realizedProfit={realizedProfit}
          totalIncome={totalIncome}
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

        {/* Inventory Table/Cards Section */}
        <InventorySection
          inventory={inventory}
          onQuickWithdraw={handleQuickWithdraw}
          onEditItem={handleOpenEdit}
          onDeleteItem={handleDeleteItem}
        />

        {/* Sales Logs Section (سجل المسحوبات) */}
        <SalesLogSection
          logs={logs}
          onFilteredLogsChange={setActiveFilteredLogs}
          onDeleteLog={handleDeleteLog}
        />
      </main>
    </div>
  );
};

export default App;
