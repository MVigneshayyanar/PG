export type SharingCategory =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | string;

export interface PGLocation {
  address: string;
  city: string;
  pincode: string;
}

export interface PGRazorpayConfig {
  keyId: string;
  keySecret?: string;
}

export type PGStatus = "pending" | "approved" | "rejected";

export interface PGProfile {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  pgName: string;
  location: PGLocation;
  contactPhone: string;
  gstin?: string;
  ebRatePerUnit?: number; // Default per unit cost like 13, 14, 15
  razorpay?: PGRazorpayConfig;
  status?: PGStatus;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface PGApplication extends PGProfile {
  roomCount?: number;
  totalCapacity?: number;
  initialRooms?: Room[];
}

export interface SessionUser {
  role: "owner" | "tenant" | "admin";
  name: string;
  phone: string;
  pgId?: string;
  pgName?: string;
  roomId?: string;
  roomNumber?: string;
}

export interface Room {
  id: string;
  pgId: string;
  roomNumber: string;
  category: SharingCategory;
  capacity: number;
  rentAmount: number;
  amenities?: string[];
  currentTenantsCount?: number;
  status?: "Vacant" | "Occupied" | "Partially Occupied";
  createdAt: string;
}

export interface RoomEBReading {
  id: string;
  pgId: string;
  roomId: string;
  roomNumber: string;
  month: string; // "YYYY-MM"
  units: number; // e.g. 400 units
  rate: number; // e.g. 15/unit
  totalRoomEB: number; // e.g. 6000
  activeTenantsCount: number; // e.g. 3
  vacantSlotsCount: number; // e.g. 1
  perTenantEB: number; // e.g. 2000
  createdAt: string;
  updatedAt?: string;
}

export interface Tenant {
  id: string;
  pgId: string;
  roomId: string;
  roomNumber?: string;
  name: string;
  phoneNumber: string; // 10 digit normalized
  joinedAt: string;
  active: boolean; // Must be true for tenant to log in
  rentAmount?: number;
  sharingCategory?: SharingCategory;
}

export interface TenantHistory {
  id: string;
  phoneNumber: string; // Searched by other PG owners
  name: string;
  pgId: string;
  pgName: string;
  roomId: string;
  roomNumber: string;
  joinedAt: string;
  vacatedAt: string;
  rating: number; // 1 - 5 stars
  blackmark: boolean; // Flagged as blacklisted or problematic
  comment: string; // Reason / remarks
  vacatedByOwnerName?: string;
}

export type PaymentStatus = "paid" | "unpaid";

export interface Payment {
  id: string;
  tenantId: string;
  tenantName?: string;
  phoneNumber?: string;
  pgId: string;
  roomId: string;
  roomNumber?: string;
  month: string; // "YYYY-MM"
  baseRent?: number; // Base room rent
  ebUnits?: number; // Room total units
  ebRate?: number; // Per unit price
  ebAmount?: number; // Split share of EB added
  amount: number; // Total = baseRent + ebAmount
  status: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export type TicketCategory = "Maintenance" | "Electrical" | "Plumbing" | "Other";
export type TicketStatus = "open" | "resolved";

export interface Ticket {
  id: string;
  tenantId: string;
  tenantName: string;
  phoneNumber?: string;
  pgId: string;
  roomId: string;
  roomNumber?: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface OwnerDashboardStats {
  totalOccupied?: number;
  occupancyRate?: number;
  totalRooms: number;
  totalCapacity: number;
  totalTenants: number;
  occupancyPercentage: number;
  vacantSlots: number;
  totalMonthlyDue: number;
  totalCollected: number;
  totalPending: number;
  openTicketsCount: number;
  previousTenantsCount: number;
}
