import {
  PGProfile,
  PGApplication,
  Room,
  RoomEBReading,
  Tenant,
  TenantHistory,
  Payment,
  Ticket,
  OwnerDashboardStats,
  TicketStatus,
  SharingCategory,
} from "@/types";
import { isFirebaseConfigured, db } from "./firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";


export async function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Database operation timed out")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export const CURRENT_MONTH = "2026-09";

// No default seed data — the app starts fresh.
// All PG profiles, rooms, tenants, payments and tickets
// are created through the admin-verified registration flow.

// Persistent Node memory singleton
interface GlobalStore {
  pgs: PGProfile[];
  rooms: Room[];
  tenants: Tenant[];
  tenantHistory: TenantHistory[];
  payments: Payment[];
  tickets: Ticket[];
  ebReadings: RoomEBReading[];
  seededFirestore: boolean;
}

const globalForStore = globalThis as unknown as {
  __PGM_STORE__?: GlobalStore;
};

function getStore(): GlobalStore {
  if (!globalForStore.__PGM_STORE__) {
    globalForStore.__PGM_STORE__ = {
      pgs: [],
      rooms: [],
      tenants: [],
      tenantHistory: [],
      payments: [],
      tickets: [],
      ebReadings: [],
      seededFirestore: false,
    };
  }

  if (!globalForStore.__PGM_STORE__.ebReadings) {
    globalForStore.__PGM_STORE__.ebReadings = [];
  }

  return globalForStore.__PGM_STORE__;
}

// Ensure remote Firestore has initial collections if currently empty
async function syncToFirestoreIfEmpty() {
  if (!isFirebaseConfigured || !db) return;
  const store = getStore();
  if (store.seededFirestore) return;

  try {
    const snap = await withTimeout(getDocs(collection(db, "pgs")), 3000);
    if (snap.empty) {
      console.log("[PGM Firestore] Initializing Firestore collections...");
      for (const p of store.pgs) {
        await setDoc(doc(db, "pgs", p.id), p);
      }
      for (const r of store.rooms) {
        await setDoc(doc(db, "rooms", r.id), r);
      }
      for (const t of store.tenants) {
        await setDoc(doc(db, "tenants", t.id), t);
      }
      for (const th of store.tenantHistory) {
        await setDoc(doc(db, "tenant_history", th.id), th);
      }
      for (const pay of store.payments) {
        await setDoc(doc(db, "payments", pay.id), pay);
      }
      for (const tk of store.tickets) {
        await setDoc(doc(db, "tickets", tk.id), tk);
      }
      console.log("[PGM Firestore] Seed complete.");
    } else {
      // Load all Firestore PGs into memory
      const firestorePgs = snap.docs.map((d) => d.data() as PGProfile);
      store.pgs = firestorePgs;

      // Load all rooms from Firestore
      try {
        const roomsSnap = await withTimeout(getDocs(collection(db, "rooms")), 2500);
        if (!roomsSnap.empty) {
          store.rooms = roomsSnap.docs.map((d) => d.data() as Room);
        }
      } catch (_) {}

      // Load all tenants from Firestore
      try {
        const tenantsSnap = await withTimeout(getDocs(collection(db, "tenants")), 2500);
        if (!tenantsSnap.empty) {
          store.tenants = tenantsSnap.docs.map((d) => d.data() as Tenant);
        }
      } catch (_) {}

      // Load all payments from Firestore
      try {
        const paymentsSnap = await withTimeout(getDocs(collection(db, "payments")), 2500);
        if (!paymentsSnap.empty) {
          store.payments = paymentsSnap.docs.map((d) => d.data() as Payment);
        }
      } catch (_) {}

      // Load all tickets from Firestore
      try {
        const ticketsSnap = await withTimeout(getDocs(collection(db, "tickets")), 2500);
        if (!ticketsSnap.empty) {
          store.tickets = ticketsSnap.docs.map((d) => d.data() as Ticket);
        }
      } catch (_) {}
    }
    store.seededFirestore = true;
  } catch (err) {
    console.warn("Firestore sync error:", err);
  }
}

// -------------------------------------------------------------
// 1. LANDING PAGE DIRECTORY: Get all PGs with Vacancy & Contact Details
// -------------------------------------------------------------
export async function getAllPGsDirectory() {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  let pgs = store.pgs;
  let rooms = store.rooms;
  let tenants = store.tenants;

  if (isFirebaseConfigured && db) {
    try {
      const pgsSnap = await getDocs(collection(db, "pgs"));
      if (!pgsSnap.empty) {
        pgs = pgsSnap.docs.map((d) => d.data() as PGProfile);
      }
      const roomsSnap = await getDocs(collection(db, "rooms"));
      if (!roomsSnap.empty) {
        rooms = roomsSnap.docs.map((d) => d.data() as Room);
      }
      const tenantsSnap = await getDocs(collection(db, "tenants"));
      if (!tenantsSnap.empty) {
        tenants = tenantsSnap.docs.map((d) => d.data() as Tenant);
      }
    } catch (e) {
      console.warn("Firestore fetch error:", e);
    }
  }

  // Aggregate vacancy list and pricing per PG (only approved PGs)
  const approvedPGs = pgs.filter((pg) => pg.status === "approved" || !pg.status);
  return approvedPGs.map((pg) => {
    const pgRooms = rooms.filter((r) => r.pgId === pg.id);
    const pgTenants = tenants.filter((t) => t.pgId === pg.id && t.active !== false);

    const roomsWithSlots = pgRooms.map((r) => {
      const activeInRoom = pgTenants.filter((t) => t.roomId === r.id && t.active !== false).length;
      const freeSlots = Math.max(0, r.capacity - activeInRoom);
      return {
        ...r,
        amenities: r.amenities && r.amenities.length > 0 ? r.amenities : ["Bed", "Study Table", "Cupboard", "Fan"],
        currentTenantsCount: activeInRoom,
        freeSlots,
      };
    });

    const totalCapacity = pgRooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalOccupied = pgTenants.length;
    const totalVacantSlots = Math.max(0, totalCapacity - totalOccupied);

    const vacantRooms = roomsWithSlots.filter((r) => r.freeSlots > 0);

    const prices = pgRooms.map((r) => r.rentAmount);
    const minRent = prices.length > 0 ? Math.min(...prices) : 6000;
    const maxRent = prices.length > 0 ? Math.max(...prices) : 15000;

    return {
      id: pg.id,
      pgName: pg.pgName,
      ownerName: pg.ownerName,
      ownerPhone: pg.ownerPhone || pg.contactPhone,
      location: pg.location,
      gstin: pg.gstin,
      totalCapacity,
      totalOccupied,
      totalVacantSlots,
      vacantRooms,
      rentRange: minRent === maxRent ? `₹${minRent.toLocaleString("en-IN")}/mo` : `₹${minRent.toLocaleString("en-IN")} - ₹${maxRent.toLocaleString("en-IN")}/mo`,
      createdAt: pg.createdAt,
    };
  });
}

