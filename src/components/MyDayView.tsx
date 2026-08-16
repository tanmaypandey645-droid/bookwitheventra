import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Ticket, Navigation, CheckCircle2, QrCode, Sparkles, ChevronRight, Share2 } from 'lucide-react';
import { Booking, OutingPlan, Event } from '../types';
import { EventDayMap } from './EventDayMap';
import { StorageService } from '../services/storage';

interface MyDayViewProps {
  bookings: Booking[];
  plans: OutingPlan[];
  events?: Event[];
  onOpenTicket: (booking: Booking) => void;
  onExploreEvents: () => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({
  bookings,
  plans,
  events,
  onOpenTicket,
  onExploreEvents
}) => {
  const [selectedBookingIndex, setSelectedBookingIndex] = useState(0);

  // Available confirmed bookings
  const confirmedBookings = bookings.filter(b => b.bookingStatus !== 'Cancelled');
  const activeBooking = confirmedBookings[selectedBookingIndex] || confirmedBookings[0];

  // Resolve corresponding full Event object for location coordinates and rich venue data
  const allEvents = events || StorageService.getEvents();
  const matchedEvent: Event | undefined = activeBooking 
    ? allEvents.find(e => e.id === activeBooking.eventId)
    : undefined;

  // Synthesize rich Event object if not found in cache
  const activeEvent: Event | null = activeBooking ? (matchedEvent || {
    id: activeBooking.eventId,
    title: activeBooking.eventTitle,
    description: 'Upcoming confirmed college event.',
    category: activeBooking.eventCategory || 'College Fest',
    image: activeBooking.eventImage,
    date: activeBooking.eventDate,
    startTime: activeBooking.eventTime.split('-')[0]?.trim() || '10:00 AM',
    endTime: activeBooking.eventTime.split('-')[1]?.trim() || '08:00 PM',
    venue: activeBooking.eventVenue,
    venueName: activeBooking.eventVenue,
    city: activeBooking.eventCity,
    address: activeBooking.eventAddress || `${activeBooking.eventVenue}, ${activeBooking.eventCity}`,
    latitude: activeBooking.eventLatitude || 28.7523,
    longitude: activeBooking.eventLongitude || 77.4988,
    organizer: 'Verified College Organizer',
    organizerVerified: true,
    ticketTypes: [],
    capacity: 1000,
    availableTickets: 200,
    interestsCount: 500,
    schedule: [],
    createdAt: activeBooking.createdAt
  }) : null;

  // Matching squad outing plan
  const relatedPlan = activeBooking 
    ? plans.find(p => p.eventId === activeBooking.eventId) 
    : plans[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-400/15 via-amber-400/10 to-transparent p-6 sm:p-8 rounded-3xl border border-orange-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-orange-400/15 text-orange-300 border border-orange-400/30 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              LIVE DAY DASHBOARD
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">MY EVENT DAY</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Your personal event day companion: live venue map, squad meeting point, itinerary, and instant digital pass.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-right shrink-0">
          <p className="text-[10px] text-zinc-500 font-bold uppercase">TODAY'S DATE</p>
          <p className="text-sm font-extrabold text-amber-300 font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Multiple Bookings Switcher (If user has booked > 1 event) */}
      {confirmedBookings.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 bg-zinc-900/70 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-bold text-zinc-400 pl-2 shrink-0">Your Passes:</span>
          {confirmedBookings.map((b, idx) => (
            <button
              key={b.bookingId}
              onClick={() => setSelectedBookingIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                activeBooking?.bookingId === b.bookingId
                  ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 shadow-md shadow-orange-400/15 font-black'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>{b.eventTitle.slice(0, 22)}...</span>
              <span className="text-[10px] opacity-75 font-mono">({b.bookingId.slice(-4)})</span>
            </button>
          ))}
        </div>
      )}

      {activeBooking && activeEvent ? (
        <div className="space-y-6">
          
          {/* ========================================================================= */}
          {/* 1. EVENT INFORMATION CARD */}
          {/* ========================================================================= */}
          <div className="bg-[#0e0e12] border border-orange-400/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative w-full md:w-52 h-48 sm:h-52 rounded-2xl overflow-hidden shrink-0 border border-zinc-800 shadow-md">
                <img
                  src={activeBooking.eventImage}
                  alt={activeBooking.eventTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-400/30">
                    {activeBooking.eventCategory}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3.5 w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed Pass
                    </span>
                    <span className="font-mono text-xs text-orange-300 font-bold bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                      {activeBooking.bookingId}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-zinc-400">
                    {activeBooking.ticketTypeName} (Qty: {activeBooking.quantity})
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeBooking.eventTitle}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300 font-semibold pt-1">
                  <div className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                    <Clock className="w-4 h-4 text-orange-300 shrink-0" />
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Date & Timing</p>
                      <p className="text-white font-bold">{activeBooking.eventDate} • {activeBooking.eventTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                    <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Event Venue</p>
                      <p className="text-white font-bold truncate">{activeBooking.eventVenue}, {activeBooking.eventCity}</p>
                    </div>
                  </div>
                </div>

                {activeBooking.seatNumbers && activeBooking.seatNumbers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-300 bg-orange-400/10 p-2.5 rounded-xl border border-orange-400/20">
                    <span>🪑 Reserved Seats:</span>
                    <span className="font-mono font-black text-amber-300">{activeBooking.seatNumbers.join(', ')}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onOpenTicket(activeBooking)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 flex items-center gap-2 hover:brightness-105 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Open QR Pass</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeEvent.latitude},${activeEvent.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 border border-zinc-700 transition-all"
                  >
                    <Navigation className="w-4 h-4 text-orange-300" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. INTERACTIVE EVENT DAY MAP (Venue + Squad Meeting Point + Route + GPS)  */}
          {/* ========================================================================= */}
          <EventDayMap
            event={activeEvent}
            plan={relatedPlan}
          />

          {/* ========================================================================= */}
          {/* 3. SQUAD MEETING POINT & OUTING COORDINATION */}
          {/* ========================================================================= */}
          {relatedPlan ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-300 font-bold text-xs">
                  <Users className="w-4 h-4" />
                  <span>SQUAD OUTING COORDINATION</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-zinc-400">
                  {relatedPlan.friends.length} Squad Mates
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
                    SQUAD MEETING POINT
                  </p>
                  <p className="font-extrabold text-white text-sm mt-1">{relatedPlan.meetingPoint}</p>
                  {relatedPlan.meetingPointLocation?.address && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{relatedPlan.meetingPointLocation.address}</p>
                  )}
                </div>

                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300 inline-block" />
                    MEETING TIME
                  </p>
                  <p className="font-extrabold text-amber-300 text-sm mt-1 font-mono">{relatedPlan.meetingTime}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Meet before heading into the event venue</p>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 4. SQUAD INFORMATION & ATTENDEES */}
              {/* ========================================================================= */}
              <div>
                <p className="text-xs font-bold text-zinc-400 mb-2">Squad Members Attending ({relatedPlan.friends.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {relatedPlan.friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img src={friend.avatar} alt={friend.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{friend.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{friend.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                        friend.status === 'Accepted'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {friend.status === 'Accepted' ? '✓ In' : '○ Inv'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {relatedPlan.notes && (
                <div className="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl text-xs text-amber-300">
                  📝 <strong>Squad Notes:</strong> {relatedPlan.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 text-center space-y-2">
              <Users className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-extrabold text-white">No Squad Outing Created Yet</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Coordinate with your college friends by creating an outing plan with a designated meeting spot and time.
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. TICKET INFORMATION & QUICK ACCESS PASS */}
          {/* ========================================================================= */}
          <div className="bg-[#0b0b0f] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
                <Ticket className="w-4 h-4 text-orange-400" />
                <span>OFFICIAL DIGITAL PASS DETAILS</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                Status: Verified
              </span>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Pass Type: <strong className="text-white">{activeBooking.ticketTypeName}</strong></p>
                <p className="text-xs text-zinc-400">Total Paid: <strong className="text-emerald-400">₹{activeBooking.amountDetails.total}</strong> ({activeBooking.paymentMethod})</p>
                {activeBooking.seatNumbers && activeBooking.seatNumbers.length > 0 && (
                  <p className="text-xs text-amber-300 font-bold">Seats: {activeBooking.seatNumbers.join(', ')}</p>
                )}
              </div>

              <button
                onClick={() => onOpenTicket(activeBooking)}
                className="py-2.5 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-orange-500/30 text-orange-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>View Full Digital Ticket</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
          <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No active event pass for today</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Book tickets for upcoming college fests, concerts, or hackathons to populate your day schedule, live venue map, and squad coordination!
          </p>
          <button
            onClick={onExploreEvents}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-orange-400/15 hover:brightness-105"
          >
            Discover Trending Events Now
          </button>
        </div>
      )}

    </div>
  );
};

