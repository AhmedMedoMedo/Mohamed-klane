import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

export interface QueuedSyncAction {
  id: string;
  action: 'add_item' | 'update_item' | 'delete_item' | 'add_log' | 'delete_log' | 'clear_all';
  targetId?: string;
  data?: any;
  timestamp: number;
}

const STORAGE_KEY_SYNC_QUEUE = 'mk_system_sync_queue_v1';
const STORAGE_KEY_LAST_SYNC = 'mk_system_last_sync_timestamp_v1';

export function getSyncQueue(): QueuedSyncAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading sync queue:', e);
    return [];
  }
}

export function saveSyncQueue(queue: QueuedSyncAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(queue));
    // Trigger custom event so reactive components update pending count instantly
    window.dispatchEvent(new CustomEvent('mk_sync_queue_changed', { detail: { count: queue.length } }));
  } catch (e) {
    console.error('Error saving sync queue:', e);
  }
}

export function enqueueSyncAction(action: Omit<QueuedSyncAction, 'id' | 'timestamp'>): void {
  const queue = getSyncQueue();
  const newItem: QueuedSyncAction = {
    ...action,
    id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
  };
  queue.push(newItem);
  saveSyncQueue(queue);
}

export function getLastSyncTime(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function recordSyncSuccess(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, String(Date.now()));
  } catch {}
}

/**
 * Sends all pending actions to Firebase Firestore in chronological order
 */
export async function processSyncQueue(
  db: Firestore
): Promise<{ syncedCount: number; remainingCount: number; errors: any[] }> {
  const queue = getSyncQueue();
  if (queue.length === 0) {
    recordSyncSuccess();
    return { syncedCount: 0, remainingCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const remainingQueue: QueuedSyncAction[] = [];
  const errors: any[] = [];

  for (const item of queue) {
    try {
      switch (item.action) {
        case 'add_item': {
          if (item.targetId) {
            // Use setDoc with predetermined ID so ID doesn't change on sync
            await setDoc(doc(db, 'inventory', item.targetId), item.data, { merge: true });
          } else {
            await addDoc(collection(db, 'inventory'), item.data);
          }
          syncedCount++;
          break;
        }

        case 'update_item': {
          if (item.targetId) {
            await setDoc(doc(db, 'inventory', item.targetId), item.data, { merge: true });
            syncedCount++;
          }
          break;
        }

        case 'delete_item': {
          if (item.targetId) {
            await deleteDoc(doc(db, 'inventory', item.targetId));
            syncedCount++;
          }
          break;
        }

        case 'add_log': {
          if (item.targetId) {
            await setDoc(doc(db, 'logs', item.targetId), item.data, { merge: true });
          } else {
            await addDoc(collection(db, 'logs'), item.data);
          }
          syncedCount++;
          break;
        }

        case 'delete_log': {
          if (item.targetId) {
            await deleteDoc(doc(db, 'logs', item.targetId));
            syncedCount++;
          }
          break;
        }

        case 'clear_all': {
          const invSnapshot = await getDocs(collection(db, 'inventory'));
          for (const d of invSnapshot.docs) {
            await deleteDoc(d.ref);
          }
          const logSnapshot = await getDocs(collection(db, 'logs'));
          for (const d of logSnapshot.docs) {
            await deleteDoc(d.ref);
          }
          syncedCount++;
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.warn('Sync item failed, keeping in queue:', item, err);
      errors.push({ item, err });
      remainingQueue.push(item);
    }
  }

  saveSyncQueue(remainingQueue);
  if (remainingQueue.length === 0) {
    recordSyncSuccess();
  }

  return { syncedCount, remainingCount: remainingQueue.length, errors };
}