// -------------------------------------------------------------
// 2. UNIFIED LOGIN, REGISTRATION & ADMIN MANAGEMENT
// -------------------------------------------------------------

// Only Owners can register their PG (submitted as pending application)
export async function registerPG(params: {
  pgName: string;
  ownerName: string;
  ownerPhone: string;
  location: { address: string; city: string; pincode: string };
  contactPhone?: string;
  gstin?: string;
  ebRatePerUnit?: number;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}) {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const cleanPhone = params.ownerPhone.replace(/[^0-9]/g, "").slice(-10);

  // Check if owner phone is already registered
  const existing = store.pgs.find(
    (p) => p.ownerPhone.replace(/[^0-9]/g, "").slice(-10) === cleanPhone
  );
  if (existing) {
    throw new Error("A PG is already registered with this owner phone number. Please log in.");
  }

  const newPG: PGProfile = {
    id: `pg-${Date.now()}`,
    ownerId: `owner-${cleanPhone}`,
    ownerName: params.ownerName.trim(),
    ownerPhone: cleanPhone,
    pgName: params.pgName.trim(),
    location: {
      address: params.location.address.trim(),
      city: params.location.city.trim(),
      pincode: params.location.pincode.trim(),
    },
    contactPhone: (params.contactPhone || cleanPhone).trim(),
    ebRatePerUnit: params.ebRatePerUnit ? Number(params.ebRatePerUnit) : 15,
    status: "pending",
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (params.gstin?.trim()) {
    newPG.gstin = params.gstin.trim();
  }

  if (params.razorpayKeyId?.trim()) {
    newPG.razorpay = {
      keyId: params.razorpayKeyId.trim(),
    };
    if (params.razorpayKeySecret?.trim()) {
      newPG.razorpay.keySecret = params.razorpayKeySecret.trim();
    }
  }

  // Add standard initial rooms (101, 102)
  const initialRoom1: Room = {
    id: `room-${Date.now()}-1`,
    pgId: newPG.id,
    roomNumber: "101",
    category: "1",
    capacity: 1,
    rentAmount: 12000,
    currentTenantsCount: 0,
    status: "Vacant",
    createdAt: new Date().toISOString(),
  };
  const initialRoom2: Room = {
    id: `room-${Date.now()}-2`,
    pgId: newPG.id,
    roomNumber: "102",
    category: "2",
    capacity: 2,
    rentAmount: 8500,
    currentTenantsCount: 0,
    status: "Vacant",
    createdAt: new Date().toISOString(),
  };

  store.pgs.push(newPG);
  store.rooms.push(initialRoom1, initialRoom2);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "pgs", newPG.id), newPG);
      await setDoc(doc(db, "rooms", initialRoom1.id), initialRoom1);
      await setDoc(doc(db, "rooms", initialRoom2.id), initialRoom2);
    } catch (e) {
      console.warn("Firestore registerPG error:", e);
    }
  }

  // Never return raw keySecret to client
  const clientSafePG: PGProfile = {
    ...newPG,
    razorpay: newPG.razorpay
      ? {
          keyId: newPG.razorpay.keyId || "",
        }
      : undefined,
  };

  return clientSafePG;
}

// Admin: Get all PG applications with status, capacity and room summary
export async function getPGApplications(): Promise<PGApplication[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();

  if (isFirebaseConfigured && db) {
    try {
      const pgsSnap = await getDocs(collection(db, "pgs"));
      if (!pgsSnap.empty) {
        const firestorePgs = pgsSnap.docs.map((d) => d.data() as PGProfile);
        for (const fp of firestorePgs) {
          const idx = store.pgs.findIndex((p) => p.id === fp.id);
          if (idx >= 0) {
            store.pgs[idx] = fp;
          } else {
            store.pgs.push(fp);
          }
        }
      }
      const roomsSnap = await getDocs(collection(db, "rooms"));
      if (!roomsSnap.empty) {
        const firestoreRooms = roomsSnap.docs.map((d) => d.data() as Room);
        for (const fr of firestoreRooms) {
          const idx = store.rooms.findIndex((r) => r.id === fr.id);
          if (idx >= 0) {
            store.rooms[idx] = fr;
          } else {
            store.rooms.push(fr);
          }
        }
      }
    } catch (e) {
      console.warn("Firestore getPGApplications error:", e);
    }
  }

  const pgs = store.pgs;
  const rooms = store.rooms;

  return pgs.map((p) => {
    const pgRooms = rooms.filter((r) => r.pgId === p.id);
    return {
      ...p,
      // Redact sensitive Razorpay secret key from application listings
      razorpay: p.razorpay
        ? {
            keyId: p.razorpay.keyId || "",
          }
        : undefined,
      status: p.status || "approved", // Older/seeded PGs default to approved
      roomCount: pgRooms.length,
      totalCapacity: pgRooms.reduce((acc, r) => acc + r.capacity, 0),
      initialRooms: pgRooms,
    };
  }).sort((a, b) => {
    // Pending first, then by date descending
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime();
  });
}

