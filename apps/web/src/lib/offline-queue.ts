/**
 * Offline Sync Queue using IndexedDB via idb-keyval
 *
 * Queues scans and voice commands when device is offline,
 * and synchronizes automatically when online status resumes.
 */
import { get, set, del } from 'idb-keyval';

export interface QueuedItem {
  id: string;
  type: 'BILL_SCAN' | 'VOICE_COMMAND';
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = 'vyapar_offline_queue_v1';

export async function getQueue(): Promise<QueuedItem[]> {
  try {
    const queue = await get<QueuedItem[]>(QUEUE_STORAGE_KEY);
    return queue || [];
  } catch (err) {
    console.error('Failed to read offline queue from IndexedDB', err);
    return [];
  }
}

export async function enqueueAction(
  type: 'BILL_SCAN' | 'VOICE_COMMAND',
  payload: Record<string, unknown>,
): Promise<QueuedItem> {
  const queue = await getQueue();
  const newItem: QueuedItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    payload,
    createdAt: Date.now(),
    retries: 0,
  };

  queue.push(newItem);
  await set(QUEUE_STORAGE_KEY, queue);
  return newItem;
}

export async function dequeueAction(id: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.filter((item) => item.id !== id);
  await set(QUEUE_STORAGE_KEY, updated);
}

export async function clearQueue(): Promise<void> {
  await del(QUEUE_STORAGE_KEY);
}

export async function syncQueue(
  apiBaseUrl: string,
  authToken: string,
  onItemSynced?: (item: QueuedItem, success: boolean) => void,
): Promise<{ processed: number; succeeded: number; failed: number }> {
  if (!navigator.onLine) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const queue = await getQueue();
  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      let endpoint = '';
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      if (item.type === 'BILL_SCAN') {
        endpoint = `${apiBaseUrl}/bills/scan`;
        headers['Idempotency-Key'] = item.id;
      } else if (item.type === 'VOICE_COMMAND') {
        endpoint = `${apiBaseUrl}/voice/command`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(item.payload),
      });

      if (res.ok || res.status === 409) {
        // Successfully processed or already processed previously
        await dequeueAction(item.id);
        succeeded++;
        onItemSynced?.(item, true);
      } else {
        failed++;
        item.retries += 1;
        onItemSynced?.(item, false);
      }
    } catch (e) {
      console.error('Error syncing queue item:', item.id, e);
      failed++;
      onItemSynced?.(item, false);
    }
  }

  return {
    processed: queue.length,
    succeeded,
    failed,
  };
}

