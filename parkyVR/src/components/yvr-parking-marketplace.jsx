import { useState, useEffect, useCallback } from "react";

// ─── Persistent Storage Helpers ───────────────────────────────────────────────
const storage = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); } catch {}
  },
};

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_LISTINGS = [
  { id: "l1", hostId: "host1", hostName: "Sarah M.", title: "Covered Spot near YVR South Terminal", address: "4400 Cowley Crescent, Richmond", neighborhood: "Richmond / YVR", type: "Covered", price: 12, priceUnit: "day", lat: 49.181, lng: -123.169, amenities: ["Covered", "24/7 Access", "EV Charging"], description: "Secure covered spot 5 min walk from YVR South Terminal. EV charging available. Great for long trips.", available: true, createdAt: "2024-01-10" },
  { id: "l2", hostId: "host2", hostName: "David K.", title: "Driveway Spot — 2 min from Templeton SkyTrain", address: "Templeton Rd, Richmond", neighborhood: "Richmond / YVR", type: "Driveway", price: 8, priceUnit: "day", lat: 49.196, lng: -123.148, amenities: ["SkyTrain Nearby", "Security Camera"], description: "Concrete driveway spot. Free SkyTrain to YVR is literally at the end of the block. Perfect for budget travelers.", available: true, createdAt: "2024-01-12" },
  { id: "l3", hostId: "host3", hostName: "Priya R.", title: "Underground Parkade — Downtown Vancouver", address: "666 Burrard St, Vancouver", neighborhood: "Downtown Vancouver", type: "Underground", price: 18, priceUnit: "day", lat: 49.285, lng: -123.119, amenities: ["Underground", "Gated", "Well Lit", "CCTV"], description: "Secure underground spot in the heart of downtown. Perfect for events, shopping, or business trips.", available: true, createdAt: "2024-01-15" },
  { id: "l4", hostId: "host4", hostName: "Tom B.", title: "Open Lot — Waterfront / Canada Place", address: "999 Canada Pl, Vancouver", neighborhood: "Downtown Vancouver", type: "Surface", price: 22, priceUnit: "day", lat: 49.288, lng: -123.112, amenities: ["Waterfront View", "Easy Access"], description: "Open surface lot steps from Canada Place and the cruise ship terminal. Great location, very easy in/out.", available: true, createdAt: "2024-01-18" },
  { id: "l5", hostId: "host5", hostName: "Linda C.", title: "Private Garage — Quiet Residential", address: "Miller Rd, Richmond", neighborhood: "Richmond / YVR", type: "Garage", price: 15, priceUnit: "day", lat: 49.192, lng: -123.152, amenities: ["Garage", "Covered", "Very Secure", "Quiet"], description: "Single-car private garage. Super secure — you get a code to the door. 10 min drive to YVR.", available: true, createdAt: "2024-01-20" },
];

const SEED_BOOKINGS = [];
const SEED_REVIEWS = [
  { id: "r1", listingId: "l1", userId: "user_demo", userName: "Alex T.", rating: 5, comment: "Fantastic spot! EV charger worked perfectly and the location saved me so much stress before my flight.", date: "2024-02-01" },
  { id: "r2", listingId: "l1", userId: "user_demo2", userName: "Maria S.", rating: 4, comment: "Very close to the terminal. Easy access. Would definitely book again.", date: "2024-02-10" },
  { id: "r3", listingId: "l2", userId: "user_demo3", userName: "James W.", rating: 5, comment: "The SkyTrain access made this unbeatable value. Sarah was super responsive.", date: "2024-02-05" },
  { id: "r4", listingId: "l3", userId: "user_demo4", userName: "Chen L.", rating: 4, comment: "Clean, secure underground spot downtown. Worth every penny.", date: "2024-02-12" },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().split("T")[0];
const formatDate = (d) => new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
const daysBetween = (a, b) => Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));
const avgRating = (reviews, lid) => {
  const rs = reviews.filter(r => r.listingId === lid);
  if (!rs.length) return null;
  return (rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1);
};

