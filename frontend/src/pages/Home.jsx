import { useEffect, useState, useRef } from "react";
import { api, imgUrl } from "@/api";
import { useAuth } from "@/context/AuthContext";
import ItemCard from "@/components/ItemCard";
import { CATEGORIES, SORTS } from "@/constants/categories";
import { Search, SlidersHorizontal, MapPin, RotateCw, X, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDERS = ["Search textbooks…", "Search scooters…", "Search cameras…", "Search dorm gear…"];
const PROMOS = [
  { t: "🎓 Finals Week Deals", s: "Up to 40% off study gear", c: "from-[#CCFF00]/20" },
  { t: "🚲 Move-in Mobility", s: "Scooters & bikes near you", c: "from-blue-500/20" },
  { t: "📸 Capture the moment", s: "Cameras for your next project", c: "from-fuchsia-500/20" },
];

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [promo, setPromo] = useState(0);
  const [locName, setLocName] = useState(user?.location?.city ? `${user.location.city}, ${user.location.state || ""}` : "Detecting location…");

  // typing placeholder
  useEffect(() => {
    let phrase = 0, char = 0, deleting = false, timer;
    const tick = () => {
      const full = PLACEHOLDERS[phrase];
      setPlaceholder(full.slice(0, char));
      if (!deleting && char < full.length) char++;
      else if (!deleting && char === full.length) { deleting = true; timer = setTimeout(tick, 1400); return; }
      else if (deleting && char > 0) char--;
      else { deleting = false; phrase = (phrase + 1) % PLACEHOLDERS.length; }
      timer = setTimeout(tick, deleting ? 40 : 90);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // promo auto-scroll
  useEffect(() => {
    const t = setInterval(() => setPromo((p) => (p + 1) % PROMOS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/items", { params: { category, sort, q: q || undefined } });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); /* eslint-disable-next-line */ }, [category, sort]);
  useEffect(() => {
    const t = setTimeout(fetchItems, 350);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [q]);

  const detectLocation = () => {
    setLocName("Detecting location…");
    if (!navigator.geolocation) { setLocName("Location unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      () => setLocName(user?.location?.city ? `${user.location.city}, ${user.location.state || ""}` : "Berkeley, CA"),
      () => setLocName("Location blocked · retry")
    );
  };

  const toggleLike = async (item) => {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, liked: !i.liked } : i));
    try { await api.post(`/items/${item.id}/like`); } catch {}
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl px-4 pt-5 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2" data-testid="location-banner">
            <div className="w-9 h-9 rounded-full bg-volt/15 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-volt" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Your campus</p>
              <button onClick={detectLocation} data-testid="retry-location" className="flex items-center gap-1 text-sm font-semibold">
                {locName}<RotateCw className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full glass flex items-center justify-center" data-testid="notifications-button">
            <Bell className="w-5 h-5 text-zinc-300" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-volt focus-within:glow transition-all">
            <Search className="w-5 h-5 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              data-testid="search-input"
              className="bg-transparent outline-none text-sm w-full placeholder:text-zinc-500"
            />
          </div>
          <button
            onClick={() => setShowFilter(true)}
            data-testid="filter-button"
            className="w-12 h-12 rounded-2xl bg-volt text-black flex items-center justify-center active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Promo carousel */}
        <div className="relative h-28 rounded-3xl overflow-hidden" data-testid="promo-carousel">
          {PROMOS.map((p, i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-gradient-to-r ${p.c} to-[#121212] border border-white/10 rounded-3xl p-5 flex flex-col justify-center transition-opacity duration-700 ${i === promo ? "opacity-100" : "opacity-0"}`}
            >
              <h3 className="font-heading font-bold text-lg">{p.t}</h3>
              <p className="text-sm text-zinc-300">{p.s}</p>
            </div>
          ))}
          <div className="absolute bottom-3 left-5 flex gap-1.5">
            {PROMOS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === promo ? "w-5 bg-volt" : "w-1.5 bg-white/30"}`} />
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" data-testid="category-scroll">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                data-testid={`category-${c.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${active ? "bg-volt text-black glow" : "bg-white/5 text-zinc-300 border border-white/10"}`}
              >
                <c.icon className="w-4 h-4" />{c.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-3xl bg-white/5" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-feed">
            <p className="text-zinc-400 font-heading text-lg">Nothing here yet</p>
            <p className="text-zinc-600 text-sm mt-1">Try a different category or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-4" data-testid="item-grid">
            {items.map((item, i) => <ItemCard key={item.id} item={item} onLike={toggleLike} index={i} />)}
          </div>
        )}
      </div>

      {/* Filter modal */}
      <Dialog open={showFilter} onOpenChange={setShowFilter}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-3xl max-w-sm" data-testid="filter-modal">
          <DialogHeader>
            <DialogTitle className="font-heading">Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)} data-testid={`filter-category-${c.id}`}
                    className={`px-3 py-1.5 rounded-full text-sm ${category === c.id ? "bg-volt text-black" : "bg-white/5 text-zinc-300 border border-white/10"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Sort by</p>
              <div className="flex flex-col gap-2">
                {SORTS.map((s) => (
                  <button key={s.id} onClick={() => setSort(s.id)} data-testid={`filter-sort-${s.id}`}
                    className={`px-4 py-2.5 rounded-2xl text-sm text-left ${sort === s.id ? "bg-volt text-black" : "bg-white/5 text-zinc-300 border border-white/10"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowFilter(false)} data-testid="apply-filters"
              className="w-full bg-volt text-black font-bold rounded-2xl py-3 glow">Apply</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
