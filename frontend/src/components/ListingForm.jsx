import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, imgUrl } from "@/api";
import { CATEGORIES } from "@/constants/categories";
import { ChevronLeft, Camera, X, AlertTriangle, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ListingForm({ initial, mode = "create" }) {
  const navigate = useNavigate();
  const [images, setImages] = useState(initial?.images || []);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(initial?.title || "");
  const [category, setCategory] = useState(initial?.category || "textbooks");
  const [price, setPrice] = useState(initial?.price_per_day || "");
  const [city, setCity] = useState(initial?.location?.city || "");
  const [state, setState] = useState(initial?.location?.state || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - images.length);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setImages((prev) => [...prev, res.data.path]);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImg = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!title || !price) { toast.error("Title and price are required"); return; }
    setSaving(true);
    const payload = {
      title, category, price_per_day: parseFloat(price), description,
      location: { city, state, lat: 37.8719, lng: -122.2585 },
      images,
    };
    try {
      if (mode === "create") {
        await api.post("/items", payload);
        toast.success("Listing published!");
        navigate("/my-listings");
      } else {
        await api.put(`/items/${initial.id}`, payload);
        toast.success("Listing updated!");
        navigate("/my-listings");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl px-4 py-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full glass flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="font-heading text-xl font-bold">{mode === "create" ? "Post a listing" : "Edit listing"}</h1>
      </div>

      <div className="px-4 pt-5 space-y-5 animate-fade-in">
        {/* Photos */}
        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500">Photos (first = cover)</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10" data-testid={`photo-${i}`}>
                <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 bg-volt text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">COVER</span>}
                <button onClick={() => removeImg(i)} data-testid={`remove-photo-${i}`} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {images.length < 3 && (
              <label data-testid="upload-photo" className="aspect-square rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer hover:border-volt/50 transition-colors">
                {uploading ? <Loader2 className="w-6 h-6 text-volt animate-spin" /> : <><Camera className="w-6 h-6 text-zinc-500" /><Plus className="w-3 h-3 text-zinc-500 -mt-1" /></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="listing-title" placeholder="e.g. Calculus Textbook 8th Ed." className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500">Category</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)} data-testid={`cat-opt-${c.id}`} className={`px-3 py-1.5 rounded-full text-sm ${category === c.id ? "bg-volt text-black" : "bg-white/5 border border-white/10 text-zinc-300"}`}>{c.label}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500">Price / day ($)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" data-testid="listing-price" placeholder="10" className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} data-testid="listing-city" placeholder="Berkeley" className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-zinc-500">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="listing-description" rows={4} placeholder="Condition, what's included, pickup details…" className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt resize-none" />
        </div>

        <div className="glass rounded-2xl p-3 flex gap-3 border-amber-500/20" data-testid="prohibited-warning">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-300">No alcohol, weapons, illegal substances, or counterfeit goods. Listings violating campus policy will be removed.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pt-4 pb-16 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-40">
        <button onClick={submit} disabled={saving} data-testid="publish-button" className="w-full bg-volt text-black font-bold rounded-2xl py-4 glow flex items-center justify-center">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "create" ? "Publish Listing" : "Save Changes")}
        </button>
      </div>
    </div>
  );
}
