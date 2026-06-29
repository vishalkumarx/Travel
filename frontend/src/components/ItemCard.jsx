import { useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { imgUrl } from "@/api";
import { useAuth } from "@/context/AuthContext";

export default function ItemCard({ item, onLike, index = 0 }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cover = item.images?.[0];
  const rentedByYou = item.status === "rented" && item.rented_by === user?.user_id;
  const unavailable = item.status === "rented" && !rentedByYou;

  return (
    <div
      onClick={() => navigate(`/item/${item.id}`)}
      data-testid={`item-card-${item.id}`}
      className="bg-[#121212] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-square overflow-hidden">
        {cover ? (
          <img src={imgUrl(cover)} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-800" />
        )}
        {(rentedByYou || unavailable) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${rentedByYou ? "bg-volt text-black" : "bg-white/15 text-white"}`}>
              {rentedByYou ? "Rented by you" : "Not available"}
            </span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onLike?.(item); }}
          data-testid={`like-button-${item.id}`}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full glass flex items-center justify-center active:scale-90 transition-transform"
        >
          <Heart className={`w-4 h-4 ${item.liked ? "text-volt" : "text-white"}`} fill={item.liked ? "#CCFF00" : "none"} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-1">{item.title}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-volt font-bold text-sm">${item.price_per_day}<span className="text-zinc-500 font-normal text-xs">/day</span></span>
          {item.location?.city && (
            <span className="flex items-center gap-0.5 text-zinc-500 text-[11px]">
              <MapPin className="w-3 h-3" />{item.location.city}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