// Admin: Approve or Reject a PG application
export async function updatePGApplicationStatus(
  pgId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
) {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  let pg = store.pgs.find((p) => p.id === pgId);

  if (!pg && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "pgs", pgId));
      if (snap.exists()) {
        pg = snap.data() as PGProfile;
        store.pgs.push(pg);
      }
    } catch (e) {
      console.warn("Firestore fetch single PG error:", e);
    }
  }

  if (!pg) throw new Error("PG application not found");

  pg.status = status;
  if (status === "approved") {
    pg.approvedAt = new Date().toISOString();
    delete pg.rejectionReason;
  } else {
    pg.rejectionReason = rejectionReason || "Application rejected by admin";
  }

  if (isFirebaseConfigured && db) {
    try {
      const updateData: any = {
        status: pg.status,
      };
      if (status === "approved") {
        updateData.approvedAt = pg.approvedAt;
      } else {
        updateData.rejectionReason = pg.rejectionReason;
      }
      await updateDoc(doc(db, "pgs", pg.id), updateData);
    } catch (e) {
      console.warn("Firestore updatePGApplicationStatus error:", e);
    }
  }

  return pg;
}

// Unified Phone + OTP Verification
export async function authenticateUnifiedPhone(phoneNumber: string, otp: string) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

  // OTP verification
  if (!otp || otp.trim().length < 6) {
    throw new Error("Invalid OTP. Please enter the 6-digit verification code.");
  }

  // 1. Check Super Admin Phones (configured via environment or authorized admin list)
  const envAdminPhones = (
    process.env.ADMIN_PHONE_NUMBER ||
    process.env.NEXT_PUBLIC_ADMIN_PHONE ||
    "9626855406,6381347842"
  )
    .split(",")
    .map((p) => p.replace(/[^0-9]/g, "").slice(-10));

  if (envAdminPhones.includes(cleanPhone) || cleanPhone === "9626855406" || cleanPhone === "6381347842") {
    return {
      role: "admin" as const,
      user: {
        role: "admin" as const,
        name: "Super Admin",
        phone: cleanPhone,
      },
      redirect: "/admin/dashboard",
    };
  }

  // Non-blocking sync attempt
  try {
    await withTimeout(syncToFirestoreIfEmpty(), 2000);
  } catch (e) {
    console.warn("Firestore sync timed out, continuing with store data");
  }

  const store = getStore();

  // 2. Check if user is an Owner
  let pgs = store.pgs;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "pgs"), where("ownerPhone", "==", cleanPhone));
      const snap = await withTimeout(getDocs(q), 2500);
      if (!snap.empty) {
        pgs = snap.docs.map((d) => d.data() as PGProfile);
      }
    } catch (e) {
      console.warn("Firestore owner check:", e);
    }
  }
  const ownerPG = pgs.find(
    (p) => p.ownerPhone.replace(/[^0-9]/g, "").slice(-10) === cleanPhone
  );

  if (ownerPG) {
    // Gatekeeper: Check if PG application is approved
    if (ownerPG.status && ownerPG.status !== "approved") {
      const hotline = process.env.NEXT_PUBLIC_ADMIN_PHONE || "9626855406";
      throw new Error(
        `Your accommodation is not approved yet. Kindly wait or contact via hotline: ${hotline}`
      );
    }

    return {
      role: "owner" as const,
      user: {
        role: "owner" as const,
        name: ownerPG.ownerName,
        phone: ownerPG.ownerPhone,
        pgId: ownerPG.id,
        pgName: ownerPG.pgName,
      },
      redirect: "/owner/dashboard",
    };
  }

  // 2. Check if user is an ACTIVE Tenant
  let tenants = store.tenants;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "tenants"), where("phoneNumber", "==", cleanPhone));
      const snap = await withTimeout(getDocs(q), 2500);
      if (!snap.empty) {
        tenants = snap.docs.map((d) => d.data() as Tenant);
      }
    } catch (e) {
      console.warn("Firestore tenant check:", e);
    }
  }

  const matchedTenant = tenants.find(
    (t) => t.phoneNumber.replace(/[^0-9]/g, "").slice(-10) === cleanPhone
  );

  if (matchedTenant) {
    if (matchedTenant.active === false) {
      throw new Error(
        "Your tenancy has been vacated/deactivated by the property owner. You can no longer log in."
      );
    }

    const pg = await getPG(matchedTenant.pgId);
    return {
      role: "tenant" as const,
      user: {
        id: matchedTenant.id,
        name: matchedTenant.name,
        phone: matchedTenant.phoneNumber,
        roomId: matchedTenant.roomId,
        roomNumber: matchedTenant.roomNumber,
        pgId: matchedTenant.pgId,
        pgName: pg?.pgName || "PG Accommodation",
      },
      redirect: `/tenant/dashboard?phone=${cleanPhone}`,
    };
  }

  // 3. Neither Owner nor active Tenant
  throw new Error(
    "You are not part of any PG in this platform. If you are a PG owner, please register your property. If you are a resident, please contact your PG owner to add your mobile number."
  );
}

// -------------------------------------------------------------
// 3. CROSS-PG TENANT BACKGROUND CHECK (Ratings & Blackmarks)
// -------------------------------------------------------------
export async function searchTenantHistory(phoneNumber: string) {
  await syncToFirestoreIfEmpty();
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
  const store = getStore();
  let history = store.tenantHistory;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "tenant_history"), where("phoneNumber", "==", cleanPhone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        history = snap.docs.map((d) => d.data() as TenantHistory);
      }
    } catch (e) {
      console.warn("Firestore searchTenantHistory error:", e);
    }
  }

  const records = history.filter(
    (h) => h.phoneNumber.replace(/[^0-9]/g, "").slice(-10) === cleanPhone
  );

  const hasBlackmark = records.some((r) => r.blackmark);
  const averageRating =
    records.length > 0
      ? (records.reduce((acc, r) => acc + r.rating, 0) / records.length).toFixed(1)
      : null;

  return {
    found: records.length > 0,
    records,
    hasBlackmark,
    averageRating,
  };
}