const NEIGHBORHOODS = ["All Areas", "Richmond / YVR", "Downtown Vancouver"];
const TYPES = ["All Types", "Covered", "Driveway", "Underground", "Garage", "Surface"];

// ─── Sub-components ────────────────────────────────────────────────────────────
const Stars = ({ rating, size = 14, interactive = false, onSet }) => (
  <span style={{ display: "inline-flex", gap: 1 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i}
        onClick={() => interactive && onSet && onSet(i)}
        style={{ fontSize: size, color: i <= Math.round(rating) ? "#FFBE3D" : "#2a2a2a", cursor: interactive ? "pointer" : "default", lineHeight: 1 }}>★</span>
    ))}
  </span>
);

const Tag = ({ label, color }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
    padding: "3px 8px", borderRadius: 4,
    background: color === "green" ? "rgba(74,222,128,0.12)" : color === "blue" ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.05)",
    color: color === "green" ? "#4ade80" : color === "blue" ? "#60a5fa" : "#666",
    border: `1px solid ${color === "green" ? "rgba(74,222,128,0.2)" : color === "blue" ? "rgba(96,165,250,0.2)" : "#1f1f1f"}`,
  }}>{label}</span>
);

const Input = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{label}</label>}
    <input {...props} style={{
      background: "#0d0d0d", border: "1px solid #222", borderRadius: 8,
      padding: "10px 13px", color: "#eee", fontSize: 13, fontFamily: "inherit",
      outline: "none", transition: "border-color 0.15s",
      ...(props.style || {}),
    }}
    onFocus={e => e.target.style.borderColor = "#FFBE3D"}
    onBlur={e => e.target.style.borderColor = "#222"}
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{label}</label>}
    <textarea {...props} style={{
      background: "#0d0d0d", border: "1px solid #222", borderRadius: 8,
      padding: "10px 13px", color: "#eee", fontSize: 13, fontFamily: "inherit",
      outline: "none", resize: "vertical", minHeight: 80, transition: "border-color 0.15s",
      ...(props.style || {}),
    }}
    onFocus={e => e.target.style.borderColor = "#FFBE3D"}
    onBlur={e => e.target.style.borderColor = "#222"}
    />
  </div>
);

