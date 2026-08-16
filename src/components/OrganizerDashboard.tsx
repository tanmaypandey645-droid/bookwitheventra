import React, { useState } from 'react';
import { PlusCircle, Calendar, MapPin, Ticket, IndianRupee, Users, CheckCircle2, TrendingUp, Building2, Eye, Trash2 } from 'lucide-react';
import { Event, EventCategory, TicketType, User } from '../types';

interface OrganizerDashboardProps {
  events: Event[];
  currentUser: User;
  onSaveEvent: (event: Event) => void;
  onSelectEvent: (event: Event) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  events,
  currentUser,
  onSaveEvent,
  onSelectEvent
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('College Fest');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80');
  const [date, setDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [venue, setVenue] = useState('KIET Auditorium');
  const [city, setCity] = useState('Ghaziabad');
  const [address, setAddress] = useState('Delhi-NCR, Meerut Road, Ghaziabad');
  const [ticketName, setTicketName] = useState('Student Pass');
  const [ticketPrice, setTicketPrice] = useState(199);
  const [ticketCapacity, setTicketCapacity] = useState(500);
  const [seatingEnabled, setSeatingEnabled] = useState(true);

  const categories: EventCategory[] = [
    'Technology', 'College Fest', 'Music', 'Concert', 'Workshop', 
    'Hackathon', 'Sports', 'Comedy', 'Cultural', 'Entrepreneurship'
  ];

  // Organizers see all events or their created ones
  const myEvents = events;

  // Aggregate Stats
  const totalEvents = myEvents.length;
  const totalTicketsSold = myEvents.reduce((acc, curr) => acc + (curr.capacity - curr.availableTickets), 0);
  const totalRevenue = myEvents.reduce((acc, curr) => {
    const avgPrice = curr.ticketTypes[0]?.price || 199;
    return acc + ((curr.capacity - curr.availableTickets) * avgPrice);
  }, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicketType: TicketType = {
      id: 'tk_' + Date.now(),
      name: ticketName,
      price: Number(ticketPrice),
      description: 'Official event entry pass.',
      capacity: Number(ticketCapacity),
      available: Number(ticketCapacity)
    };

    const newEvent: Event = {
      id: 'evt_custom_' + Date.now(),
      title,
      description,
      category,
      image,
      date,
      startTime,
      endTime,
      venue,
      city,
      address,
      latitude: 28.7523,
      longitude: 77.4988,
      organizer: currentUser.name || 'KIET Event Organizer',
      organizerVerified: true,
      ticketTypes: [newTicketType],
      capacity: Number(ticketCapacity),
      availableTickets: Number(ticketCapacity),
      interestsCount: 15,
      seatingEnabled,
      occupiedSeats: [],
      schedule: [
        { time: startTime, title: 'Event Inauguration & Opening', description: 'Main event kickoff.', location: venue }
      ],
      createdAt: new Date().toISOString()
    };

    onSaveEvent(newEvent);
    setShowCreateForm(false);
    // Reset
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-400/10 via-amber-400/10 to-transparent p-6 sm:p-8 rounded-3xl border border-orange-400/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>ORGANIZER PORTAL • {currentUser.college}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Event Organizer Hub</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Publish college fests, workshops, hackathons & manage ticket sales.</p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 flex items-center gap-2 shrink-0 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showCreateForm ? 'Close Form' : 'Publish New Event'}</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Total Published Events</span>
            <Calendar className="w-4 h-4 text-orange-300" />
          </div>
          <p className="text-2xl font-black text-white">{totalEvents}</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Tickets Sold</span>
            <Ticket className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-2xl font-black text-white">{totalTicketsSold} <span className="text-xs text-zinc-500 font-normal">passes</span></p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Simulated Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Create Event Form Modal/Panel */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} className="bg-zinc-900 border border-orange-400/25 p-6 sm:p-8 rounded-3xl space-y-4 animate-in fade-in">
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-orange-300" />
            <span>Create & Publish New Event</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-zinc-300 font-bold mb-1">Event Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. KIET AI & Robotics Hackathon 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">Event Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">Start Time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">End Time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="06:00 PM"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">Venue Name</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="KIET Main Auditorium"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ghaziabad"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-300 font-bold mb-1">Full Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Delhi-NCR, Meerut Road, Ghaziabad, UP"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-300 font-bold mb-1">Poster Image URL</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-300 font-bold mb-1">Event Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed event description, rules, and highlights..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60 resize-none"
              />
            </div>

            {/* Ticket Specs */}
            <div>
              <label className="block text-zinc-300 font-bold mb-1">Ticket Category Name</label>
              <input
                type="text"
                value={ticketName}
                onChange={(e) => setTicketName(e.target.value)}
                placeholder="Student Pass"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">Ticket Price (₹)</label>
              <input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                placeholder="199"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1">Total Capacity / Seats</label>
              <input
                type="number"
                value={ticketCapacity}
                onChange={(e) => setTicketCapacity(Number(e.target.value))}
                placeholder="500"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-400/60"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="seatingToggle"
                checked={seatingEnabled}
                onChange={(e) => setSeatingEnabled(e.target.checked)}
                className="w-4 h-4 text-orange-400 rounded border-zinc-800 bg-zinc-950"
              />
              <label htmlFor="seatingToggle" className="text-zinc-300 font-bold cursor-pointer">
                Enable Interactive Seat Selection Grid
              </label>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="py-3 px-5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 hover:brightness-105"
            >
              Publish Event Live
            </button>
          </div>
        </form>
      )}

      {/* Published Events Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h3 className="font-extrabold text-white text-base mb-4">Published Events & Sales Roster</h3>

        <div className="space-y-3">
          {myEvents.map((evt) => {
            const sold = evt.capacity - evt.availableTickets;
            const revenue = sold * (evt.ticketTypes[0]?.price || 199);

            return (
              <div key={evt.id} className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={evt.image} alt={evt.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{evt.title}</h4>
                    <p className="text-xs text-zinc-400">{evt.date} • {evt.venue}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-orange-400/10 text-orange-300 rounded-full text-[10px] font-bold">
                        {evt.category}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">
                        ₹{revenue} Revenue
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
                  <div className="text-right text-xs">
                    <p className="text-zinc-400">Sold: <strong className="text-white">{sold}</strong> / {evt.capacity}</p>
                    <div className="w-28 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-amber-400" 
                        style={{ width: `${Math.min(100, (sold / evt.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectEvent(evt)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    title="View Event Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
