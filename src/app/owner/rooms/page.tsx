"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DoorOpen,
  Plus,
  Users,
  X,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Pencil,
  Sparkles,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Room, SharingCategory } from "@/types";

export const AVAILABLE_AMENITIES = [
  { id: "Bed", label: "Bed / Cot", icon: "🛏️" },
  { id: "Study Table", label: "Table / Desk", icon: "🪑" },
  { id: "Cupboard", label: "Cupboard / Wardrobe", icon: "🚪" },
  { id: "Fan", label: "Ceiling Fan", icon: "💨" },
  { id: "AC", label: "Air Conditioner (AC)", icon: "❄️" },
  { id: "Living Hall", label: "Living Hall", icon: "🛋️" },
  { id: "Balcony", label: "Balcony", icon: "🌅" },
  { id: "Attached Kitchen", label: "Attached Kitchen", icon: "🍳" },
  { id: "Attached Bathroom", label: "Attached Bathroom", icon: "🚿" },
  { id: "Geyser", label: "Geyser / Hot Water", icon: "🔥" },
  { id: "High-Speed Wi-Fi", label: "High-Speed Wi-Fi", icon: "📶" },
];

export default function RoomsManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [form, setForm] = useState({
    roomNumber: "",
    category: "2" as SharingCategory,
    rentAmount: "9000",
    amenities: ["Bed", "Study Table", "Cupboard", "Fan"] as string[],
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setForm({
      roomNumber: "",
      category: "2",
      rentAmount: "9000",
      amenities: ["Bed", "Study Table", "Cupboard", "Fan", "High-Speed Wi-Fi"],
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.roomNumber,
      category: room.category,
      rentAmount: String(room.rentAmount),
      amenities: room.amenities || ["Bed", "Study Table", "Cupboard", "Fan"],
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const toggleAmenity = (amenityId: string) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(amenityId);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter((a) => a !== amenityId) };
      } else {
        return { ...prev, amenities: [...prev.amenities, amenityId] };
      }
    });
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const formattedRoomNumber = form.roomNumber.trim();
    if (!formattedRoomNumber) {
      setModalError("Please enter a room number.");
      return;
    }

    // Client-side uniqueness check
    const duplicate = rooms.find(
      (r) =>
        (!editingRoom || r.id !== editingRoom.id) &&
        r.roomNumber.trim().toLowerCase() === formattedRoomNumber.toLowerCase()
    );
    if (duplicate) {
      setModalError(
        `Room ${formattedRoomNumber} already exists in your property. Each room number must be unique.`
      );
      return;
    }

    try {
      setSubmitting(true);
      if (editingRoom) {
        // Update existing room
        const res = await fetch("/api/rooms", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: editingRoom.id,
            roomNumber: formattedRoomNumber,
            category: form.category,
            rentAmount: Number(form.rentAmount),
            amenities: form.amenities,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          await fetchRooms();
        } else {
          setModalError(data.error || "Failed to update room");
        }
      } else {
        // Add new room
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: formattedRoomNumber,
            category: form.category,
            rentAmount: Number(form.rentAmount),
            amenities: form.amenities,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          await fetchRooms();
        } else {
          setModalError(data.error || "Failed to add room");
        }
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Error saving room");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/owner/dashboard"
                className="text-xs font-bold text-[#ff6b00] hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#07361b] mt-1">
              Room Inventory & Occupancy
            </h1>
            <p className="text-xs text-[#33613b]">
              Configure room numbers, sharing types, amenities (Bed, AC, Balcony, Kitchen, etc.), and track live bed allocations in real-time.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all self-start sm:self-auto active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Room</span>
          </button>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-[#07361b] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => {
              const current = room.currentTenantsCount || 0;
              const openSlots = Math.max(0, room.capacity - current);
              const percentage = Math.round((current / room.capacity) * 100);

              let statusColor = "bg-[#dcf2e1] text-[#07361b] border-[#bce6c5]";
              if (room.status === "Occupied") {
                statusColor = "bg-rose-50 text-rose-800 border-rose-200";
              } else if (room.status === "Partially Occupied") {
                statusColor = "bg-[#fff4eb] text-[#c2410c] border-[#ffd4b2]";
              }

              const roomAmenities = room.amenities && room.amenities.length > 0
                ? room.amenities
                : ["Bed", "Study Table", "Cupboard", "Fan"];

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-[#d8ebd9] shadow-xs p-6 space-y-4 hover:border-[#a3d3ad] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-xl font-black text-[#07361b]">
                            Room {room.roomNumber}
                          </h3>
                          <button
                            onClick={() => handleOpenEditModal(room)}
                            title="Edit Room Details"
                            className="p-1 rounded-lg text-[#51a162] hover:text-[#07361b] hover:bg-[#edf6ee] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-[#33613b] font-bold">
                          {room.category === "1" ? "Single Occupancy" : `${room.category}-Sharing Room`}
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                        {room.status || "Vacant"}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between rounded-2xl bg-[#f4f9f5] p-3.5 border border-[#dceadc]">
                      <span className="text-xs text-[#51a162] font-semibold">Rent per Bed:</span>
                      <span className="font-display text-lg font-black text-[#ff6b00]">
                        ₹{room.rentAmount.toLocaleString("en-IN")}
                        <span className="text-[10px] font-normal text-[#51a162]">/mo</span>
                      </span>
                    </div>

                    {/* Room Amenities Badges */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#51a162]">
                        Room Amenities:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {roomAmenities.map((am) => (
                          <span
                            key={am}
                            className="inline-flex items-center gap-1 rounded-full bg-[#edf6ee] border border-[#d0e8d5] px-2.5 py-0.5 text-[11px] font-medium text-[#07361b]"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-[#ff6b00]" />
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Occupancy Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-[#24452c]">
                        <span className="flex items-center gap-1 font-bold">
                          <Users className="h-3.5 w-3.5 text-[#51a162]" />
                          Occupancy: {current} / {room.capacity}
                        </span>
                        <span className={openSlots > 0 ? "text-[#1e7c3b] font-bold" : "text-[#51a162]"}>
                          {openSlots > 0 ? `${openSlots} bed${openSlots > 1 ? "s" : ""} free` : "Full"}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-[#dcf2e1] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage === 100
                              ? "bg-rose-500"
                              : percentage > 0
                              ? "bg-[#ff6b00]"
                              : "bg-[#07361b]"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#edf5ee] flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      className="px-3.5 py-2 rounded-full border border-[#d0e8d5] hover:border-[#07361b] bg-white hover:bg-[#edf6ee] text-xs font-bold text-[#07361b] flex items-center gap-1.5 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#ff6b00]" />
                      <span>Edit Details</span>
                    </button>

                    {openSlots > 0 ? (
                      <Link
                        href={`/owner/tenants?roomId=${room.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-[#07361b] hover:bg-[#0f4523] text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#ff6b00]" />
                        <span>Assign Tenant ({openSlots})</span>
                      </Link>
                    ) : (
                      <div className="flex-1 text-center text-xs text-[#51a162] py-2 font-medium">
                        Room fully occupied
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 !m-0 z-[9999] flex items-center justify-center p-4 bg-[#072e18]/60 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#d8ebd9] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#e2efe4] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5] flex items-center justify-center font-bold">
                  {editingRoom ? <Pencil className="h-4 w-4 text-[#ff6b00]" /> : <DoorOpen className="h-5 w-5 text-[#07361b]" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#07361b]">
                    {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : "Add New Room"}
                  </h3>
                  <p className="text-xs text-[#33613b]">
                    {editingRoom ? "Update room number, rent, and available amenities" : "Set room number, sharing category, rent, and amenities"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-[#51a162] hover:text-[#07361b] hover:bg-[#edf6ee] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 201 or B-102"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#07361b]">
                    Occupancy / Sharing Capacity *
                  </label>
                  <span className="text-[11px] font-bold text-[#ff6b00]">
                    {form.category === "1"
                      ? "1 Bed (Single Room)"
                      : `${form.category} Beds (${form.category}-Sharing)`}
                  </span>
                </div>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as SharingCategory })}
                  className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm font-bold text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all cursor-pointer"
                >
                  {Array.from({ length: 15 }, (_, i) => String(i + 1)).map((num) => (
                    <option key={num} value={num}>
                      {num === "1"
                        ? "1 Sharing — Single Room (Private)"
                        : `${num} Sharing — ${num} Beds Room`}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#51a162] mt-1">
                  Choose from 1 to 15 bed sharing capacity for this room.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                  Monthly Rent per Bed (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-[#51a162] font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    placeholder="9000"
                    value={form.rentAmount}
                    onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-8 pr-4 py-2.5 text-sm text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>
              </div>

              {/* Room Amenities Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#07361b]">
                    Available Room Amenities ({form.amenities.length} selected)
                  </label>
                  <span className="text-[10px] text-[#51a162]">
                    Click to toggle for this room
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {AVAILABLE_AMENITIES.map((am) => {
                    const isSelected = form.amenities.includes(am.id);
                    return (
                      <button
                        key={am.id}
                        type="button"
                        onClick={() => toggleAmenity(am.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                          isSelected
                            ? "border-[#07361b] bg-[#dcf2e1] text-[#07361b] font-bold shadow-xs"
                            : "border-[#d8ebd9] bg-[#f8fbf8] text-[#33613b] hover:bg-[#edf6ee]"
                        }`}
                      >
                        <span className="text-sm">{am.icon}</span>
                        <span className="flex-1 truncate">{am.label}</span>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-[#07361b] shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e2efe4]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#d8ebd9] text-xs font-bold text-[#24452c] hover:bg-[#f4f9f5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all disabled:opacity-50 active:scale-98"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>{editingRoom ? "Update Room Details" : "Save Room"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
