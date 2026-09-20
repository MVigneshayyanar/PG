"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  DoorOpen,
  Search,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  BedDouble,
  SlidersHorizontal,
  Home,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

interface VacantRoomItem {
  id: string;
  roomNumber: string;
  category: string;
  capacity: number;
  rentAmount: number;
  freeSlots: number;
  amenities?: string[];
}

interface PGDirectoryItem {
  id: string;
  pgName: string;
  ownerName: string;
  ownerPhone: string;
  location: { address: string; city: string; pincode: string };
  gstin?: string;
  totalCapacity: number;
  totalOccupied: number;
  totalVacantSlots: number;
  vacantRooms: VacantRoomItem[];
  rentRange: string;
}

export default function HomePage() {
  const [pgs, setPgs] = useState<PGDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/pgs/directory")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pgs) {
          setPgs(data.pgs);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Close search dropdown and reset focus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    setIsSearchFocused(false);
    const directoryEl = document.getElementById("directory");
    if (directoryEl) {
      directoryEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const selectSearchItem = (query: string) => {
    setSearchQuery(query);
    setShowDropdown(false);
    setIsSearchFocused(false);
    const directoryEl = document.getElementById("directory");
    if (directoryEl) {
      directoryEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Comprehensive search matching
  const q = searchQuery.toLowerCase().trim();

  // Compute matching rooms & PGs for the live search dropdown
  const matchingPGsForDropdown = q
    ? pgs.filter((p) => {
        return (
          p.pgName.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.address.toLowerCase().includes(q) ||
          p.location.pincode.includes(q)
        );
      })
    : [];

  const matchingRoomsForDropdown: { room: VacantRoomItem; pgName: string; pgId: string }[] = [];
  if (q) {
    pgs.forEach((pg) => {
      pg.vacantRooms?.forEach((r) => {
        const matchesRoomNumber = r.roomNumber.toLowerCase().includes(q);
        const matchesCategory =
          r.category.toLowerCase().includes(q) ||
          `${r.category}-share`.includes(q) ||
          `${r.category}-sharing`.includes(q) ||
          (q === "single" && r.category === "1") ||
          (q === "double" && r.category === "2") ||
          (q === "triple" && r.category === "3") ||
          (q.includes("dorm") && parseInt(r.category, 10) >= 4);
        const matchesAmenity = r.amenities?.some((am) =>
          am.toLowerCase().includes(q)
        );

        if (matchesRoomNumber || matchesCategory || matchesAmenity) {
          matchingRoomsForDropdown.push({
            room: r,
            pgName: pg.pgName,
            pgId: pg.id,
          });
        }
      });
    });
  }

  // Filter properties and their rooms for the main directory
  const filteredPGs = pgs
    .map((pg) => {
      // Filter rooms by category if active
      let rooms = pg.vacantRooms || [];
      if (selectedCategory !== "all") {
        if (selectedCategory === "4+") {
          rooms = rooms.filter((r) => parseInt(r.category, 10) >= 4);
        } else {
          rooms = rooms.filter((r) => r.category === selectedCategory);
        }
      }

      // If search query is present, check if pg matches or if specific rooms match
      if (q) {
        const pgMatches =
          pg.pgName.toLowerCase().includes(q) ||
          pg.location.city.toLowerCase().includes(q) ||
          pg.location.address.toLowerCase().includes(q) ||
          pg.location.pincode.includes(q);

        const roomMatches = rooms.filter((r) => {
          const matchesRoomNumber = r.roomNumber.toLowerCase().includes(q);
          const matchesCategory =
            r.category.toLowerCase().includes(q) ||
            `${r.category}-share`.includes(q) ||
            `${r.category}-sharing`.includes(q) ||
            (q === "single" && r.category === "1") ||
            (q === "double" && r.category === "2") ||
            (q === "triple" && r.category === "3") ||
            (q.includes("dorm") && parseInt(r.category, 10) >= 4);
          const matchesAmenity = r.amenities?.some((am) =>
            am.toLowerCase().includes(q)
          );
          return matchesRoomNumber || matchesCategory || matchesAmenity;
        });

        if (pgMatches) {
          return { ...pg, vacantRooms: rooms };
        } else if (roomMatches.length > 0) {
          return { ...pg, vacantRooms: roomMatches };
        }
        return null;
      }

      return { ...pg, vacantRooms: rooms };
    })
    .filter((pg): pg is PGDirectoryItem => pg !== null);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <main className="flex-1">
        {/* Soft Sage Hero Section */}
        <section className="relative overflow-hidden bg-[#e8f4ea] border-b border-[#d4ead7] pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bce6c5] bg-[#dcf2e1] px-4 py-1.5 text-xs font-bold text-[#07361b] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#ff6b00]" />
              <span>Direct Verified PG & Coliving Accommodations</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-[#07361b] leading-[1.1]">
              Everything Your Living <br className="hidden sm:inline" />
              Space Should Be
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#24452c] font-medium leading-relaxed">
              Real-time directory of verified PGs, open bed vacancies, exact room pricing,
              and direct owner contact numbers. Zero brokers, pure trust.
            </p>

            {/* Search Input Bar with Integrated Search Action Button */}
            <div ref={searchContainerRef} className="pt-2 max-w-2xl mx-auto relative">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl sm:rounded-full border border-[#c8e4ce] shadow-md shadow-[#07361b]/5 focus-within:border-[#07361b] focus-within:ring-2 focus-within:ring-[#07361b]/15 transition-all"
              >
                <div className="relative flex-1 w-full flex items-center pl-3">
                  <Search className="h-4 w-4 text-[#1e7c3b] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onClick={() => {
                      setIsSearchFocused(true);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      setShowDropdown(true);
                    }}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                      setShowDropdown(true);
                    }}
                    placeholder="Search by city, area, PG name, room (e.g. HSR, AC, Single)..."
                    className="w-full bg-transparent px-3 py-2 text-sm text-[#07361b] placeholder-[#6b9474] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setShowDropdown(false);
                        setIsSearchFocused(false);
                      }}
                      className="p-1 text-slate-400 hover:text-[#07361b] transition-colors rounded-full mr-1"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-7 py-3 text-xs font-black text-white shadow-md shadow-[#ff6b00]/25 active:scale-95 transition-all"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>
              </form>

              {/* Quick Popular Search Tag Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-xs">
                <span className="text-[#33613b] font-medium text-[11px] mr-1">Popular:</span>
                {["All", "HSR Layout", "Koramangala", "1-Share", "2-Share", "AC", "Wi-Fi"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (tag === "All") {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      } else if (tag === "1-Share") {
                        setSelectedCategory("1");
                      } else if (tag === "2-Share") {
                        setSelectedCategory("2");
                      } else {
                        setSearchQuery(tag);
                      }
                      handleSearchSubmit();
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                      (tag === "All" && !searchQuery && selectedCategory === "all") ||
                      (tag === "1-Share" && selectedCategory === "1") ||
                      (tag === "2-Share" && selectedCategory === "2") ||
                      (searchQuery && searchQuery.toLowerCase().includes(tag.toLowerCase()))
                        ? "bg-[#07361b] text-white border-[#07361b] shadow-xs"
                        : "bg-white/80 text-[#24452c] border-[#c8e4ce] hover:bg-[#dcf2e1] hover:text-[#07361b]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Floating Live Search Results Dropdown */}
              {showDropdown && q && (
                <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-3xl border border-[#c8e4ce] shadow-2xl overflow-hidden max-h-[360px] overflow-y-auto text-left divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-[#f4f9f5] border-b border-[#dceadc] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#07361b] flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-[#1e7c3b]" />
                      Search Content Results for &ldquo;{searchQuery}&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        setIsSearchFocused(false);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Close
                    </button>
                  </div>

                  {matchingPGsForDropdown.length === 0 && matchingRoomsForDropdown.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-semibold text-slate-700">No direct matches found</p>
                      <p>Try searching &ldquo;HSR&rdquo;, &ldquo;AC&rdquo;, &ldquo;Single&rdquo;, or click below to view all.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          handleSearchSubmit();
                        }}
                        className="text-[#ff6b00] font-bold underline mt-2 inline-block"
                      >
                        Browse all properties
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Matching Properties */}
                      {matchingPGsForDropdown.length > 0 && (
                        <div className="p-2 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#51a162] px-3 py-1">
                            Matching Properties ({matchingPGsForDropdown.length})
                          </p>
                          {matchingPGsForDropdown.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectSearchItem(p.pgName)}
                              className="w-full text-left p-3 rounded-2xl hover:bg-[#edf6ee] transition-colors flex items-center justify-between gap-3 group"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3.5 w-3.5 text-[#1e7c3b]" />
                                  <span className="text-xs font-bold text-[#07361b] group-hover:text-[#ff6b00] transition-colors">
                                    {p.pgName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#51a162] truncate pl-5">
                                  {p.location.address}, {p.location.city}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-[#ff6b00]">{p.rentRange}</span>
                                <p className="text-[10px] text-[#1e7c3b] font-medium">
                                  {p.totalVacantSlots} beds free
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Vacant Rooms */}
                      {matchingRoomsForDropdown.length > 0 && (
                        <div className="p-2 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#51a162] px-3 py-1">
                            Matching Rooms & Vacancies ({matchingRoomsForDropdown.length})
                          </p>
                          {matchingRoomsForDropdown.slice(0, 6).map((item, idx) => (
                            <button
                              key={`${item.room.id}-${idx}`}
                              type="button"
                              onClick={() => selectSearchItem(`Room ${item.room.roomNumber}`)}
                              className="w-full text-left p-2.5 rounded-2xl hover:bg-[#edf6ee] transition-colors flex items-center justify-between gap-2 group"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <DoorOpen className="h-3.5 w-3.5 text-[#1e7c3b]" />
                                  <span className="font-mono font-bold text-xs text-[#07361b] group-hover:text-[#ff6b00]">
                                    Room {item.room.roomNumber}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#dcf2e1] text-[#07361b] font-semibold">
                                    {item.room.category}-Share
                                  </span>
                                  <span className="text-[10px] text-slate-500">• in {item.pgName}</span>
                                </div>
                                {item.room.amenities && item.room.amenities.length > 0 && (
                                  <p className="text-[10px] text-[#51a162] pl-5 truncate">
                                    {item.room.amenities.join(", ")}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-extrabold text-[#ff6b00]">
                                  ₹{item.room.rentAmount.toLocaleString("en-IN")}/mo
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 3-Pill Feature Banner (Hidden when user clicks/focuses search box) */}
            {!isSearchFocused && (
              <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto transition-all duration-300 animate-in fade-in">
                {/* Left Mint Card */}
                <div className="rounded-3xl bg-[#d2f0d9] border border-[#b5e6bf] p-5 text-left flex flex-col justify-between space-y-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-2xl text-[#07361b]">100%</span>
                      <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                    </div>
                    <h3 className="font-bold text-xs text-[#07361b] mt-1">Verified PG Owners</h3>
                    <p className="text-[11px] text-[#24452c] mt-0.5">
                      Direct phone connect with genuine owners without brokerage.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#07361b]">
                    <ShieldCheck className="h-4 w-4 text-[#1e7c3b]" />
                    <span>ID & GSTIN Verified</span>
                  </div>
                </div>

                {/* Center Deep Pine Card with Tangerine CTA */}
                <div className="rounded-3xl bg-[#07361b] p-5 text-white text-center flex flex-col items-center justify-between space-y-4 shadow-lg shadow-[#07361b]/20">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#a3d3ad] block">
                      Zero Middlemen
                    </span>
                    <h3 className="font-display font-black text-base text-white mt-0.5">
                      Live Bed Availability
                    </h3>
                  </div>
                  <a
                    href="#directory"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] text-xs font-bold text-white shadow-md shadow-[#ff6b00]/30 transition-transform active:scale-95"
                  >
                    <span>Explore Rooms</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Right Mint Card */}
                <div className="rounded-3xl bg-[#d2f0d9] border border-[#b5e6bf] p-5 text-left flex flex-col justify-between space-y-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-black text-2xl text-[#07361b]">0%</span>
                      <span className="h-2 w-2 rounded-full bg-[#1e7c3b]" />
                    </div>
                    <h3 className="font-bold text-xs text-[#07361b] mt-1">Zero Brokerage</h3>
                    <p className="text-[11px] text-[#24452c] mt-0.5">
                      Connect directly with property managers with transparent rental terms.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#07361b]">
                    <CheckCircle2 className="h-4 w-4 text-[#1e7c3b]" />
                    <span>Direct Resident Onboarding</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Directory Section: Registered PGs & Live Vacancies */}
        <section id="directory" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dceadc] pb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[#07361b] flex items-center gap-2">
                <Building2 className="h-6 w-6 text-[#1e7c3b]" />
                Registered PGs & Live Vacancies
              </h2>
              <p className="text-xs text-[#33613b] mt-0.5">
                Displaying live occupancy, sharing types, and direct contact numbers
              </p>
            </div>

            {/* Sharing Category Quick Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#33613b] mr-1 hidden lg:inline">Sharing:</span>
              {[
                { id: "all", label: "All Rooms" },
                { id: "1", label: "1-Sharing (Single)" },
                { id: "2", label: "2-Sharing" },
                { id: "3", label: "3-Sharing" },
                { id: "4+", label: "4+ / Dorm" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedCategory === tab.id
                      ? "bg-[#07361b] text-white shadow-xs"
                      : "bg-[#edf6ee] text-[#24452c] hover:bg-[#dcf2e1] hover:text-[#07361b]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5] ml-1">
                {filteredPGs.length} {filteredPGs.length === 1 ? "Property" : "Properties"}
              </span>
            </div>
          </div>

          {/* Active Search & Filter Banner */}
          {(searchQuery || selectedCategory !== "all") && (
            <div className="flex items-center justify-between gap-3 bg-[#e8f4ea] border border-[#bce6c5] px-4 py-2.5 rounded-2xl text-xs text-[#07361b]">
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#1e7c3b]" />
                <span>
                  Filtering by:{" "}
                  {searchQuery && (
                    <span className="font-bold bg-white px-2 py-0.5 rounded-md border border-[#bce6c5] mr-1.5">
                      &ldquo;{searchQuery}&rdquo;
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="font-bold bg-white px-2 py-0.5 rounded-md border border-[#bce6c5]">
                      {selectedCategory === "1"
                        ? "Single (1-Share)"
                        : selectedCategory === "4+"
                        ? "4+ / Dorm"
                        : `${selectedCategory}-Sharing`}
                    </span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-[#ff6b00] font-bold hover:underline shrink-0"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Directory Listings */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-[#1e7c3b] animate-spin" />
              <p className="text-xs text-[#33613b] font-medium">Loading verified properties...</p>
            </div>
          ) : filteredPGs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#d8ebd9] shadow-xs space-y-3">
              <p className="text-[#24452c] font-medium">
                No properties or vacant rooms matched your current search filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-[#ff6b00] font-bold hover:underline"
              >
                Reset filters & show all PGs
              </button>
            </div>
          ) : (
            /* Perfectly Even Full-Width Property Showcase Layout */
            <div className="space-y-6">
              {filteredPGs.map((pg) => (
                <div
                  key={pg.id}
                  className="bg-white rounded-3xl border border-[#d8ebd9] shadow-xs hover:border-[#a3d3ad] hover:shadow-md transition-all p-6 sm:p-7 space-y-5"
                >
                  {/* Property Header Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#edf5ee]">
                    {/* Property Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-display text-xl sm:text-2xl font-black text-[#07361b] tracking-tight">
                          {pg.pgName}
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5]">
                          Verified
                        </span>
                      </div>

                      <p className="text-xs text-[#33613b] flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-[#51a162] shrink-0" />
                        <span>
                          {pg.location.address}, {pg.location.city} - {pg.location.pincode}
                        </span>
                      </p>
                    </div>

                    {/* Price Range & Quick Contact Callout */}
                    <div className="flex items-center gap-4 self-start lg:self-auto shrink-0 flex-wrap">
                      <div className="text-left lg:text-right">
                        <span className="font-display text-lg sm:text-xl font-black text-[#ff6b00] block">
                          {pg.rentRange}
                        </span>
                        <p className="text-[10px] text-[#51a162] font-semibold">Rent starts from</p>
                      </div>

                      <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                      <a
                        href={`tel:+91${pg.ownerPhone}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#07361b] hover:bg-[#0f4523] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      >
                        <Phone className="h-3.5 w-3.5 text-[#ff6b00]" />
                        <span>Call Owner (+91 {pg.ownerPhone})</span>
                      </a>
                    </div>
                  </div>

                  {/* Vacancy Header */}
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#07361b] flex items-center gap-1.5">
                      <DoorOpen className="h-4 w-4 text-[#1e7c3b]" />
                      <span>Open Room Vacancies:</span>
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-[11px] font-bold border ${
                        pg.totalVacantSlots > 0
                          ? "bg-[#dcf2e1] text-[#07361b] border-[#bce6c5]"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {pg.totalVacantSlots > 0
                        ? `${pg.totalVacantSlots} open bed slots across property`
                        : "Fully Occupied"}
                    </span>
                  </div>

                  {/* Evenly Balanced Uniform Room Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {pg.vacantRooms && pg.vacantRooms.length > 0 ? (
                      pg.vacantRooms.map((r) => {
                        const amenities = r.amenities || [];

                        return (
                          <div
                            key={r.id}
                            className="min-h-[148px] rounded-2xl bg-[#edf6ee] border border-[#d0e8d5] p-3.5 text-xs text-[#07361b] flex flex-col justify-between hover:border-[#9fcfab] hover:bg-[#e4f2e6] hover:shadow-xs transition-all"
                          >
                            {/* Top row: Room Number, Sharing & Free Beds */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono font-black text-[#07361b] text-sm truncate">
                                  Room {r.roomNumber}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#33613b] font-bold border border-[#c8e4ce] shrink-0">
                                  {r.category}-Share
                                </span>
                              </div>

                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5] whitespace-nowrap shrink-0">
                                {r.freeSlots} {r.freeSlots > 1 ? "beds" : "bed"} free
                              </span>
                            </div>

                            {/* Middle row: Pricing */}
                            <div className="flex items-baseline justify-between text-xs py-0.5">
                              <span className="text-[11px] text-[#51a162] font-semibold">Monthly Rent:</span>
                              <span className="font-display font-black text-[#ff6b00] text-sm">
                                ₹{r.rentAmount.toLocaleString("en-IN")}/mo
                              </span>
                            </div>

                            {/* Bottom row: Amenities list (Show all amenities fully) */}
                            {amenities.length > 0 && (
                              <div className="pt-2 border-t border-[#d8ebd9] flex items-center gap-1 flex-wrap">
                                {amenities.map((am) => (
                                  <span
                                    key={am}
                                    className="inline-flex items-center gap-1 rounded-full bg-white border border-[#c8e4ce] px-2 py-0.5 text-[10px] font-medium text-[#07361b] whitespace-nowrap"
                                  >
                                    <Sparkles className="h-2 w-2 text-[#ff6b00]" />
                                    <span>{am}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full p-4 rounded-2xl bg-[#f8fbf8] border border-dashed border-[#c8e4ce] text-center text-xs text-[#51a162] italic">
                        No vacant rooms currently available in this category for {pg.pgName}.
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Summary & CTA */}
                  <div className="pt-4 border-t border-[#edf5ee] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-[#51a162] text-[11px] font-medium">
                      {pg.gstin && <span>GSTIN: {pg.gstin}</span>}
                      <span>•</span>
                      <span>Owner: <strong className="text-[#07361b]">{pg.ownerName}</strong></span>
                    </div>

                    <a
                      href={`tel:+91${pg.ownerPhone}`}
                      className="inline-flex items-center gap-1.5 text-[#ff6b00] font-bold hover:text-[#eb5e00] transition-colors self-start sm:self-auto"
                    >
                      <span>Inquire & Reserve Bed</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Informational Workflow Section */}
        <section className="bg-white border-t border-[#dceadc] py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-1.5">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">
                How PGM Operates
              </h2>
              <p className="text-xs text-[#33613b] font-medium">
                Transparent management with tenant background verification and instant digital dues
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div className="p-6 rounded-3xl bg-[#f4f9f5] border border-[#dceadc] space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-[#07361b] text-white flex items-center justify-center font-display font-black text-base shadow-sm">
                  1
                </div>
                <h4 className="font-display font-bold text-base text-[#07361b]">Owner Registers PG</h4>
                <p className="text-xs text-[#24452c] leading-relaxed">
                  Only PG Owners can register their property. Their mobile number becomes their direct login credential.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f4f9f5] border border-[#dceadc] space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-[#ff6b00] text-white flex items-center justify-center font-display font-black text-base shadow-sm">
                  2
                </div>
                <h4 className="font-display font-bold text-base text-[#07361b]">Owner Enrolls Tenant</h4>
                <p className="text-xs text-[#24452c] leading-relaxed">
                  Owners search cross-PG tenant history for stars & blackmarks, then map the tenant to a room. Only enrolled tenants can log in.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#f4f9f5] border border-[#dceadc] space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-[#07361b] text-white flex items-center justify-center font-display font-black text-base shadow-sm">
                  3
                </div>
                <h4 className="font-display font-bold text-base text-[#07361b]">Vacating & Rating</h4>
                <p className="text-xs text-[#24452c] leading-relaxed">
                  When vacating, the owner rates the tenant and can flag blackmarks. Once vacated, tenant login is instantly revoked.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Legal Compliance Links */}
      <footer className="border-t border-[#dceadc] bg-white py-8 text-center text-xs text-[#33613b]">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#07361b]">
            <Link href="/privacy-policy" className="hover:text-emerald-700 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-emerald-700 transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link href="/refund-policy" className="hover:text-emerald-700 transition-colors">
              Refund & Cancellation
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-emerald-700 transition-colors">
              Contact Us
            </Link>
          </div>
          <p className="font-bold text-[#07361b] pt-1">PGM — Paying Guest & Coliving Management Platform</p>
          <p className="text-[11px] text-[#51a162]">&copy; {new Date().getFullYear()} PGM. Compliant with IT Act 2000 & DPDP Act 2023. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