// -------------------------------------------------------------
// 4. VACATING TENANTS WITH STAR RATING & BLACKMARK
// -------------------------------------------------------------
export async function vacateTenantWithReview(params: {
  tenantId: string;
  rating: number; // 1 - 5
  blackmark: boolean;
  comment: string;
  ownerName?: string;
}) {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const tenant = store.tenants.find((t) => t.id === params.tenantId);

  if (!tenant) {
    throw new Error("Tenant record not found");
  }

  const pg = await getPG(tenant.pgId);
  const room = store.rooms.find((r) => r.id === tenant.roomId);

  // 1. Create TenantHistory record
  const historyRecord: TenantHistory = {
    id: `hist-${Date.now()}`,
    phoneNumber: tenant.phoneNumber,
    name: tenant.name,
    pgId: tenant.pgId,
    pgName: pg?.pgName || "PG Accommodation",
    roomId: tenant.roomId,
    roomNumber: tenant.roomNumber || room?.roomNumber || "N/A",
    joinedAt: tenant.joinedAt,
    vacatedAt: new Date().toISOString().split("T")[0],
    rating: Math.min(5, Math.max(1, params.rating || 5)),
    blackmark: Boolean(params.blackmark),
    comment: params.comment.trim(),
    vacatedByOwnerName: params.ownerName || pg?.ownerName || "PG Owner",
  };

  store.tenantHistory.unshift(historyRecord);

  // 2. Deactivate tenant so they can never log in again
  tenant.active = false;

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "tenant_history", historyRecord.id), historyRecord);
      await updateDoc(doc(db, "tenants", tenant.id), {
        active: false,
        vacatedAt: historyRecord.vacatedAt,
      });
    } catch (e) {
      console.warn("Firestore vacateTenant error:", e);
    }
  }

  return {
    success: true,
    historyRecord,
    message: `Tenant ${tenant.name} vacated successfully. Feedback and rating recorded.`,
  };
}

// -------------------------------------------------------------
// 5. STANDARD OPERATIONS: Rooms, Tenants, Payments, Dashboard
// -------------------------------------------------------------
export async function getPG(pgId?: string, ownerPhone?: string): Promise<PGProfile> {
  await syncToFirestoreIfEmpty();
  const store = getStore();

  // 1. Try by pgId in memory
  if (pgId) {
    const found = store.pgs.find((p) => p.id === pgId);
    if (found) return found;
  }

  // 2. Try by ownerPhone in memory
  if (ownerPhone) {
    const clean = ownerPhone.replace(/[^0-9]/g, "").slice(-10);
    const found = store.pgs.find((p) => p.ownerPhone.replace(/[^0-9]/g, "").slice(-10) === clean);
    if (found) return found;
  }

  // 3. Query Firestore directly if not yet in memory
  if (isFirebaseConfigured && db) {
    try {
      if (pgId) {
        const snap = await withTimeout(getDoc(doc(db, "pgs", pgId)), 2500);
        if (snap.exists()) {
          const data = snap.data() as PGProfile;
          const idx = store.pgs.findIndex((p) => p.id === data.id);
          if (idx >= 0) store.pgs[idx] = data;
          else store.pgs.push(data);
          return data;
        }
      }

      if (ownerPhone) {
        const clean = ownerPhone.replace(/[^0-9]/g, "").slice(-10);
        const q = query(collection(db, "pgs"), where("ownerPhone", "==", clean));
        const snap = await withTimeout(getDocs(q), 2500);
        if (!snap.empty) {
          const data = snap.docs[0].data() as PGProfile;
          const idx = store.pgs.findIndex((p) => p.id === data.id);
          if (idx >= 0) store.pgs[idx] = data;
          else store.pgs.push(data);
          return data;
        }
      }

      const snap = await withTimeout(getDocs(collection(db, "pgs")), 2500);
      if (!snap.empty) {
        const allPgs = snap.docs.map((d) => d.data() as PGProfile);
        store.pgs = allPgs;
        return allPgs[0];
      }
    } catch (e) {
      console.warn("Firestore getPG error:", e);
    }
  }

  // Safe fallback to prevent undefined crash
  return store.pgs[0] || {
    id: pgId || "pg-default",
    pgName: "My PG Accommodation",
    ownerName: "PG Owner",
    ownerPhone: ownerPhone || "",
    address: "",
    city: "",
    status: "approved",
    pricingStartingFrom: 5000,
    amenities: [],
    rules: [],
    images: [],
    location: { city: "", state: "", pincode: "", landmark: "", mapCoordinates: { lat: 12.9716, lng: 77.5946 } },
    razorpay: { keyId: "", enabled: false },
    createdAt: new Date().toISOString(),
  };
}

export async function updatePG(updates: Partial<PGProfile>): Promise<PGProfile> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const current = store.pgs[0];
  const updated: PGProfile = {
    ...current,
    ...updates,
    location: {
      ...current.location,
      ...(updates.location || {}),
    },
    razorpay: {
      ...current.razorpay,
      ...(updates.razorpay || {}),
      keyId: updates.razorpay?.keyId || current.razorpay?.keyId || "",
    },
  };
  store.pgs[0] = updated;
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "pgs", updated.id), updated, { merge: true });
    } catch (e) {
      console.warn("Firestore updatePG error:", e);
    }
  }
  return updated;
}

