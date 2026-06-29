import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Heart, LogOut, Pencil, MapPin, CalendarDays, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [favs, setFavs] = useState([]);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [city, setCity] = useState(user?.location?.city || "");
  const [state, setState] = useState(user?.location?.state || "");
  const [prefs, setPrefs] = useState(user?.notification_prefs || { requests: true, messages: true, promos: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/favorites").then((r) => setFavs(r.data)).catch(() => {}); }, []);
  const [stats, setStats] = useState(null);
  useEffect(() => { if (user?.user_id) api.get(`/stats/${user.user_id}`).then((r) => setStats(r.data)).catch(() => {}); }, [user?.user_id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", { name, bio, location: { city, state, lat: 37.8719, lng: -122.2585 }, notification_prefs: prefs });
      setUser(res.data);
      toast.success("Profile updated");
      setEdit(false);
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  const togglePref = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try { const res = await api.put("/auth/profile", { notification_prefs: next }); setUser(res.data); } catch {}
  };

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen" data-testid="profile-page">
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 ring-2 ring-volt/30"><AvatarImage src={user?.picture} /><AvatarFallback className="bg-volt text-black text-2xl">{user?.name?.[0]}</AvatarFallback></Avatar>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold">{user?.name}</h1>
            <p className="text-sm text-zinc-500">{user?.email}</p>
            <div className="flex gap-3 mt-1 text-xs text-zinc-400">
              {user?.location?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user.location.city}</span>}
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />Joined {joinDate}</span>
            </div>
          </div>
        </div>
        {user?.bio && <p className="text-sm text-zinc-300 mt-3">{user.bio}</p>}
        <button onClick={() => setEdit(true)} data-testid="edit-profile" className="w-full mt-4 bg-white/5 border border-white/10 rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2"><Pencil className="w-4 h-4" />Edit Profile</button>
      </div>

      <div className="px-4 space-y-3">
        <div className="flex gap-3" data-testid="profile-stats">
          <div className="flex-1 glass rounded-2xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Reliability</span>
            <p className={`font-heading font-bold text-xl mt-1 ${stats?.reliability_score == null ? "text-zinc-400" : stats.reliability_score >= 90 ? "text-volt" : stats.reliability_score >= 70 ? "text-amber-400" : "text-red-400"}`}>{stats?.reliability_score == null ? "New" : `${stats.reliability_score}%`}</p>
          </div>
          <div className="flex-1 glass rounded-2xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Bookings</span>
            <p className="font-heading font-bold text-xl mt-1">{stats?.accepted_bookings ?? 0}</p>
          </div>
          <div className="flex-1 glass rounded-2xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Cancels</span>
            <p className="font-heading font-bold text-xl mt-1">{stats?.cancellations ?? 0}</p>
          </div>
        </div>

        <button onClick={() => navigate("/my-listings")} data-testid="goto-listings" className="w-full glass rounded-2xl p-4 flex items-center gap-3"><Package className="w-5 h-5 text-volt" /><span className="font-semibold text-sm">My Listings</span><ChevronRight className="w-5 h-5 text-zinc-500 ml-auto" /></button>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Heart className="w-5 h-5 text-volt" /><span className="font-semibold text-sm">Favorites</span><span className="text-xs text-zinc-500 ml-auto">{favs.length}</span></div>
          {favs.length === 0 ? <p className="text-xs text-zinc-500">No favorites yet</p> : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {favs.map((f) => <img key={f.id} src={api && f.images?.[0] ? (f.images[0].startsWith("http") ? f.images[0] : `${process.env.REACT_APP_BACKEND_URL}/api/files/${f.images[0]}`) : ""} onClick={() => navigate(`/item/${f.id}`)} alt="" className="w-16 h-16 rounded-xl object-cover bg-zinc-800 shrink-0" />)}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="font-semibold text-sm mb-3">Notification preferences</p>
          {[{ k: "requests", l: "Booking requests" }, { k: "messages", l: "New messages" }, { k: "promos", l: "Promotions" }].map((p) => (
            <div key={p.k} className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-300">{p.l}</span>
              <Switch checked={prefs[p.k]} onCheckedChange={() => togglePref(p.k)} data-testid={`pref-${p.k}`} />
            </div>
          ))}
        </div>

        <button onClick={logout} data-testid="logout-button" className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 mb-4"><LogOut className="w-4 h-4" />Log out</button>
      </div>

      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-3xl max-w-sm" data-testid="edit-profile-dialog">
          <DialogHeader><DialogTitle className="font-heading">Edit profile</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} data-testid="edit-name" placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} data-testid="edit-bio" rows={2} placeholder="Bio" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <input value={city} onChange={(e) => setCity(e.target.value)} data-testid="edit-city" placeholder="City" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
              <input value={state} onChange={(e) => setState(e.target.value)} data-testid="edit-state" placeholder="State" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
            </div>
            <button onClick={save} disabled={saving} data-testid="save-profile" className="w-full bg-volt text-black font-bold rounded-2xl py-3 glow flex items-center justify-center">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
