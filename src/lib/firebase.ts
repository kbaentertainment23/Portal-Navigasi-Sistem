import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  increment,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { NavLinkItem, SiteSettings, DEFAULT_CATEGORIES } from '../types';
import { DEFAULT_SETTINGS } from '../data/initialData';

// Firestore Operation Types for Error Logging
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

/**
 * Standardized Firestore error and reconnect handler
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    operationType,
    path,
    timestamp: new Date().toISOString(),
  };

  // WebChannel stream transport warnings are transient reconnect events in cloud containers
  if (message.includes('WebChannelConnection') || message.includes('RPC \'Listen\'')) {
    console.warn(`[Firestore Stream Reconnecting (${operationType} on ${path})]:`, message);
  } else {
    console.error(`[Firestore ${operationType} Error on ${path}]:`, message);
  }
  return errInfo;
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with memory local cache for optimal iframe performance and zero IndexedDB lease contention
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        localCache: memoryLocalCache(),
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch (e) {
    // Fallback if initializeFirestore was already called
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

const LINKS_COLLECTION = 'links';
const SETTINGS_DOC = 'settings/admin_config';

/**
 * Subscribe to all links with real-time updates and graceful error handling
 */
export function subscribeToLinks(
  callback: (links: NavLinkItem[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const linksQuery = query(collection(db, LINKS_COLLECTION), orderBy('order', 'asc'));

  return onSnapshot(
    linksQuery,
    (snapshot) => {
      const links: NavLinkItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          url: data.url || '',
          description: data.description || '',
          category: data.category || 'Lainnya',
          icon: data.icon || 'Globe',
          color: data.color || 'indigo',
          order: typeof data.order === 'number' ? data.order : 10,
          isActive: data.isActive !== false,
          isFeatured: Boolean(data.isFeatured),
          isLocked: Boolean(data.isLocked),
          pinCode: data.pinCode || '',
          isStealthMode: Boolean(data.isStealthMode),
          clicks: data.clicks || 0,
          isScheduled: Boolean(data.isScheduled),
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          expiredAction: data.expiredAction || 'hide',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });
      callback(links);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, LINKS_COLLECTION);
      if (onError) onError(error);
      // NOTE: We deliberately DO NOT wipe out callback([]) on transient transport errors,
      // keeping the UI state stable while Firestore automatically reconnects in background.
    }
  );
}

/**
 * Subscribe to site & admin settings with real-time updates and graceful error handling
 */
export function subscribeToSettings(
  callback: (settings: SiteSettings) => void,
  onError?: (error: unknown) => void
): () => void {
  const settingsDocRef = doc(db, SETTINGS_DOC);

  return onSnapshot(
    settingsDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          ...DEFAULT_SETTINGS,
          ...data,
          adminPassword: data.adminPassword || DEFAULT_SETTINGS.adminPassword,
          siteTitle: data.siteTitle || DEFAULT_SETTINGS.siteTitle,
          siteSubtitle: data.siteSubtitle || DEFAULT_SETTINGS.siteSubtitle,
          categories:
            Array.isArray(data.categories) && data.categories.length > 0
              ? data.categories
              : DEFAULT_CATEGORIES,
          updatedAt: data.updatedAt,
        });
      } else {
        // Initialize settings document if it doesn't exist yet
        setDoc(settingsDocRef, {
          ...DEFAULT_SETTINGS,
          updatedAt: new Date().toISOString(),
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, SETTINGS_DOC));
        callback(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, SETTINGS_DOC);
      if (onError) onError(error);
      // NOTE: We DO NOT force DEFAULT_SETTINGS override on transport disconnect to prevent UI reset.
    }
  );
}

/**
 * Add a new navigation link
 */
export async function addLink(linkData: Omit<NavLinkItem, 'id' | 'clicks'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, LINKS_COLLECTION), {
      ...linkData,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, LINKS_COLLECTION);
    throw error;
  }
}

/**
 * Update an existing navigation link
 */
export async function updateLink(id: string, updates: Partial<NavLinkItem>): Promise<void> {
  const docRef = doc(db, LINKS_COLLECTION, id);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${LINKS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Delete a navigation link
 */
export async function deleteLink(id: string): Promise<void> {
  const docRef = doc(db, LINKS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${LINKS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Increment click count on link
 */
export async function incrementLinkClick(id: string): Promise<void> {
  try {
    const docRef = doc(db, LINKS_COLLECTION, id);
    await updateDoc(docRef, {
      clicks: increment(1),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${LINKS_COLLECTION}/${id}`);
  }
}

/**
 * Update site & admin settings (e.g., change password or title)
 */
export async function updateSettings(updates: Partial<SiteSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_DOC);
  try {
    await setDoc(
      docRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC);
    throw error;
  }
}

/**
 * Reset click count to 0 for all links
 */
export async function resetAllClicks(): Promise<void> {
  try {
    const linksSnap = await getDocs(collection(db, LINKS_COLLECTION));
    const promises = linksSnap.docs.map((docSnap) =>
      updateDoc(doc(db, LINKS_COLLECTION, docSnap.id), {
        clicks: 0,
        updatedAt: new Date().toISOString(),
      })
    );
    await Promise.all(promises);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, LINKS_COLLECTION);
    throw err;
  }
}

/**
 * Reset click count to 0 for a single link
 */
export async function resetSingleLinkClick(id: string): Promise<void> {
  try {
    const docRef = doc(db, LINKS_COLLECTION, id);
    await updateDoc(docRef, {
      clicks: 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${LINKS_COLLECTION}/${id}`);
    throw err;
  }
}

let seedExecuted = false;

/**
 * Seed initial settings if database is empty (no automatic sample links will be created)
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  if (seedExecuted) return;
  seedExecuted = true;
  try {
    const settingsDocRef = doc(db, SETTINGS_DOC);
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
    } else if (settingsSnap.data().adminPassword === 'admin123') {
      await updateDoc(settingsDocRef, {
        adminPassword: 'budiardika25',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SETTINGS_DOC);
  }
}