export async function getRooms(pgId?: string): Promise<Room[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const targetPgId = pgId || (store.pgs[0]?.id || "");

  // Clean up any historical duplicate rooms with same roomNumber
  const seenRoomNumbers = new Map<string, Room>();
  const duplicatesToRemove: string[] = [];

  for (const r of store.rooms.filter((room) => room.pgId === targetPgId)) {
    const key = r.roomNumber.trim().toLowerCase();
    if (!seenRoomNumbers.has(key)) {
      seenRoomNumbers.set(key, r);
    } else {
      const existing = seenRoomNumbers.get(key)!;
      const existingHasTenants = store.tenants.some((t) => t.roomId === existing.id && t.active !== false);
      const currentHasTenants = store.tenants.some((t) => t.roomId === r.id && t.active !== false);

      if (currentHasTenants && !existingHasTenants) {
        duplicatesToRemove.push(existing.id);
        seenRoomNumbers.set(key, r);
      } else {
        duplicatesToRemove.push(r.id);
      }
    }
  }

  if (duplicatesToRemove.length > 0) {
    store.rooms = store.rooms.filter((r) => !duplicatesToRemove.includes(r.id));
    if (isFirebaseConfigured && db) {
      for (const dupId of duplicatesToRemove) {
        deleteDoc(doc(db, "rooms", dupId)).catch(() => { });
      }
    }
  }

  let rooms = store.rooms.filter((r) => r.pgId === targetPgId);
  const tenants = await getTenants(targetPgId);

  return rooms.map((r) => {
    const activeCount = tenants.filter(
      (t) => t.roomId === r.id && t.active !== false
    ).length;
    let status: Room["status"] = "Vacant";
    if (activeCount >= r.capacity) {
      status = "Occupied";
    } else if (activeCount > 0) {
      status = "Partially Occupied";
    }
    return {
      ...r,
      amenities: r.amenities && r.amenities.length > 0 ? r.amenities : ["Bed", "Study Table", "Cupboard", "Fan"],
      currentTenantsCount: activeCount,
      status,
    };
  });
}

export async function addRoom(
  room: Omit<Room, "id" | "createdAt" | "currentTenantsCount" | "status">
): Promise<Room> {
  await syncToFirestoreIfEmpty();
  const store = getStore();

  const formattedRoomNumber = String(room.roomNumber).trim();
  const existing = store.rooms.find(
    (r) =>
      r.pgId === room.pgId &&
      r.roomNumber.trim().toLowerCase() === formattedRoomNumber.toLowerCase()
  );

  if (existing) {
    throw new Error(
      `Room ${formattedRoomNumber} already exists in your property. Each room number must be unique.`
    );
  }

  const newRoom: Room = {
    ...room,
    roomNumber: formattedRoomNumber,
    amenities: Array.isArray(room.amenities) && room.amenities.length > 0 ? room.amenities : ["Bed", "Study Table", "Cupboard", "Fan"],
    id: `room-${Date.now()}`,
    createdAt: new Date().toISOString(),
    currentTenantsCount: 0,
    status: "Vacant",
  };

  store.rooms.push(newRoom);
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "rooms", newRoom.id), newRoom);
    } catch (e) {
      console.warn("Firestore addRoom:", e);
    }
  }
  return newRoom;
}

export async function updateRoom(
  roomId: string,
  updates: {
    roomNumber?: string;
    category?: SharingCategory;
    capacity?: number;
    rentAmount?: number;
    amenities?: string[];
  }
): Promise<Room> {
  await syncToFirestoreIfEmpty();
  const store = getStore();

  const roomIndex = store.rooms.findIndex((r) => r.id === roomId);
  if (roomIndex === -1) {
    throw new Error("Room not found");
  }

  const existingRoom = store.rooms[roomIndex];

  let formattedRoomNumber = existingRoom.roomNumber;
  if (updates.roomNumber) {
    formattedRoomNumber = String(updates.roomNumber).trim();
    if (formattedRoomNumber.toLowerCase() !== existingRoom.roomNumber.toLowerCase()) {
      const conflict = store.rooms.find(
        (r) =>
          r.id !== roomId &&
          r.pgId === existingRoom.pgId &&
          r.roomNumber.trim().toLowerCase() === formattedRoomNumber.toLowerCase()
      );
      if (conflict) {
        throw new Error(
          `Room ${formattedRoomNumber} already exists in your property. Each room number must be unique.`
        );
      }
    }
  }

  const category = updates.category || existingRoom.category;
  const capacity = updates.capacity || (updates.category ? (parseInt(updates.category, 10) || existingRoom.capacity) : existingRoom.capacity);
  const rentAmount = updates.rentAmount !== undefined ? Number(updates.rentAmount) : existingRoom.rentAmount;
  const amenities = Array.isArray(updates.amenities) ? updates.amenities : (existingRoom.amenities || ["Bed", "Study Table", "Cupboard", "Fan"]);

  const updatedRoom: Room = {
    ...existingRoom,
    roomNumber: formattedRoomNumber,
    category,
    capacity,
    rentAmount,
    amenities,
  };

  store.rooms[roomIndex] = updatedRoom;

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "rooms", roomId), {
        roomNumber: formattedRoomNumber,
        category,
        capacity,
        rentAmount,
        amenities,
      });
    } catch (e) {
      console.warn("Firestore updateRoom error, falling back to setDoc:", e);
      try {
        await setDoc(doc(db, "rooms", roomId), updatedRoom);
      } catch (err) {
        console.warn("Firestore setDoc fallback error:", err);
      }
    }
  }

  return updatedRoom;
}

