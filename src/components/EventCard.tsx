import React from 'react';
import { Calendar, MapPin, Ticket, Heart, Users, CheckCircle } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  isFavorite: boolean;
  onToggleFavorite: (eventId: string) => void;
  onSelectEvent: (event: Event) => void;
  onBookNow: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isFavorite,
  onToggleFavorite,
  onSelectEvent,
  onBookNow
}) => {
  const minPrice = Math.min(...event.ticketTypes.map(t => t.price));
  const isFree = minPrice === 0;

  return (
    <div className="group relative bg-[#0e0e0e] border border-zinc-800/90 hover:border-orange-400/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-orange-400/10 flex flex-col h-full">
      
      {/* Event Image Container */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-zinc-900">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-black/40" />

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md border border-orange-400/30 rounded-full text-[11px] font-bold text-orange-300">
          {event.category}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(event.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isFavorite 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
              : 'bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80'
          }`}
          title={isFavorite ? 'Remove from saved' : 'Save to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Seat / Capacity Badge */}
        {event.availableTickets < 50 && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-rose-500/90 text-white font-bold text-[10px] rounded-md animate-pulse">
            Only {event.availableTickets} tickets left!
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Organizer Header */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
            <span className="truncate">{event.organizer}</span>
            {event.organizerVerified && (
              <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
          </div>

          {/* Prominent Title */}
          <h3 
            onClick={() => onSelectEvent(event)}
            className="text-base sm:text-lg font-extrabold text-white group-hover:text-orange-300 transition-colors line-clamp-2 cursor-pointer leading-snug mb-3"
          >
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-2">
            <Calendar className="w-4 h-4 text-orange-300 shrink-0" />
            <span>{event.date} • {event.startTime}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-3">
            <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">{event.venue}, {event.city}</span>
          </div>
        </div>

        {/* Price & Primary CTA */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 mt-2">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Starting From</p>
            <p className="text-base sm:text-lg font-black text-white">
              {isFree ? (
                <span className="text-emerald-400 font-extrabold">FREE ENTRY</span>
              ) : (
                <span className="text-orange-300">₹{minPrice}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectEvent(event)}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all"
            >
              Details
            </button>
            <button
              onClick={() => onBookNow(event)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-black text-xs shadow-md shadow-orange-400/15 active:scale-95 transition-all"
            >
              Book Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
