import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, imgUrl } from "@/api";
import { ChevronLeft, Pencil, Trash2, Plus, Loader2, PackageOpen } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { catLabel } from "@/constants/categories";

export default function MyListings() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delTarget, setDelTarget] = useState(null);

  const fetchItems = () => api.get("/my-listings").then((r) => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { fetchItems(); }, []);

  const del = async () => {
    try {
      await api.delete(`/items/${delTarget.id}`);
      toast.success("Listing deleted");
      setItems((p) => p.filter((i) => i.id !== delTarget.id));
    } catch { toast.error("Failed to delete"); }
    setDelTarget(null);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl px-4 py-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full glass flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="font-heading text-xl font-bold">My Listings</h1>
        <button onClick={() => navigate("/post")} data-testid="add-listing" className="ml-auto w-9 h-9 rounded-full bg-volt text-black flex items-center justify-center"><Plus className="w-5 h-5" /></button>
      </div>

      <div className="px-4 pt-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-volt animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-listings">
            <PackageOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-heading text-lg">No listings yet</p>
            <button onClick={() => navigate("/post")} className="mt-4 bg-volt text-black font-bold rounded-2xl px-6 py-3 glow">Post your first item</button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-[#121212] rounded-3xl border border-white/5 p-3 flex gap-3 items-center animate-fade-in" data-testid={`my-item-${item.id}`}>
                <img src={imgUrl(item.images?.[0])} alt="" className="w-16 h-16 rounded-2xl object-cover bg-zinc-800" onClick={() => navigate(`/item/${item.id}`)} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-zinc-500">{catLabel(item.category)} · <span className="text-volt">${item.price_per_day}/day</span></p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full capitalize ${item.status === "available" ? "bg-volt/15 text-volt" : "bg-amber-500/15 text-amber-400"}`}>{item.status}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate(`/edit/${item.id}`)} data-testid={`edit-${item.id}`} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Pencil className="w-4 h-4 text-zinc-300" /></button>
                  <button onClick={() => setDelTarget(item)} data-testid={`delete-${item.id}`} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent className="bg-[#121212] border-white/10 text-white rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete listing?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">"{delTarget?.title}" will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={del} data-testid="confirm-delete" className="bg-red-500 text-white rounded-2xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
