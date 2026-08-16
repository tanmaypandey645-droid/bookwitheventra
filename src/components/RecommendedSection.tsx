import React, { useState } from 'react';
import { Event, RecommendedEvent, User } from '../types';
import { Sparkles, ThumbsDown, Calendar, MapPin, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { RecommendationEngine } from '../services/recommendationEngine';
import { StorageService } from '../services/storage';

interface RecommendedSectionProps {
  recommendedEvents: RecommendedEvent[];
  currentUser: User;
  onSelectEvent: (event: Event) => void;
  onBookEvent: (event: Event) => void;
  onPlanSquad: (event: Event) => void;
  onToggleFavorite: (eventId: string) => void;
  favorites: string[];
  onRefreshRecommendations: () => void;
  userBookingsCount?: number;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  recommendedEvents,
  currentUser,
  onSelectEvent,
  onBookEvent,
  onPlanSquad,
  onToggleFavorite,
  favorites,
  onRefreshRecommendations,
  userBookingsCount,
}) => {
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const isGuest = !currentUser || currentUser.id === 'guest';
  const effectiveBookingsCount = userBookingsCount !== undefined
    ? userBookingsCount
    : (isGuest ? 0 : StorageService.getBookings().filter(b => b.userId === currentUser.id || b.userEmail === currentUser.email).length);

  // Don't show recommendations if the user has not booked at least 1 ticket yet
  if (effectiveBookingsCount < 1 || recommendedEvents.length === 0) {
    return null;
  }

  const handleDislike = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setDislikedIds(prev => [...prev, event.id]);
    RecommendationEngine.trackInteraction(currentUser.id, event.id, 'DISLIKE', event);
    onRefreshRecommendations();
  };

  // Limit to exactly 4 events
  const visibleEvents = recommendedEvents
    .filter(r => !dislikedIds.includes(r.event.id))
    .slice(0, 4);

  if (visibleEvents.length === 0) return null;

  return (
    <section className="bg-zinc-950/80 border border-zinc-800/70 rounded-2xl p-3 sm:p-4 space-y-2.5 relative overflow-hidden shadow-md">
      {/* Background Accent Subtle Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar - Secondary & Compact */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shrink-0">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                Recommended For You
              </h3>
              <span className="px-2 py-0.2 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] font-semibold text-orange-300">
                Personalized
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Curated based on your {effectiveBookingsCount} past event booking{effectiveBookingsCount > 1 ? 's' : ''} & preferences
            </p>
          </div>
        </div>

        {/* Engine Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          title="Algorithm details"
          className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all text-xs flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span className="hidden sm:inline text-[10px] font-medium">Smart AI</span>
        </button>
      </div>

      {/* Engine Details Popup if toggled */}
      {showSettings && (
        <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs space-y-1.5 text-zinc-300 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px] font-bold text-white">
            <span>✨ Eventra Smart Discovery Engine</span>
            <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            Learns securely from your bookings (+10), squad outings (+8), saved events (+8), and viewing time. Disliking an event refines future suggestions immediately.
          </p>
        </div>
      )}

      {/* Fixed 4-Card Responsive Grid without Horizontal Scrolling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-0.5">
        {visibleEvents.map(({ event, score, reason, isExploration }) => {
          const minPrice = Math.min(...event.ticketTypes.map(t => t.price));
          const isFree = minPrice === 0;

          return (
            <div
              key={event.id}
              onClick={() => {
                RecommendationEngine.trackInteraction(currentUser.id, event.id, 'CLICK', event);
                onSelectEvent(event);
              }}
              className="group relative w-full bg-[#0c0c0f] border border-zinc-800/90 hover:border-orange-400/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:shadow-orange-400/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              {/* Compact Event Thumbnail Image */}
              <div className="relative h-24 sm:h-28 w-full bg-zinc-900 overflow-hidden shrink-0">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0f] via-black/20 to-transparent" />

                {/* Compact Category Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-zinc-700/80 text-[9px] font-bold text-amber-300 uppercase tracking-wide">
                    {event.category}
                  </span>
                </div>

                {/* Dismiss/Dislike Button */}
                <button
                  title="Not interested"
                  onClick={(e) => handleDislike(e, event)}
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/70 hover:bg-rose-500/80 text-zinc-400 hover:text-white transition-colors"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>

                {/* AI Reason Micro-Badge */}
                <div className="absolute bottom-1.5 left-2 right-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-orange-300 truncate max-w-full bg-zinc-950/90 px-1.5 py-0.5 rounded border border-orange-500/20">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                    <span className="truncate">{reason}</span>
                  </span>
                </div>
              </div>

              {/* Compact Information Body */}
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-extrabold text-white text-xs group-hover:text-orange-300 transition-colors line-clamp-1 leading-snug">
                    {event.title}
                  </h4>

                  <div className="space-y-0.5 text-[10px] text-zinc-400 mt-1">
                    <p className="flex items-center gap-1 truncate">
                      <Calendar className="w-3 h-3 text-orange-400 shrink-0" />
                      <span className="truncate">{event.date}</span>
                    </p>
                    <p className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{event.venue}, {event.city}</span>
                    </p>
                  </div>
                </div>

                {/* Compact Price & CTA Row */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase">Price</span>
                    <span className="text-xs font-black text-white">
                      {isFree ? (
                        <span className="text-emerald-400 font-extrabold">FREE</span>
                      ) : (
                        <span className="text-orange-300">₹{minPrice}</span>
                      )}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      RecommendationEngine.trackInteraction(currentUser.id, event.id, 'BOOKING_STARTED', event);
                      onBookEvent(event);
                    }}
                    className="py-1 px-2.5 bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-black text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-all"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
