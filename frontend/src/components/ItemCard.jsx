import { useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { imgUrl } from "@/api";
import { useAuth } from "@/context/AuthContext";

export default function ItemCard({ item, onLike, index = 0, featured = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cover = item.images?.[0];
  const rentedByYou = item.status === "rented" && item.rented_by === user?.user_id;
  const unavailable = item.status === "rented" && !rentedByYou;

  const heart = (
    <button
      onClick={(e) => { e.stopPropagation(); onLike?.(item); }}
      data-testid={`like-button-${item.id}`}
      className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform z-10"
    >
      <Heart className={`w-4 h-4 ${item.liked ? "text-volt" : "text-white"}`} fill={item.liked ? "#CCFF00" : "none"} />
    </button>
  );

  const statusBadge = (rentedByYou || unavailable) && (
    <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider z-10 backdrop-blur-md ${rentedByYou ? "bg-volt/20 text-volt border border-volt/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
      {rentedByYou ? "Rented by you" : "Not available"}
    </span>
  );

  if (featured) {
    return (
      <div
        onClick={() => navigate(`/item/${item.id}`)}
        data-testid={`item-card-${item.id}`}
        className="group col-span-2 relative h-60 rounded-3xl overflow-hidden border border-white/5 cursor-pointer active:scale-[0.99] transition-transform animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {cover ? (
          <img src={imgUrl(cover)} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : <div className="w-full h-full bg-zinc-800" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />
        {statusBadge}
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider z-10 bg-volt text-black" style={{ display: (rentedByYou || unavailable) ? "none" : "block" }}>Featured</span>
        {heart}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-heading font-bold text-xl leading-tight">{item.title}</h3>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-volt font-heading font-bold text-lg">${item.price_per_day}<span className="text-zinc-400 font-normal text-xs"> /day</span></span>
            {item.location?.city && (
              <span className="flex items-center gap-1 text-zinc-300 text-xs"><MapPin className="w-3.5 h-3.5" />{item.location.city}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/item/${item.id}`)}
      data-testid={`item-card-${item.id}`}
      className="group bg-[#121212] rounded-3xl border border-white/5 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-volt/30 active:scale-[0.98] animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        {cover ? (
          <img src={imgUrl(cover)} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : <div className="w-full h-full bg-zinc-800" />}
        {(rentedByYou || unavailable) && <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />}
        {statusBadge}
        {heart}
      </div>
      <div className="p-3">
        <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-1">{item.title}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-volt font-heading font-bold text-base">${item.price_per_day}<span className="text-zinc-500 font-normal text-[10px] uppercase tracking-wider"> /day</span></span>
          {item.location?.city && (
            <span className="flex items-center gap-0.5 text-zinc-500 text-[11px]"><MapPin className="w-3 h-3" />{item.location.city}</span>
          )}
        </div>
      </div>
    </div>
  );
}
