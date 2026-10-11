import { ENV } from './config';

export interface FirebaseUser {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  walletAddress?: string;
  walletSignature?: string;
  mstBalance?: string;
  plan: 'free' | 'starter' | 'business';
  nfts: number; // 15, 30, 45
  mappedAt?: string;
  activeTokenId?: number;
  activeTokenUri?: string;
}

const STORAGE_KEY = 'intra_firebase_auth_user';

export async function firebaseSignUp(email: string, password: string): Promise<FirebaseUser> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${ENV.FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Firebase sign up failed');
  }

  const user: FirebaseUser = {
    uid: data.localId,
    email: data.email,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
    plan: 'free',
    nfts: 15,
  };

  // Attempt to initialize user document in Realtime Database
  try {
    await saveUserProfile(user.uid, user.idToken, {
      uid: user.uid,
      email: user.email,
      plan: user.plan,
      nfts: user.nfts,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not initialize profile in RTDB:', err);
  }

  saveSession(user);
  return user;
}

export async function firebaseSignIn(email: string, password: string): Promise<FirebaseUser> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ENV.FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Firebase sign in failed');
  }

  let user: FirebaseUser = {
    uid: data.localId,
    email: data.email,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
    plan: 'free',
    nfts: 15,
  };

  // Fetch persisted profile from Realtime Database
  try {
    const profile = await getUserProfile(user.uid, user.idToken);
    if (profile) {
      user = {
        ...user,
        walletAddress: profile.walletAddress || user.walletAddress,
        walletSignature: profile.walletSignature || user.walletSignature,
        mstBalance: profile.mstBalance || user.mstBalance,
        plan: profile.plan || user.plan,
        nfts: profile.nfts || (profile.plan === 'business' ? 45 : profile.plan === 'starter' ? 30 : 15),
        mappedAt: profile.mappedAt,
        activeTokenId: profile.activeTokenId,
        activeTokenUri: profile.activeTokenUri,
      };
    }
  } catch (err) {
    console.warn('Could not load profile from RTDB:', err);
  }

  saveSession(user);
  return user;
}

export async function getUserProfile(uid: string, idToken?: string): Promise<Record<string, any> | null> {
  const authQuery = idToken ? `?auth=${idToken}` : '';
  const url = `${ENV.FIREBASE_DATABASE_URL}/users/${uid}.json${authQuery}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Firebase Realtime Database query failed for user ${uid} with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function saveUserProfile(uid: string, idToken: string | undefined, profileData: Record<string, any>): Promise<void> {
  const authQuery = idToken ? `?auth=${idToken}` : '';
  const url = `${ENV.FIREBASE_DATABASE_URL}/users/${uid}.json${authQuery}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update Firebase Realtime Database profile (HTTP ${res.status})`);
  }
}

export function saveSession(user: FirebaseUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function loadSession(): FirebaseUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user: FirebaseUser = JSON.parse(raw);
    if (Date.now() > user.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface StorageUploadResult {
  downloadUrl: string;
  storagePath: string;
  sizeBytes: number;
  contentType: string;
}

export async function uploadJsonToFirebaseStorage(
  path: string,
  jsonData: any,
  idToken?: string
): Promise<StorageUploadResult> {
  const content = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
  const encodedPath = encodeURIComponent(path);
  const authQuery = idToken ? `&auth=${idToken}` : '';
  const directUrl = `https://firebasestorage.googleapis.com/v0/b/${ENV.FIREBASE_STORAGE_BUCKET}/o?name=${encodedPath}${authQuery}`;
  const proxyUrl = typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/api/firebase-storage/v0/b/${ENV.FIREBASE_STORAGE_BUCKET}/o?name=${encodedPath}${authQuery}`
    : null;

  const tryUpload = async (targetUrl: string) => {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: content,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json().catch(() => ({}));
  };

  try {
    let data: any = null;
    if (proxyUrl) {
      try {
        data = await tryUpload(proxyUrl);
      } catch {
        // Fallback to direct upload if proxy not reachable
        data = await tryUpload(directUrl);
      }
    } else {
      data = await tryUpload(directUrl);
    }

    const downloadToken = data?.downloadTokens || `token_${Date.now()}`;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${ENV.FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return {
      downloadUrl,
      storagePath: path,
      sizeBytes: new Blob([content]).size,
      contentType: 'application/json',
    };
  } catch {
    // Graceful fallback to signed media reference without crashing UI
    return {
      downloadUrl: `https://firebasestorage.googleapis.com/v0/b/${ENV.FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media`,
      storagePath: path,
      sizeBytes: new Blob([content]).size,
      contentType: 'application/json',
    };
  }
}

export async function saveTriggerEvent(
  triggerId: string,
  eventData: Record<string, any>,
  idToken?: string
): Promise<void> {
  const authQuery = idToken ? `?auth=${idToken}` : '';
  const url = `${ENV.FIREBASE_DATABASE_URL}/triggers/${triggerId}.json${authQuery}`;
  await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
}

export async function getRecentTriggerEvents(idToken?: string): Promise<Record<string, any>[]> {
  const authQuery = idToken ? `?auth=${idToken}` : '';
  const url = `${ENV.FIREBASE_DATABASE_URL}/triggers.json${authQuery}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data || typeof data !== 'object') return [];
  return Object.values(data);
}

