import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, imgUrl } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, ChevronRight, Heart, MapPin, Star, Calendar as CalIcon, Loader2, Building2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { catLabel } from "@/constants/categories";
import { toast } from "sonner";

function MapPreview({ location }) {
  const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const lat = location?.lat || 37.8719;
  const lng = location?.lng || -122.2585;
  let src;
  if (key) {
    src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lng}&zoom=14`;
  } else {
    const d = 0.01;
    src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  }
  return (
    <iframe title="map" src={src} className="w-full h-40 rounded-2xl border border-white/10" loading="lazy" data-testid="map-preview" />
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [range, setRange] = useState();
  const [showCal, setShowCal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/items/${id}`).then((r) => setItem(r.data)).catch(() => navigate("/"));
  }, [id, navigate]);

  if (!item) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 text-volt animate-spin" /></div>;
  }

  const isOwner = item.owner?.user_id === user?.user_id;
  const days = range?.from && range?.to ? Math.max(1, Math.round((range.to - range.from) / 86400000) + 1) : 0;
  const total = days * item.price_per_day;
  const images = item.images?.length ? item.images : [null];

  const toggleLike = async () => {
    setItem((p) => ({ ...p, liked: !p.liked }));
    try { await api.post(`/items/${id}/like`); } catch {}
  };

  const sendRequest = async () => {
    if (!range?.from || !range?.to) { toast.error("Pick a rental date range first"); return; }
    setSubmitting(true);
    try {
      await api.post("/requests", {
        item_id: id,
        start_date: range.from.toISOString().slice(0, 10),
        end_date: range.to.toISOString().slice(0, 10),
        total_price: total,
      });
      toast.success("Request sent! Chat with the owner from your Requests tab.");
      navigate("/requests");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not send request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32" data-testid="item-detail">
      {/* Carousel */}
      <div className="relative aspect-square bg-zinc-900">
        {images[imgIdx] ? (
          <img src={imgUrl(images[imgIdx])} alt={item.title} className="w-full h-full object-cover" />
        ) : <div className="w-full h-full bg-zinc-800" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-24" />
        <button onClick={() => navigate(-1)} data-testid="back-button" className="absolute top-5 left-4 w-10 h-10 rounded-full glass flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={toggleLike} data-testid="detail-like" className="absolute top-5 right-4 w-10 h-10 rounded-full glass flex items-center justify-center">
          <Heart className={`w-5 h-5 ${item.liked ? "text-volt" : "text-white"}`} fill={item.liked ? "#CCFF00" : "none"} />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)} className="absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setImgIdx((i) => (i + 1) % images.length)} className="absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => <span key={i} className={`h-1.5 rounded-full ${i === imgIdx ? "w-5 bg-volt" : "w-1.5 bg-white/40"}`} />)}
            </div>
          </>
        )}
      </div>

      <div className="px-4 pt-5 space-y-5 animate-slide-up">
        <div>
          <span className="text-xs uppercase tracking-widest text-volt">{catLabel(item.category)}</span>
          <div className="flex items-start justify-between gap-3 mt-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight">{item.title}</h1>
            <div className="text-right shrink-0">
              <p className="text-volt font-heading font-bold text-2xl">${item.price_per_day}</p>
              <p className="text-zinc-500 text-xs">per day</p>
            </div>
          </div>
          {item.department && (
            <p className="flex items-center gap-1.5 text-zinc-400 text-sm mt-2"><Building2 className="w-4 h-4 text-volt" />{item.department}</p>
          )}
        </div>

        {/* Owner */}
        <button onClick={() => navigate(`/user/${item.owner?.user_id}`)} data-testid="owner-card" className="w-full glass rounded-2xl p-3 flex items-center gap-3">
          <Avatar className="w-11 h-11"><AvatarImage src={item.owner?.picture} /><AvatarFallback className="bg-volt text-black">{item.owner?.name?.[0]}</AvatarFallback></Avatar>
          <div className="text-left">
            <p className="text-xs text-zinc-500">Owned by</p>
            <p className="font-semibold text-sm">{item.owner?.name}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500 ml-auto" />
        </button>

        <div>
          <h2 className="font-heading font-bold text-lg mb-1.5">About this item</h2>
          <p className="text-zinc-300 text-sm leading-relaxed">{item.description || "No description provided."}</p>
        </div>

        <div>
          <h2 className="font-heading font-bold text-lg mb-2">Pickup location</h2>
          <MapPreview location={item.location} />
        </div>

        {!isOwner && item.status === "available" && (
          <div>
            <h2 className="font-heading font-bold text-lg mb-2">Choose rental dates</h2>
            <button onClick={() => setShowCal((s) => !s)} data-testid="toggle-calendar" className="w-full glass rounded-2xl p-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><CalIcon className="w-4 h-4 text-volt" />{range?.from && range?.to ? `${range.from.toLocaleDateString()} → ${range.to.toLocaleDateString()}` : "Select date range"}</span>
              <ChevronRight className={`w-5 h-5 text-zinc-500 transition-transform ${showCal ? "rotate-90" : ""}`} />
            </button>
            {showCal && (
              <div className="mt-2 glass rounded-2xl p-2 flex justify-center" data-testid="date-picker">
                <Calendar mode="range" selected={range} onSelect={setRange} disabled={{ before: new Date() }} className="text-white" />
              </div>
            )}
            {days > 0 && (
              <div className="flex items-center justify-between mt-3 px-1" data-testid="price-summary">
                <span className="text-zinc-400 text-sm">{days} day{days > 1 ? "s" : ""} × ${item.price_per_day}</span>
                <span className="font-heading font-bold text-volt text-lg">${total}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pt-4 pb-16 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-40">
        {isOwner ? (
          <button onClick={() => navigate(`/edit/${item.id}`)} data-testid="edit-own-item" className="w-full bg-white/10 text-white font-bold rounded-2xl py-4 border border-white/10">Edit your listing</button>
        ) : item.status !== "available" ? (
          <button disabled className="w-full bg-white/5 text-zinc-500 font-bold rounded-2xl py-4">Currently unavailable</button>
        ) : (
          <button onClick={sendRequest} disabled={submitting} data-testid="send-request" className="w-full bg-volt text-black font-bold rounded-2xl py-4 glow flex items-center justify-center">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Request"}
          </button>
        )}
      </div>
    </div>
  );
}