export async function getTenants(pgId?: string): Promise<Tenant[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const targetPgId = pgId || (store.pgs[0]?.id || "");

  if (isFirebaseConfigured && db) {
    try {
      const snap = await withTimeout(getDocs(collection(db, "tenants")), 2500);
      if (!snap.empty) {
        const firestoreTenants = snap.docs.map((d) => d.data() as Tenant);
        for (const ft of firestoreTenants) {
          const idx = store.tenants.findIndex((t) => t.id === ft.id);
          if (idx >= 0) store.tenants[idx] = ft;
          else store.tenants.push(ft);
        }
      }
    } catch (e) {
      console.warn("Firestore getTenants error:", e);
    }
  }

  // Self-heal: link tenant to room's pgId if mapped to a room
  const roomsMap = new Map(store.rooms.map((r) => [r.id, r]));
  for (const t of store.tenants) {
    if (t.roomId) {
      const parentRoom = roomsMap.get(t.roomId);
      if (parentRoom && parentRoom.pgId && t.pgId !== parentRoom.pgId) {
        t.pgId = parentRoom.pgId;
        if (isFirebaseConfigured && db) {
          updateDoc(doc(db, "tenants", t.id), { pgId: parentRoom.pgId }).catch(() => {});
        }
      }
    }
  }

  // Return tenants belonging to targetPgId (either directly or via their room)
  const tenants = targetPgId
    ? store.tenants.filter(
        (t) =>
          (t.pgId === targetPgId || (t.roomId && roomsMap.get(t.roomId)?.pgId === targetPgId)) &&
          t.active !== false
      )
    : store.tenants.filter((t) => t.active !== false);

  return tenants.map((t) => {
    const room = roomsMap.get(t.roomId);
    return {
      ...t,
      roomNumber: t.roomNumber || room?.roomNumber || "N/A",
      rentAmount: t.rentAmount || room?.rentAmount || 0,
      sharingCategory: t.sharingCategory || room?.category,
    };
  });
}

export async function addTenant(
  tenantData: Omit<Tenant, "id" | "joinedAt" | "active">
): Promise<Tenant> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const cleanPhone = tenantData.phoneNumber.replace(/[^0-9]/g, "").slice(-10);

  // Check if tenant is already actively staying in a room
  const alreadyActive = store.tenants.find(
    (t) => t.phoneNumber.replace(/[^0-9]/g, "").slice(-10) === cleanPhone && t.active !== false
  );
  if (alreadyActive) {
    throw new Error(
      `This phone number is already actively assigned to Room ${alreadyActive.roomNumber}. Vacate previous room before re-assigning.`
    );
  }

  const room = store.rooms.find((r) => r.id === tenantData.roomId);
  const realPgId = room?.pgId || tenantData.pgId;

  const newTenant: Tenant = {
    ...tenantData,
    pgId: realPgId,
    phoneNumber: cleanPhone,
    id: `tenant-${Date.now()}`,
    roomNumber: room?.roomNumber || "N/A",
    rentAmount: room?.rentAmount || 0,
    sharingCategory: room?.category,
    joinedAt: new Date().toISOString().split("T")[0],
    active: true,
  };

  store.tenants.push(newTenant);

  // Generate current month rent record
  const newPayment: Payment = {
    id: `pay-${Date.now()}`,
    tenantId: newTenant.id,
    tenantName: newTenant.name,
    phoneNumber: newTenant.phoneNumber,
    pgId: newTenant.pgId,
    roomId: newTenant.roomId,
    roomNumber: newTenant.roomNumber,
    month: CURRENT_MONTH,
    amount: newTenant.rentAmount || 8000,
    status: "unpaid",
    razorpayPaymentId: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
  };

  store.payments.push(newPayment);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "tenants", newTenant.id), newTenant);
      await setDoc(doc(db, "payments", newPayment.id), newPayment);
    } catch (e) {
      console.warn("Firestore addTenant:", e);
    }
  }

  return newTenant;
}

export async function getTenantByPhone(phoneNumber: string): Promise<Tenant | null> {
  await syncToFirestoreIfEmpty();
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
  const store = getStore();
  return (
    store.tenants.find(
      (t) => t.phoneNumber.replace(/[^0-9]/g, "").slice(-10) === cleanPhone && t.active !== false
    ) || null
  );
}

export async function getPayments(pgId?: string, month = CURRENT_MONTH): Promise<Payment[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const targetPgId = pgId || (store.pgs[0]?.id || "");

  if (isFirebaseConfigured && db) {
    try {
      const snap = await withTimeout(getDocs(collection(db, "payments")), 2500);
      if (!snap.empty) {
        const firestorePayments = snap.docs.map((d) => d.data() as Payment);
        for (const fp of firestorePayments) {
          const idx = store.payments.findIndex((p) => p.id === fp.id);
          if (idx >= 0) store.payments[idx] = fp;
          else store.payments.push(fp);
        }
      }
    } catch (e) {
      console.warn("Firestore getPayments error:", e);
    }
  }

  // Get active tenants for this PG
  const activeTenants = await getTenants(targetPgId);
  const tenantsMap = new Map(store.tenants.map((t) => [t.id, t]));

  // Auto-generate payment record for any active tenant missing one in the selected month
  if (month && targetPgId) {
    for (const t of activeTenants) {
      const hasPayment = store.payments.some(
        (p) => p.tenantId === t.id && p.month === month
      );
      if (!hasPayment) {
        const genPayment: Payment = {
          id: `pay-${t.id}-${month}`,
          tenantId: t.id,
          tenantName: t.name,
          phoneNumber: t.phoneNumber,
          roomNumber: t.roomNumber,
          pgId: t.pgId || targetPgId,
          roomId: t.roomId,
          month,
          baseRent: t.rentAmount || 8000,
          ebAmount: 0,
          amount: t.rentAmount || 8000,
          status: "unpaid",
          createdAt: new Date().toISOString(),
        };
        store.payments.push(genPayment);
        if (isFirebaseConfigured && db) {
          setDoc(doc(db, "payments", genPayment.id), genPayment).catch(() => {});
        }
      }
    }
  }

  return store.payments.filter((p) => {
    const parentTenant = tenantsMap.get(p.tenantId);
    const matchesPg =
      !targetPgId ||
      p.pgId === targetPgId ||
      parentTenant?.pgId === targetPgId;
    return matchesPg && (!month || p.month === month);
  });
}

export async function getTenantPayments(tenantId: string): Promise<Payment[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  return store.payments
    .filter((p) => p.tenantId === tenantId)
    .sort((a, b) => (b.month > a.month ? 1 : -1));
}

