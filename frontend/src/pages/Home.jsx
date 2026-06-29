import { useEffect, useState } from "react";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import ItemCard from "@/components/ItemCard";
import { CATEGORIES, SORTS } from "@/constants/categories";
import { Search, SlidersHorizontal, MapPin, ChevronDown, Bell, ArrowRight, Flame } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDERS = ["Search textbooks…", "Search scooters…", "Search cameras…", "Search dorm gear…"];
const PROMOS = [
  { title: "Campus Commute", subtitle: "Rent e-scooters from $5/day", badge: "Mobility", url: "https://images.unsplash.com/photo-1778735790178-f2d243a914d9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Zone out. Study in.", subtitle: "Premium noise-cancelling gear", badge: "Electronics", url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { title: "Finals Week Deals", subtitle: "Up to 40% off study essentials", badge: "Hot", url: "https://images.unsplash.com/photo-1620287920810-3f5b9746380c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
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
  const [locName, setLocName] = useState(user?.location?.city ? `${user.location.city}, ${user.location.state || ""}` : "Berkeley, CA");

  const firstName = user?.name?.split(" ")[0] || "there";

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

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/items", { params: { category, sort, q: q || undefined } });
      setItems(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); /* eslint-disable-next-line */ }, [category, sort]);
  useEffect(() => { const t = setTimeout(fetchItems, 350); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q]);

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocName("Location unavailable"); return; }
    setLocName("Detecting…");
    navigator.geolocation.getCurrentPosition(
      () => setLocName(user?.location?.city ? `${user.location.city}, ${user.location.state || ""}` : "Berkeley, CA"),
      () => setLocName("Berkeley, CA")
    );
  };

  const toggleLike = async (item) => {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, liked: !i.liked } : i));
    try { await api.post(`/items/${item.id}/like`); } catch {}
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 pt-6 pb-4 flex flex-col gap-4 backdrop-blur-xl bg-[#050505]/80 border-b border-white/5">
        <div className="flex justify-between items-center">
          <button onClick={detectLocation} data-testid="home-location-dropdown" className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            <MapPin className="w-4 h-4 text-volt" />{locName}<ChevronDown className="w-4 h-4 text-zinc-500" />
          </button>
          <button data-testid="home-notification-bell" className="relative p-2.5 rounded-full bg-[#121212] border border-white/5">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-volt" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-zinc-400 font-medium">Hey {firstName} 👋</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">What do you need today?</h1>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-volt/50 transition-colors">
            <Search className="w-5 h-5 text-zinc-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} data-testid="home-search-input" className="bg-transparent outline-none text-sm w-full placeholder:text-zinc-500" />
          </div>
          <button onClick={() => setShowFilter(true)} data-testid="home-filter-button" className="p-3.5 bg-[#121212] border border-white/10 rounded-2xl text-white hover:border-volt/50 hover:text-volt transition-all">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Promo carousel — full-bleed horizontal snap */}
      <div className="w-full overflow-hidden mt-3">
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 gap-4 pb-1" data-testid="promo-carousel">
          {PROMOS.map((p, i) => (
            <div key={i} className="min-w-[85%] h-44 rounded-3xl relative overflow-hidden snap-center shrink-0 border border-white/10 flex items-end p-5">
              <img src={p.url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
              <div className="relative z-10 flex flex-col gap-2 w-full">
                <span className="px-2.5 py-1 bg-volt text-black text-[10px] font-bold uppercase rounded-full self-start tracking-wider">{p.badge}</span>
                <h3 className="font-heading font-bold text-xl leading-tight">{p.title}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-300">{p.subtitle}</p>
                  <ArrowRight className="w-5 h-5 text-volt" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 overflow-x-auto no-scrollbar flex gap-2.5 items-center" data-testid="category-scroll">
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <button key={c.id} onClick={() => setCategory(c.id)} data-testid={`category-${c.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-sm font-semibold transition-all ${active ? "border border-volt bg-volt/10 text-volt" : "border border-white/10 bg-[#121212] text-zinc-400 hover:bg-white/5"}`}>
              <c.icon className="w-4 h-4" />{c.label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div className="px-4 pt-2 pb-4 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h2 className="font-heading text-xl font-bold tracking-tight flex items-center gap-2"><Flame className="w-5 h-5 text-volt" />Near you</h2>
          <span className="text-sm text-zinc-500 font-medium">{items.length} items</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3.5">
            <Skeleton className="col-span-2 h-60 rounded-3xl bg-white/5" />
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-3xl bg-white/5" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-feed">
            <p className="text-zinc-400 font-heading text-lg">Nothing here yet</p>
            <p className="text-zinc-600 text-sm mt-1">Try a different category or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5" data-testid="item-grid">
            {items.map((item, i) => <ItemCard key={item.id} item={item} onLike={toggleLike} index={i} featured={i === 0} />)}
          </div>
        )}
      </div>

      {/* Filter modal */}
      <Dialog open={showFilter} onOpenChange={setShowFilter}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-3xl max-w-sm" data-testid="filter-modal">
          <DialogHeader><DialogTitle className="font-heading">Filters</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)} data-testid={`filter-category-${c.id}`}
                    className={`px-3 py-1.5 rounded-full text-sm ${category === c.id ? "bg-volt text-black" : "bg-white/5 text-zinc-300 border border-white/10"}`}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Sort by</p>
              <div className="flex flex-col gap-2">
                {SORTS.map((s) => (
                  <button key={s.id} onClick={() => setSort(s.id)} data-testid={`filter-sort-${s.id}`}
                    className={`px-4 py-2.5 rounded-2xl text-sm text-left ${sort === s.id ? "bg-volt text-black" : "bg-white/5 text-zinc-300 border border-white/10"}`}>{s.label}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowFilter(false)} data-testid="apply-filters" className="w-full bg-volt text-black font-bold rounded-2xl py-3 glow">Apply</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
