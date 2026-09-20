import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

export const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function getAdminInstances() {
  if (adminAuth && adminDb) {
    return { adminApp, adminAuth, adminDb };
  }

  if (isFirebaseAdminConfigured) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");

      const apps = getApps();
      if (!apps.length) {
        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });
      } else {
        adminApp = apps[0];
      }
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
    } catch (error) {
      console.warn("Firebase Admin initialization warning:", error);
    }
  }

  return { adminApp, adminAuth, adminDb };
}

// Initialize safely without throwing top-level crash
try {
  getAdminInstances();
} catch (_) {}

export { adminApp, adminAuth, adminDb };

export async function createTenantCustomToken(tenantId: string, claims = {}) {
  try {
    const { adminAuth: auth } = getAdminInstances();
    if (auth) {
      return await auth.createCustomToken(tenantId, claims);
    }
  } catch (e) {
    console.warn("createCustomToken fallback:", e);
  }
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: tenantId, role: "tenant", ...claims, iat: Math.floor(Date.now() / 1000) })
  ).toString("base64url");
  return `${header}.${payload}.demo_signature`;
}