const Btn = ({ children, variant = "primary", onClick, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: variant === "primary" ? "#FFBE3D" : variant === "danger" ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.05)",
    color: variant === "primary" ? "#000" : variant === "danger" ? "#f87171" : "#ccc",
    border: variant === "danger" ? "1px solid rgba(248,113,113,0.3)" : variant === "ghost" ? "1px solid #222" : "none",
    borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700,
    fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, letterSpacing: "0.03em", transition: "all 0.15s",
    ...style,
  }}>{children}</button>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  }} onClick={onClose}>
    <div style={{
      background: "#111", border: "1px solid #222", borderRadius: 16,
      padding: 28, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto",
      position: "relative",
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Toast = ({ msg, type }) => (
  <div style={{
    position: "fixed", bottom: 24, right: 24, zIndex: 2000,
    background: type === "success" ? "#1a2e1a" : "#2e1a1a",
    border: `1px solid ${type === "success" ? "#4ade80" : "#f87171"}`,
    color: type === "success" ? "#4ade80" : "#f87171",
    borderRadius: 10, padding: "12px 18px", fontSize: 13, fontWeight: 500,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  }}>{msg}</div>
);

// ─── Listing Card ──────────────────────────────────────────────────────────────
const ListingCard = ({ listing, reviews, onBook, onReview, onDelete, isOwner }) => {
  const rating = avgRating(reviews, listing.id);
  const rCount = reviews.filter(r => r.listingId === listing.id).length;
  const typeColors = { Covered: "blue", Underground: "blue", Garage: "blue", Driveway: "green", Surface: "green" };

  return (
    <div style={{
      background: "#111", border: "1px solid #1a1a1a", borderRadius: 14,
      overflow: "hidden", transition: "border-color 0.2s, transform 0.2s",
      display: "flex", flexDirection: "column",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {/* Map placeholder */}
      <div style={{
        height: 120, background: `linear-gradient(135deg, #0d1a0d 0%, #0a0d1a 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", borderRadius: "50%",
              width: 60 + i * 30, height: 60 + i * 30,
              border: "1px solid rgba(255,190,61,0.2)",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
            }} />
          ))}
        </div>
        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{ fontSize: 28 }}>🅿</div>
          <div style={{ fontSize: 10, color: "#FFBE3D", letterSpacing: "0.1em", marginTop: 2 }}>{listing.neighborhood}</div>
        </div>
        {isOwner && <div style={{ position: "absolute", top: 8, right: 8 }}><Tag label="Your Listing" color="blue" /></div>}
      </div>

      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <Tag label={listing.type} color={typeColors[listing.type] || "default"} />
            {listing.amenities.slice(0, 2).map(a => <Tag key={a} label={a} />)}
          </div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#eee", lineHeight: 1.4, fontFamily: "'Syne', sans-serif" }}>
            {listing.title}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#555" }}>{listing.address}</p>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#666", lineHeight: 1.5, flex: 1 }}>{listing.description}</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            {rating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Stars rating={parseFloat(rating)} size={12} />
                <span style={{ fontSize: 12, color: "#aaa" }}>{rating}</span>
                <span style={{ fontSize: 11, color: "#444" }}>({rCount})</span>
              </div>
            ) : <span style={{ fontSize: 11, color: "#444" }}>No reviews yet</span>}
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#FFBE3D", fontFamily: "'Syne', sans-serif" }}>${listing.price}</span>
            <span style={{ fontSize: 11, color: "#555" }}>/{listing.priceUnit}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {isOwner ? (
            <Btn variant="danger" onClick={() => onDelete(listing.id)} style={{ flex: 1, padding: "8px" }}>Remove Listing</Btn>
          ) : (
            <>
              <Btn variant="primary" onClick={() => onBook(listing)} style={{ flex: 1, padding: "8px" }}>Book Now</Btn>
              <Btn variant="ghost" onClick={() => onReview(listing)} style={{ padding: "8px 12px" }}>★</Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("find"); // find | host | bookings | profile
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null); // { id, name, role }
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [bookModal, setBookModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [loginModal, setLoginModal] = useState(false);
  const [hostModal, setHostModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [neighborhood, setNeighborhood] = useState("All Areas");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [maxPrice, setMaxPrice] = useState(100);

  // Book form
  const [bookForm, setBookForm] = useState({ checkIn: today(), checkOut: today(), vehicle: "" });
  // Review form
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  // Host form
  const [hostForm, setHostForm] = useState({
    title: "", address: "", neighborhood: "Richmond / YVR", type: "Surface",
    price: "", amenities: "", description: "",
  });
  // Login form
  const [loginForm, setLoginForm] = useState({ name: "", role: "driver" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load from storage
  useEffect(() => {
    (async () => {
      const l = await storage.get("listings") || SEED_LISTINGS;
      const b = await storage.get("bookings") || SEED_BOOKINGS;
      const rv = await storage.get("reviews") || SEED_REVIEWS;
      const u = await storage.get("currentUser");
      setListings(l);
      setBookings(b);
      setReviews(rv);
      if (u) setUser(u);
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (key, val) => { await storage.set(key, val); }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!loginForm.name.trim()) return;
    const u = { id: uid(), name: loginForm.name.trim(), role: loginForm.role };
    setUser(u);
    persist("currentUser", u);
    setLoginModal(false);
    showToast(`Welcome, ${u.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    persist("currentUser", null);
    showToast("Logged out", "error");
  };

  const handleBook = async () => {
    if (!user) { setLoginModal(true); return; }
    if (!bookForm.vehicle.trim()) { showToast("Please enter your vehicle plate/model", "error"); return; }
    if (bookForm.checkOut < bookForm.checkIn) { showToast("Check-out must be after check-in", "error"); return; }
    const days = daysBetween(bookForm.checkIn, bookForm.checkOut);
    const total = days * bookModal.price;
    const newBooking = {
      id: uid(), listingId: bookModal.id, userId: user.id, userName: user.name,
      listingTitle: bookModal.title, address: bookModal.address,
      checkIn: bookForm.checkIn, checkOut: bookForm.checkOut,
      vehicle: bookForm.vehicle, days, total, status: "Confirmed",
      createdAt: new Date().toISOString(),
    };
    const updated = [...bookings, newBooking];
    setBookings(updated);
    await persist("bookings", updated);
    setBookModal(null);
    setBookForm({ checkIn: today(), checkOut: today(), vehicle: "" });
    showToast(`Booking confirmed! $${total} total for ${days} day${days > 1 ? "s" : ""}.`);
  };

  const handleReview = async () => {
    if (!user) { setLoginModal(true); return; }
    if (!reviewForm.comment.trim()) { showToast("Please write a comment", "error"); return; }
    const newReview = {
      id: uid(), listingId: reviewModal.id, userId: user.id, userName: user.name,
      rating: reviewForm.rating, comment: reviewForm.comment.trim(),
      date: today(),
    };
    const updated = [...reviews, newReview];
    setReviews(updated);
    await persist("reviews", updated);
    setReviewModal(null);
    setReviewForm({ rating: 5, comment: "" });
    showToast("Review posted!");
  };

  const handleHostSubmit = async () => {
    if (!user) { setLoginModal(true); return; }
    if (!hostForm.title || !hostForm.address || !hostForm.price) {
      showToast("Please fill in all required fields", "error"); return;
    }
    const newListing = {
      id: uid(), hostId: user.id, hostName: user.name,
      title: hostForm.title, address: hostForm.address,
      neighborhood: hostForm.neighborhood, type: hostForm.type,
      price: parseFloat(hostForm.price), priceUnit: "day",
      amenities: hostForm.amenities ? hostForm.amenities.split(",").map(s => s.trim()).filter(Boolean) : [],
      description: hostForm.description,
      available: true, createdAt: today(),
      lat: 49.18 + Math.random() * 0.12, lng: -123.17 + Math.random() * 0.07,
    };
    const updated = [...listings, newListing];
    setListings(updated);
    await persist("listings", updated);
    setHostModal(false);
    setHostForm({ title: "", address: "", neighborhood: "Richmond / YVR", type: "Surface", price: "", amenities: "", description: "" });
    setTab("find");
    showToast("Your space is now listed!");
  };

  const handleDelete = async (lid) => {
    const updated = listings.filter(l => l.id !== lid);
    setListings(updated);
    await persist("listings", updated);
    showToast("Listing removed", "error");
  };

  const handleCancelBooking = async (bid) => {
    const updated = bookings.map(b => b.id === bid ? { ...b, status: "Cancelled" } : b);
    setBookings(updated);
    await persist("bookings", updated);
    showToast("Booking cancelled", "error");
  };

  // ── Filtered listings ────────────────────────────────────────────────────────
  const filtered = listings.filter(l => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.address.toLowerCase().includes(search.toLowerCase())) return false;
    if (neighborhood !== "All Areas" && l.neighborhood !== neighborhood) return false;
    if (typeFilter !== "All Types" && l.type !== typeFilter) return false;
    if (l.price > maxPrice) return false;
    return true;
  });

  const myListings = listings.filter(l => user && l.hostId === user.id);
  const myBookings = bookings.filter(b => user && b.userId === user.id);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#FFBE3D", fontFamily: "monospace", letterSpacing: "0.2em" }}>LOADING…</div>
    </div>
  );

  return (
    <div className="parkyVR-root" style={{ minHeight: "100vh", width: "100%", background: "#080808", color: "#e0e0e0", fontFamily: "'DM Mono', 'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; margin: 0; padding: 0; }
        .parkyVR-root { width: 100vw; min-height: 100vh; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
        select { background: #0d0d0d; border: 1px solid #222; border-radius: 8px; padding: 8px 12px; color: #ccc; font-family: inherit; font-size: 12px; outline: none; cursor: pointer; }
        input[type=range] { accent-color: #FFBE3D; width: 100%; }
        ::placeholder { color: #444; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: "1px solid #141414", padding: "16px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg,#0f0f0f 0%,#080808 100%)",
        position: "sticky", top: 0, zIndex: 100, width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🅿</span>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "#fff" }}>
              Park<span style={{ color: "#FFBE3D" }}>YVR</span>
            </div>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase" }}>Parking Marketplace</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: "#666" }}>Hi, <span style={{ color: "#FFBE3D" }}>{user.name}</span></span>
              <Btn variant="ghost" onClick={handleLogout} style={{ padding: "6px 12px", fontSize: 11 }}>Log out</Btn>
            </>
          ) : (
            <Btn variant="primary" onClick={() => setLoginModal(true)} style={{ padding: "8px 16px" }}>Sign In</Btn>
          )}
        </div>
      </header>

      {/* ── NAV ── */}
      <nav style={{
        borderBottom: "1px solid #141414", display: "flex", gap: 0,
        padding: "0 40px", background: "#080808", overflowX: "auto", width: "100%",
      }}>
        {[
          { id: "find", label: "🔍 Find Parking" },
          { id: "host", label: "➕ List Your Space" },
          { id: "bookings", label: `📋 My Bookings${myBookings.length ? ` (${myBookings.filter(b=>b.status==="Confirmed").length})` : ""}` },
          { id: "mylistings", label: `🏠 My Listings${myListings.length ? ` (${myListings.length})` : ""}` },
        ].map(n => (
          <button key={n.id} onClick={() => { if (n.id === "host") setHostModal(true); else setTab(n.id); }}
            style={{
              background: "none", border: "none", borderBottom: `2px solid ${tab === n.id ? "#FFBE3D" : "transparent"}`,
              color: tab === n.id ? "#FFBE3D" : "#555", padding: "14px 16px", fontSize: 12, fontWeight: 500,
              fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s",
            }}>
            {n.label}
          </button>
        ))}
      </nav>

      <main style={{ width: "100%", padding: "28px 40px" }}>

        {/* ── FIND TAB ── */}
        {tab === "find" && (
          <div>
            {/* Search bar */}
            <div style={{ marginBottom: 20 }}>
              <Input placeholder="Search by area, address, or keyword…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Filters */}
            <div style={{
              background: "#0e0e0e", border: "1px solid #181818", borderRadius: 12,
              padding: "16px", marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Area</label>
                <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)}>
                  {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Type</label>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Max Price: <span style={{ color: "#FFBE3D" }}>${maxPrice}/day</span>
                </label>
                <input type="range" min={5} max={100} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
              </div>
              <div style={{ fontSize: 11, color: "#444" }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {filtered.map(l => (
                <ListingCard
                  key={l.id} listing={l} reviews={reviews}
                  onBook={setBookModal} onReview={setReviewModal}
                  onDelete={handleDelete}
                  isOwner={user && user.id === l.hostId}
                />
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#333", fontSize: 13 }}>
                  No listings match your filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Bookings</h2>
              <p style={{ color: "#555", fontSize: 12 }}>{user ? `${myBookings.length} booking${myBookings.length !== 1 ? "s" : ""}` : "Sign in to see your bookings"}</p>
            </div>
            {!user && <Btn variant="primary" onClick={() => setLoginModal(true)}>Sign In to View Bookings</Btn>}
            {user && myBookings.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 13 }}>No bookings yet.</div>
                <Btn variant="ghost" onClick={() => setTab("find")} style={{ marginTop: 16 }}>Find Parking →</Btn>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myBookings.map(b => (
                <div key={b.id} style={{
                  background: "#0e0e0e", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20,
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#eee", fontFamily: "'Syne', sans-serif" }}>{b.listingTitle}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                        padding: "2px 7px", borderRadius: 4,
                        background: b.status === "Confirmed" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                        color: b.status === "Confirmed" ? "#4ade80" : "#f87171",
                      }}>{b.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>📍 {b.address}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.days} day{b.days > 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>🚗 {b.vehicle}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#FFBE3D", fontFamily: "'Syne', sans-serif" }}>
                      ${b.total}
                    </div>
                    <div style={{ fontSize: 11, color: "#444", marginBottom: 10 }}>total</div>
                    {b.status === "Confirmed" && (
                      <Btn variant="danger" onClick={() => handleCancelBooking(b.id)} style={{ padding: "7px 12px", fontSize: 11 }}>
                        Cancel
                      </Btn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MY LISTINGS TAB ── */}
        {tab === "mylistings" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Listings</h2>
                <p style={{ color: "#555", fontSize: 12 }}>{user ? `${myListings.length} active listing${myListings.length !== 1 ? "s" : ""}` : "Sign in to manage listings"}</p>
              </div>
              <Btn variant="primary" onClick={() => setHostModal(true)}>+ Add Space</Btn>
            </div>
            {!user && <Btn variant="primary" onClick={() => setLoginModal(true)}>Sign In to Manage Listings</Btn>}
            {user && myListings.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🅿</div>
                <div style={{ fontSize: 13 }}>You haven't listed any spaces yet.</div>
                <Btn variant="primary" onClick={() => setHostModal(true)} style={{ marginTop: 16 }}>List Your Space →</Btn>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {myListings.map(l => {
                const lBookings = bookings.filter(b => b.listingId === l.id && b.status === "Confirmed");
                return (
                  <div key={l.id}>
                    <ListingCard listing={l} reviews={reviews} onBook={setBookModal} onReview={setReviewModal} onDelete={handleDelete} isOwner={true} />
                    {lBookings.length > 0 && (
                      <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8, padding: "10px 14px", marginTop: 8, fontSize: 12, color: "#4ade80" }}>
                        📅 {lBookings.length} active booking{lBookings.length > 1 ? "s" : ""}
                      </div>
                    )}
                    {/* Reviews for this listing */}
                    {reviews.filter(r => r.listingId === l.id).slice(-2).map(r => (
                      <div key={r.id} style={{ background: "#0e0e0e", border: "1px solid #181818", borderRadius: 8, padding: "10px 14px", marginTop: 6, fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Stars rating={r.rating} size={11} />
                          <span style={{ color: "#aaa" }}>{r.userName}</span>
                          <span style={{ color: "#444" }}>· {formatDate(r.date)}</span>
                        </div>
                        <span style={{ color: "#666" }}>{r.comment}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── BOOKING MODAL ── */}
      {bookModal && (
        <Modal title="Book This Space" onClose={() => setBookModal(null)}>
          <div style={{ background: "#0d0d0d", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#eee", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>{bookModal.title}</div>
            <div style={{ fontSize: 12, color: "#555" }}>📍 {bookModal.address}</div>
            <div style={{ fontSize: 12, color: "#FFBE3D", marginTop: 6, fontWeight: 700 }}>${bookModal.price}/day</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Check-In Date" type="date" value={bookForm.checkIn} min={today()}
                onChange={e => setBookForm(p => ({ ...p, checkIn: e.target.value }))} />
              <Input label="Check-Out Date" type="date" value={bookForm.checkOut} min={bookForm.checkIn}
                onChange={e => setBookForm(p => ({ ...p, checkOut: e.target.value }))} />
            </div>
            <Input label="Vehicle (plate or description)" placeholder="e.g. BC 123 ABC — Blue Honda" value={bookForm.vehicle}
              onChange={e => setBookForm(p => ({ ...p, vehicle: e.target.value }))} />

            {bookForm.checkIn && bookForm.checkOut && bookForm.checkOut >= bookForm.checkIn && (
              <div style={{ background: "rgba(255,190,61,0.05)", border: "1px solid rgba(255,190,61,0.2)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 4 }}>
                  <span>${bookModal.price} × {daysBetween(bookForm.checkIn, bookForm.checkOut)} day{daysBetween(bookForm.checkIn, bookForm.checkOut) > 1 ? "s" : ""}</span>
                  <span style={{ color: "#FFBE3D", fontWeight: 700, fontSize: 16 }}>
                    ${(bookModal.price * daysBetween(bookForm.checkIn, bookForm.checkOut)).toFixed(0)} total
                  </span>
                </div>
              </div>
            )}
            <Btn variant="primary" onClick={handleBook}>Confirm Booking</Btn>
          </div>
        </Modal>
      )}

      {/* ── REVIEW MODAL ── */}
      {reviewModal && (
        <Modal title="Leave a Review" onClose={() => setReviewModal(null)}>
          <div style={{ background: "#0d0d0d", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#eee", fontFamily: "'Syne', sans-serif" }}>{reviewModal.title}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 600 }}>Your Rating</label>
              <div style={{ display: "flex", gap: 4 }}>
                <Stars rating={reviewForm.rating} size={28} interactive onSet={r => setReviewForm(p => ({ ...p, rating: r }))} />
                <span style={{ color: "#FFBE3D", marginLeft: 8, fontSize: 14, fontWeight: 700 }}>{reviewForm.rating}/5</span>
              </div>
            </div>
            <Textarea label="Your Comment" placeholder="Tell others about your experience…" value={reviewForm.comment}
              onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} />
            <Btn variant="primary" onClick={handleReview}>Post Review</Btn>
          </div>
        </Modal>
      )}

      {/* ── HOST MODAL ── */}
      {hostModal && (
        <Modal title="List Your Parking Space" onClose={() => setHostModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Listing Title *" placeholder="e.g. Covered spot near YVR Terminal" value={hostForm.title}
              onChange={e => setHostForm(p => ({ ...p, title: e.target.value }))} />
            <Input label="Address *" placeholder="Street address, Vancouver / Richmond" value={hostForm.address}
              onChange={e => setHostForm(p => ({ ...p, address: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Neighborhood</label>
                <select value={hostForm.neighborhood} onChange={e => setHostForm(p => ({ ...p, neighborhood: e.target.value }))}>
                  {NEIGHBORHOODS.filter(n => n !== "All Areas").map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Spot Type</label>
                <select value={hostForm.type} onChange={e => setHostForm(p => ({ ...p, type: e.target.value }))}>
                  {TYPES.filter(t => t !== "All Types").map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <Input label="Daily Price (CAD) *" type="number" placeholder="e.g. 12" value={hostForm.price}
              onChange={e => setHostForm(p => ({ ...p, price: e.target.value }))} />
            <Input label="Amenities (comma separated)" placeholder="e.g. Covered, EV Charging, CCTV" value={hostForm.amenities}
              onChange={e => setHostForm(p => ({ ...p, amenities: e.target.value }))} />
            <Textarea label="Description" placeholder="Describe your space — access instructions, security, proximity to transit…" value={hostForm.description}
              onChange={e => setHostForm(p => ({ ...p, description: e.target.value }))} />
            <Btn variant="primary" onClick={handleHostSubmit}>Publish Listing</Btn>
          </div>
        </Modal>
      )}

      {/* ── LOGIN MODAL ── */}
      {loginModal && (
        <Modal title="Sign In to ParkYVR" onClose={() => setLoginModal(false)}>
          <p style={{ color: "#555", fontSize: 12, marginBottom: 20 }}>Enter your name to get started. No password needed for this demo.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Your Name" placeholder="e.g. Alex Chen" value={loginForm.name}
              onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>I am a…</label>
              <select value={loginForm.role} onChange={e => setLoginForm(p => ({ ...p, role: e.target.value }))}>
                <option value="driver">Driver — looking for parking</option>
                <option value="host">Host — listing my space</option>
              </select>
            </div>
            <Btn variant="primary" onClick={handleLogin} disabled={!loginForm.name.trim()}>Continue →</Btn>
          </div>
        </Modal>
      )}

      {/* ── TOAST ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}