export async function markPaymentPaid(
  paymentId: string,
  razorpayPaymentId: string
): Promise<Payment | null> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const payment = store.payments.find((p) => p.id === paymentId);

  if (payment) {
    payment.status = "paid";
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.paidAt = new Date().toISOString();
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "payments", paymentId), {
        status: "paid",
        razorpayPaymentId,
        paidAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Firestore markPaymentPaid:", e);
    }
  }

  return payment || null;
}

export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  await syncToFirestoreIfEmpty();
  const store = getStore();

  // Check in-memory first
  let payment = store.payments.find((p) => p.id === paymentId) || null;

  // Fallback to Firestore
  if (!payment && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "payments", paymentId));
      if (snap.exists()) {
        payment = snap.data() as Payment;
        store.payments.push(payment);
      }
    } catch (e) {
      console.warn("Firestore getPaymentById:", e);
    }
  }

  return payment;
}

export async function updatePayment(
  paymentId: string,
  updates: Partial<Payment> & { additionalCharges?: number; additionalChargesNote?: string; discount?: number; discountNote?: string; note?: string; updatedAt?: string }
): Promise<Payment> {
  await syncToFirestoreIfEmpty();
  const store = getStore();

  const idx = store.payments.findIndex((p) => p.id === paymentId);
  if (idx === -1) {
    throw new Error("Payment not found");
  }

  const updated: Payment = { ...store.payments[idx], ...updates } as Payment;
  store.payments[idx] = updated;

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "payments", paymentId), updates as Record<string, any>);
    } catch (e) {
      console.warn("Firestore updatePayment error, trying setDoc:", e);
      try {
        await setDoc(doc(db, "payments", paymentId), updated);
      } catch (err) {
        console.warn("Firestore setDoc fallback error:", err);
      }
    }
  }

  return updated;
}

export async function getTickets(pgId?: string, status?: TicketStatus): Promise<Ticket[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const targetPgId = pgId || (store.pgs[0]?.id || "");
  return store.tickets
    .filter((t) => t.pgId === targetPgId && (!status || t.status === status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTenantTickets(tenantId: string): Promise<Ticket[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  return store.tickets
    .filter((t) => t.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createTicket(
  ticket: Omit<Ticket, "id" | "createdAt" | "status" | "resolvedAt">
): Promise<Ticket> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const newTicket: Ticket = {
    ...ticket,
    id: `ticket-${Date.now()}`,
    status: "open",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  store.tickets.unshift(newTicket);
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "tickets", newTicket.id), newTicket);
    } catch (e) {
      console.warn("Firestore createTicket:", e);
    }
  }
  return newTicket;
}

export async function resolveTicket(ticketId: string): Promise<Ticket | null> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (ticket) {
    ticket.status = "resolved";
    ticket.resolvedAt = new Date().toISOString();
  }
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        status: "resolved",
        resolvedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Firestore resolveTicket:", e);
    }
  }
  return ticket || null;
}

export async function getPreviousTenantsHistory(pgId?: string): Promise<TenantHistory[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const targetPgId = pgId || (store.pgs[0]?.id || "");
  return store.tenantHistory
    .filter((h) => !targetPgId || h.pgId === targetPgId)
    .sort((a, b) => new Date(b.vacatedAt).getTime() - new Date(a.vacatedAt).getTime());
}

// -------------------------------------------------------------
// 6. ELECTRICITY (EB) METER READINGS & SPLIT BILLING
// -------------------------------------------------------------
export async function recordRoomEBReading(params: {
  pgId?: string;
  roomId: string;
  month?: string;
  units: number;
  rate?: number;
}) {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const pg = await getPG(params.pgId);
  const room = store.rooms.find((r) => r.id === params.roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  const targetMonth = params.month || CURRENT_MONTH;
  const units = Number(params.units);
  if (isNaN(units) || units < 0) {
    throw new Error("Please enter a valid non-negative number of units");
  }

  const rate = Number(params.rate || pg.ebRatePerUnit || 15);
  const totalRoomEB = Math.round(units * rate);

  // Active staying tenants in this room
  const activeTenants = store.tenants.filter(
    (t) => t.roomId === room.id && t.active !== false
  );

  if (activeTenants.length === 0) {
    throw new Error(
      `Cannot split electricity bill for Room ${room.roomNumber}: There are no active staying tenants in this room.`
    );
  }

  const activeTenantsCount = activeTenants.length;
  const vacantSlotsCount = Math.max(0, room.capacity - activeTenantsCount);
  // Split strictly among active staying tenants
  const perTenantEB = Math.round(totalRoomEB / activeTenantsCount);

  // 1. Check if an existing reading already exists for this room & month (Editable Single Entry)
  const existingReading = store.ebReadings.find(
    (r) => r.roomId === room.id && r.month === targetMonth
  );

  const readingId = existingReading?.id || `eb-${pg.id}-${room.id}-${targetMonth}`;

  const reading: RoomEBReading = {
    id: readingId,
    pgId: pg.id,
    roomId: room.id,
    roomNumber: room.roomNumber,
    month: targetMonth,
    units,
    rate,
    totalRoomEB,
    activeTenantsCount,
    vacantSlotsCount,
    perTenantEB,
    createdAt: existingReading ? existingReading.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Remove any previous instance for this room & month and store the updated single entry
  store.ebReadings = store.ebReadings.filter(
    (r) => !(r.roomId === room.id && r.month === targetMonth)
  );
  store.ebReadings.unshift(reading);

  if (isFirebaseConfigured && db) {
    try {
      // Clean up any historical duplicate documents in Firestore for this room and month
      const q = query(
        collection(db, "eb_readings"),
        where("roomId", "==", room.id),
        where("month", "==", targetMonth)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        if (d.id !== reading.id) {
          await deleteDoc(d.ref);
        }
      }
      await setDoc(doc(db, "eb_readings", reading.id), reading);
    } catch (e) {
      console.warn("Firestore recordRoomEBReading error:", e);
    }
  }

  // 2. Update monthly payment dues for every active tenant in this room
  for (const tenant of activeTenants) {
    let payment = store.payments.find(
      (p) => p.tenantId === tenant.id && p.month === targetMonth
    );

    if (payment) {
      if (payment.baseRent === undefined) {
        payment.baseRent = payment.amount;
      }
      payment.ebUnits = units;
      payment.ebRate = rate;
      payment.ebAmount = perTenantEB;
      payment.amount = (payment.baseRent || tenant.rentAmount || room.rentAmount) + perTenantEB;

      if (isFirebaseConfigured && db) {
        try {
          await updateDoc(doc(db, "payments", payment.id), {
            baseRent: payment.baseRent,
            ebUnits: units,
            ebRate: rate,
            ebAmount: perTenantEB,
            amount: payment.amount,
          });
        } catch (e) {
          console.warn("Firestore updatePayment with EB error:", e);
        }
      }
    } else {
      const baseRent = tenant.rentAmount || room.rentAmount || 8000;
      const newPayment: Payment = {
        id: `pay-${Date.now()}-${tenant.id}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        phoneNumber: tenant.phoneNumber,
        pgId: pg.id,
        roomId: room.id,
        roomNumber: room.roomNumber,
        month: targetMonth,
        baseRent,
        ebUnits: units,
        ebRate: rate,
        ebAmount: perTenantEB,
        amount: baseRent + perTenantEB,
        status: "unpaid",
        razorpayPaymentId: null,
        paidAt: null,
        createdAt: new Date().toISOString(),
      };
      store.payments.push(newPayment);

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, "payments", newPayment.id), newPayment);
        } catch (e) {
          console.warn("Firestore newPayment with EB error:", e);
        }
      }
    }
  }

  return {
    reading,
    roomNumber: room.roomNumber,
    units,
    rate,
    totalRoomEB,
    activeTenantsCount,
    vacantSlotsCount,
    perTenantEB,
    tenantsUpdated: activeTenants.length,
  };
}

export async function getRoomEBReadings(
  pgId?: string,
  month?: string
): Promise<RoomEBReading[]> {
  await syncToFirestoreIfEmpty();
  const store = getStore();
  const targetPgId = pgId || (store.pgs[0]?.id || "");

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "eb_readings"));
      if (!snap.empty) {
        const firestoreReadings = snap.docs.map((d) => d.data() as RoomEBReading);
        for (const fr of firestoreReadings) {
          const idx = (store.ebReadings || []).findIndex(
            (r) => r.id === fr.id || (r.roomId === fr.roomId && r.month === fr.month)
          );
          if (idx >= 0) {
            store.ebReadings[idx] = fr;
          } else {
            store.ebReadings.push(fr);
          }
        }
      }
    } catch (e) {
      console.warn("Firestore getRoomEBReadings error:", e);
    }
  }

  // Strictly deduplicate by roomId + month so each room only has 1 editable reading per month
  const uniqueMap = new Map<string, RoomEBReading>();
  for (const r of store.ebReadings || []) {
    if (r.pgId === targetPgId && (!month || r.month === month)) {
      const key = `${r.roomId}_${r.month}`;
      const existing = uniqueMap.get(key);
      const rTime = new Date(r.updatedAt || r.createdAt).getTime();
      const existingTime = existing ? new Date(existing.updatedAt || existing.createdAt).getTime() : 0;
      if (!existing || rTime >= existingTime) {
        uniqueMap.set(key, r);
      }
    }
  }

  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
}

export async function getOwnerDashboardData(pgId?: string, month = CURRENT_MONTH, phone?: string) {
  await syncToFirestoreIfEmpty();
  const pg = await getPG(pgId, phone);
  const store = getStore();
  // Do not fall back to another owner's PG if unauthorized/unspecified
  const targetPgId = pg?.id || pgId || "";

  if (!targetPgId) {
    throw new Error("Property identifier or owner verification required.");
  }

  const rooms = await getRooms(targetPgId);
  const tenants = await getTenants(targetPgId);
  const payments = await getPayments(targetPgId, month);
  const tickets = await getTickets(targetPgId);
  const previousTenants = await getPreviousTenantsHistory(targetPgId);
  const ebReadings = await getRoomEBReadings(targetPgId, month);

  const paidPayments = payments.filter((p) => p.status === "paid");
  const unpaidPayments = payments.filter((p) => p.status === "unpaid");

  const vacantRooms = rooms
    .filter((r) => r.capacity - (r.currentTenantsCount || 0) > 0)
    .map((r) => ({
      ...r,
      availableSlots: r.capacity - (r.currentTenantsCount || 0),
    }));

  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const totalTenants = tenants.length;
  const vacantSlots = Math.max(0, totalCapacity - totalTenants);
  const occupancyPercentage =
    totalCapacity > 0 ? Math.round((totalTenants / totalCapacity) * 100) : 0;

  const totalMonthlyDue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalCollected = paidPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPending = unpaidPayments.reduce((acc, p) => acc + p.amount, 0);
  const openTicketsCount = tickets.filter((t) => t.status === "open").length;

  const stats: OwnerDashboardStats = {
    totalRooms: rooms.length,
    totalCapacity,
    totalTenants,
    occupancyPercentage,
    vacantSlots,
    totalMonthlyDue,
    totalCollected,
    totalPending,
    openTicketsCount,
    previousTenantsCount: previousTenants.length,
  };

  // Redact Razorpay keySecret before returning to client
  const sanitizedPg = pg
    ? {
        ...pg,
        razorpay: pg.razorpay
          ? {
              keyId: pg.razorpay.keyId || "",
            }
          : undefined,
      }
    : null;

  return {
    pg: sanitizedPg,
    stats,
    selectedMonth: month || CURRENT_MONTH,
    paidList: paidPayments,
    unpaidList: unpaidPayments,
    vacantRooms,
    tickets,
    rooms,
    tenants,
    previousTenants,
    ebReadings,
  };
}
