import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Filter, 
  MapPin, 
  Calendar, 
  Ticket, 
  Users, 
  Heart, 
  Building2, 
  ArrowRight, 
  Bell, 
  CheckCircle2, 
  User as UserIcon, 
  ShieldCheck, 
  Download, 
  X,
  Compass,
  GraduationCap,
  ChevronRight,
  Clock,
  Camera
} from 'lucide-react';
import { StorageService } from './services/storage';
import { RecommendationEngine } from './services/recommendationEngine';
import { RecommendedSection } from './components/RecommendedSection';
import { INITIAL_EVENTS } from './data/mockData';
import { Event, Booking, OutingPlan, User, NotificationItem, EventCategory, RecommendedEvent } from './types';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthModal } from './components/AuthModal';
import { EventCard } from './components/EventCard';
import { CheckoutModal } from './components/CheckoutModal';
import { SquadPlanModal } from './components/SquadPlanModal';
import { EventraAIAssistant } from './components/EventraAIAssistant';
import { TicketDetailModal } from './components/TicketDetailModal';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { MyDayView } from './components/MyDayView';
import { UserAvatar } from './components/UserAvatar';
import { ProfilePhotoModal } from './components/ProfilePhotoModal';
import { generateTicketPDF } from './utils/pdfGenerator';

export function App() {
  // Application Data State
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getUser());
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [plans, setPlans] = useState<OutingPlan[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'popular' | 'price'>('date');

  // Modal Control States
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null);
  const [checkoutEvent, setCheckoutEvent] = useState<Event | null>(null);
  const [checkoutSquadMode, setCheckoutSquadMode] = useState<boolean>(false);
  const [squadModalEvent, setSquadModalEvent] = useState<Event | null>(null);
  const [viewTicketModalBooking, setViewTicketModalBooking] = useState<Booking | null>(null);
  const [pendingBookingEvent, setPendingBookingEvent] = useState<Event | null>(null);
  const [authNotice, setAuthNotice] = useState<string | undefined>();
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editingPhone, setEditingPhone] = useState<string>('');
  const [editingEmail, setEditingEmail] = useState<string>('');
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);

  // Recommendation Engine State & Modal Duration Tracking
  const [modalOpenTime, setModalOpenTime] = useState<number | null>(null);
  const [recRefreshCounter, setRecRefreshCounter] = useState<number>(0);

  // Computed Recommendations
  const recommendedEvents = useMemo(() => {
    return RecommendationEngine.getRecommendations(
      currentUser.id,
      events,
      bookings,
      plans,
      6
    );
  }, [currentUser, events, bookings, plans, recRefreshCounter]);

  // Profile Photo Handlers
  const handleSavePhoto = (newPhotoUrl: string) => {
    const updatedUser = {
      ...currentUser,
      profileImage: newPhotoUrl
    };
    setCurrentUser(updatedUser);
    StorageService.saveUser(updatedUser);
  };

  const handleRemovePhoto = () => {
    const updatedUser = {
      ...currentUser,
      profileImage: ''
    };
    setCurrentUser(updatedUser);
    StorageService.saveUser(updatedUser);
  };

  // Select event details with tracking
  const handleOpenEventDetails = (event: Event) => {
    setSelectedEventDetails(event);
    setModalOpenTime(Date.now());
    RecommendationEngine.trackInteraction(currentUser.id, event.id, 'CLICK', event);
  };

  const handleCloseEventDetails = () => {
    if (selectedEventDetails && modalOpenTime) {
      const durationSec = Math.floor((Date.now() - modalOpenTime) / 1000);
      RecommendationEngine.trackInteraction(currentUser.id, selectedEventDetails.id, 'VIEW', selectedEventDetails, durationSec);
      setRecRefreshCounter(prev => prev + 1);
    }
    setSelectedEventDetails(null);
    setModalOpenTime(null);
  };

  // Initial Data Load
  useEffect(() => {
    setEvents(StorageService.getEvents());
    setBookings(StorageService.getBookings());
    setPlans(StorageService.getOutingPlans());
    setFavorites(StorageService.getFavorites());
    setNotifications(StorageService.getNotifications());
  }, []);

  const allCategories = ['All', 'College Fest', 'Technology', 'Music', 'Concert', 'Workshop', 'Hackathon', 'Sports', 'Comedy', 'Cultural'];
  const allCities = ['All', 'Ghaziabad', 'Delhi', 'Noida', 'Gurugram'];

  // Toggle Favorite
  const handleToggleFavorite = (eventId: string) => {
    const isFavNow = StorageService.toggleFavorite(eventId);
    setFavorites(StorageService.getFavorites());
    const event = events.find(e => e.id === eventId);
    if (event) {
      RecommendationEngine.trackInteraction(currentUser.id, eventId, isFavNow ? 'SAVE' : 'UNSAVE', event);
      setRecRefreshCounter(prev => prev + 1);
    }
  };

  // Login Handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    StorageService.saveUser(user);
    if (pendingBookingEvent) {
      setCheckoutEvent(pendingBookingEvent);
      setPendingBookingEvent(null);
    }
    setAuthNotice(undefined);
  };

  // Initiate Booking Auth Guard Handler
  const handleInitiateBooking = (event: Event, isSquad: boolean = false) => {
    setCheckoutSquadMode(isSquad);
    if (!currentUser || currentUser.id === 'guest') {
      setPendingBookingEvent(event);
      setAuthNotice('Login required to continue booking');
      setAuthModalOpen(true);
    } else {
      setCheckoutEvent(event);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    const guestUser: User = {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@eventra.com',
      college: 'University Student',
      city: 'Delhi NCR',
      interests: [],
      profileImage: '',
      role: 'user',
      savedAccount: false
    };
    setCurrentUser(guestUser);
    StorageService.saveUser(guestUser);
    setAuthNotice(undefined);
    if (['profile', 'organizer', 'tickets', 'plans'].includes(activeTab)) {
      setActiveTab('home');
    }
  };

  // Booking Complete Handler
  const handleBookingSuccess = (newBooking: Booking) => {
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    StorageService.saveBookings(updatedBookings);

    // Track interaction (+10 BOOKING_COMPLETED)
    const targetEvent = events.find(e => e.id === newBooking.eventId);
    RecommendationEngine.trackInteraction(currentUser.id, newBooking.eventId, 'BOOKING_COMPLETED', targetEvent);
    setRecRefreshCounter(prev => prev + 1);

    // Update available seats on event
    const updatedEvents = events.map(e => {
      if (e.id === newBooking.eventId) {
        return {
          ...e,
          availableTickets: Math.max(0, e.availableTickets - newBooking.quantity),
          occupiedSeats: [...(e.occupiedSeats || []), ...(newBooking.seatNumbers || [])]
        };
      }
      return e;
    });
    setEvents(updatedEvents);
    StorageService.saveEvents(updatedEvents);

    // Add notification
    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      title: '🎟 Booking Confirmed!',
      message: `Your pass for "${newBooking.eventTitle}" is confirmed. Booking ID: ${newBooking.bookingId}`,
      timestamp: 'Just now',
      read: false,
      type: 'booking',
      eventId: newBooking.eventId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);
  };

  // Cancel / Delete a specific booked pass
  const handleCancelBooking = (bookingId: string) => {
    StorageService.deleteBooking(bookingId);
    const updatedBookings = StorageService.getBookings();
    setBookings(updatedBookings);
    setEvents(StorageService.getEvents());
    if (viewTicketModalBooking?.bookingId === bookingId) {
      setViewTicketModalBooking(null);
    }
  };

  // Clear all bookings
  const handleClearAllBookings = () => {
    if (window.confirm('Are you sure you want to remove all booked tickets?')) {
      StorageService.clearAllBookings();
      setBookings([]);
      setEvents(StorageService.getEvents());
      setViewTicketModalBooking(null);
    }
  };

  // Outing Plan Handler
  const handleSavePlan = (newPlan: OutingPlan) => {
    const updatedPlans = [newPlan, ...plans];
    setPlans(updatedPlans);
    StorageService.saveOutingPlans(updatedPlans);

    // Track interaction (+8 SQUAD_JOIN)
    const targetEvent = events.find(e => e.id === newPlan.eventId);
    RecommendationEngine.trackInteraction(currentUser.id, newPlan.eventId, 'SQUAD_JOIN', targetEvent);
    setRecRefreshCounter(prev => prev + 1);

    // Add notification
    const newNotif: NotificationItem = {
      id: 'notif_plan_' + Date.now(),
      title: '👥 Squad Outing Planned!',
      message: `Outing for "${newPlan.eventTitle}" created. Meeting at ${newPlan.meetingPoint} at ${newPlan.meetingTime}.`,
      timestamp: 'Just now',
      read: false,
      type: 'squad',
      eventId: newPlan.eventId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);
  };

  // Save Event Created by Organizer
  const handleSaveOrganizerEvent = (newEvent: Event) => {
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    StorageService.saveEvents(updatedEvents);
  };

  // Filtered Events Calculation
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      // Search
      const matchesSearch = 
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.organizer.toLowerCase().includes(searchQuery.toLowerCase());

      // Category
      const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;

      // City
      const matchesCity = selectedCity === 'All' || evt.city === selectedCity;

      // Price
      const minPrice = Math.min(...evt.ticketTypes.map(t => t.price));
      let matchesPrice = true;
      if (priceFilter === 'free') matchesPrice = minPrice === 0;
      if (priceFilter === 'under500') matchesPrice = minPrice <= 500;
      if (priceFilter === 'under1000') matchesPrice = minPrice <= 1000;

      return matchesSearch && matchesCategory && matchesCity && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price') {
        const minA = Math.min(...a.ticketTypes.map(t => t.price));
        const minB = Math.min(...b.ticketTypes.map(t => t.price));
        return minA - minB;
      }
      if (sortBy === 'popular') {
        return b.interestsCount - a.interestsCount;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [events, searchQuery, selectedCategory, selectedCity, priceFilter, sortBy]);

  const isFilterActive = searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedCity !== 'All' || priceFilter !== 'all' || sortBy !== 'date';

  // Section 1: Trending Events (Top popularity & high demand)
  const trendingEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => b.interestsCount - a.interestsCount).slice(0, 3);
  }, [filteredEvents]);

  // Section 2: Current & Upcoming Events (Happening soon across campuses)
  const upcomingEvents = useMemo(() => {
    const trendingIds = new Set(trendingEvents.map(e => e.id));
    const remaining = filteredEvents.filter(e => !trendingIds.has(e.id));
    return remaining.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
  }, [filteredEvents, trendingEvents]);

  // Section 4: Other discovery categories & events
  const otherEvents = useMemo(() => {
    const shownIds = new Set([...trendingEvents.map(e => e.id), ...upcomingEvents.map(e => e.id)]);
    return filteredEvents.filter(e => !shownIds.has(e.id));
  }, [filteredEvents, trendingEvents, upcomingEvents]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isGuest = !currentUser || currentUser.id === 'guest';
  const userBookingsCount = !isGuest
    ? bookings.filter(b => b.userId === currentUser.id || b.userEmail === currentUser.email).length
    : 0;

  return (
    <div className={`min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-orange-400 selection:text-zinc-950 pb-20 md:pb-8 relative ${isGuest ? 'overflow-hidden max-h-screen' : ''}`}>
      
      {/* Page Content Container (blurred & disabled when user is guest) */}
      <div className={isGuest ? 'pointer-events-none select-none filter blur-md opacity-25 transition-all' : ''}>
        {/* Top Header Navbar */}
        <Navbar
          user={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          notifications={notifications}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenAI={() => setAiModalOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(!notificationsOpen)}
          onLogout={handleLogout}
          unreadCount={unreadCount}
        />

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div className="fixed top-16 right-4 sm:right-8 z-50 w-80 sm:w-96 bg-[#0e0e0e] border border-orange-400/25 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-300" />
              <span>Notifications & Reminders</span>
            </h3>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <div key={n.id} className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs space-y-1">
                <p className="font-bold text-white flex items-center justify-between">
                  <span>{n.title}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">{n.timestamp}</span>
                </p>
                <p className="text-zinc-400 text-[11px]">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-24 md:pb-10">
           {/* ==================== HOME / DISCOVER VIEW ==================== */}
        {(activeTab === 'home' || activeTab === 'discover') && (
          <div className="space-y-3 sm:space-y-3.5">
            
            {/* Filter & Search Bar Controls (Minimal & Sleek) */}
            <div className="bg-[#0c0c0f] border border-zinc-800/90 rounded-xl p-2.5 sm:p-3 space-y-2 shadow-sm">
              
              {/* Search Row */}
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by event title, category, college, or city..."
                    className="w-full pl-8.5 pr-4 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/90 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-orange-400/60"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/90 text-zinc-300 text-xs font-semibold focus:outline-none focus:border-orange-400/60"
                  >
                    {allCities.map(c => (
                      <option key={c} value={c}>{c === 'All' ? '📍 All Cities' : `📍 ${c}`}</option>
                    ))}
                  </select>

                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/90 text-zinc-300 text-xs font-semibold focus:outline-none focus:border-orange-400/60"
                  >
                    <option value="all">🎟 All Prices</option>
                    <option value="free">FREE Entry</option>
                    <option value="under500">Under ₹500</option>
                    <option value="under1000">Under ₹1000</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/90 text-zinc-300 text-xs font-semibold focus:outline-none focus:border-orange-400/60"
                  >
                    <option value="date">📅 Sort by Date</option>
                    <option value="popular">🔥 Most Popular</option>
                    <option value="price">💰 Price: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Category Chips Horizontal Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>

            {isFilterActive ? (
              /* Search & Filter Results Mode */
              <div id="event-grid-scroll" className="space-y-3">
                {/* Secondary Recommendations */}
                <RecommendedSection
                  recommendedEvents={recommendedEvents}
                  currentUser={currentUser}
                  onSelectEvent={handleOpenEventDetails}
                  onBookEvent={handleInitiateBooking}
                  onPlanSquad={(evt) => setSquadModalEvent(evt)}
                  onToggleFavorite={handleToggleFavorite}
                  favorites={favorites}
                  onRefreshRecommendations={() => setRecRefreshCounter(c => c + 1)}
                  userBookingsCount={userBookingsCount}
                />

                <div className="flex items-center justify-between pt-0.5">
                  <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-orange-400" />
                    <span>Search & Filter Results ({filteredEvents.length})</span>
                  </h2>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedCity('All');
                      setPriceFilter('all');
                      setSortBy('date');
                    }}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>

                {filteredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map(evt => (
                      <EventCard
                        key={evt.id}
                        event={evt}
                        isFavorite={favorites.includes(evt.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectEvent={handleOpenEventDetails}
                        onBookNow={(e) => setCheckoutEvent(e)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2">
                    <Search className="w-7 h-7 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-bold text-white">No matching events found</h3>
                    <p className="text-xs text-zinc-400">Try adjusting your filters or search query.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                        setSelectedCity('All');
                        setPriceFilter('all');
                        setSortBy('date');
                      }}
                      className="py-1 px-3 bg-orange-400 text-zinc-950 font-bold text-xs rounded-lg"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Structured Discovery Mode: Recommended (Personalized) -> Trending -> Upcoming -> Explore More */
              <div className="space-y-4 sm:space-y-5">
                {/* ✨ PERSONALIZED RECOMMENDED FOR YOU (Only shown if user has booked at least 1 ticket) */}
                <RecommendedSection
                  recommendedEvents={recommendedEvents}
                  currentUser={currentUser}
                  onSelectEvent={handleOpenEventDetails}
                  onBookEvent={handleInitiateBooking}
                  onPlanSquad={(evt) => setSquadModalEvent(evt)}
                  onToggleFavorite={handleToggleFavorite}
                  favorites={favorites}
                  onRefreshRecommendations={() => setRecRefreshCounter(c => c + 1)}
                  userBookingsCount={userBookingsCount}
                />

                {/* 1. 🔥 TRENDING EVENTS */}
                <section id="trending-events" className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                        <span>🔥 Top Rated</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        Trending Events
                      </h2>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Most anticipated campus highlights</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingEvents.map(evt => (
                      <EventCard
                        key={evt.id}
                        event={evt}
                        isFavorite={favorites.includes(evt.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectEvent={handleOpenEventDetails}
                        onBookNow={(e) => setCheckoutEvent(e)}
                      />
                    ))}
                  </div>
                </section>

                {/* 2. 📅 CURRENT & UPCOMING EVENTS (Large Prominent Cards) */}
                <section id="upcoming-events" className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                        <span>📅 Happening Soon</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        Current & Upcoming Events
                      </h2>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Verified dates & ticket availability</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.map(evt => (
                      <EventCard
                        key={evt.id}
                        event={evt}
                        isFavorite={favorites.includes(evt.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectEvent={handleOpenEventDetails}
                        onBookNow={(e) => setCheckoutEvent(e)}
                      />
                    ))}
                  </div>
                </section>

                {/* 3. 🎭 EXPLORE MORE / OTHER DISCOVERY CATEGORIES */}
                {otherEvents.length > 0 && (
                  <section id="explore-more-events" className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                          <Compass className="w-4 h-4 text-orange-300" />
                          <span>Explore More Events ({otherEvents.length})</span>
                        </h2>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Browse more workshops, sports, cultural fests & tech sprints</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otherEvents.map(evt => (
                        <EventCard
                          key={evt.id}
                          event={evt}
                          isFavorite={favorites.includes(evt.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectEvent={handleOpenEventDetails}
                          onBookNow={(e) => setCheckoutEvent(e)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

          </div>
        )}

        {/* ==================== MY DAY VIEW ==================== */}
        {activeTab === 'myday' && (
          <MyDayView
            bookings={bookings}
            plans={plans}
            events={events}
            onOpenTicket={(b) => setViewTicketModalBooking(b)}
            onExploreEvents={() => setActiveTab('home')}
          />
        )}

        {/* ==================== TICKETS TAB ==================== */}
        {activeTab === 'tickets' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h1 className="text-2xl font-extrabold text-white">
                  My Digital Event Passes ({currentUser.id !== 'guest' ? bookings.filter(b => b.userId === currentUser.id || b.userEmail === currentUser.email).length : 0})
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">Your official verified booking records & QR tickets.</p>
              </div>
              {currentUser.id !== 'guest' && bookings.filter(b => b.userId === currentUser.id || b.userEmail === currentUser.email).length > 0 && (
                <button
                  onClick={handleClearAllBookings}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-500/40 text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {currentUser.id === 'guest' ? (
              <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 max-w-lg mx-auto">
                <ShieldCheck className="w-12 h-12 text-orange-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Authentication Required</h3>
                <p className="text-xs text-zinc-400">Please sign in with Google or Phone OTP to access your event passes and tickets.</p>
                <button
                  onClick={() => {
                    setAuthNotice('Login required to view your tickets');
                    setAuthModalOpen(true);
                  }}
                  className="py-3 px-6 bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md shadow-orange-400/15"
                >
                  Continue with Google / Phone
                </button>
              </div>
            ) : bookings.filter(b => b.userId === currentUser.id || b.userEmail === currentUser.email).length > 0 ? (
              <div className="space-y-4">
                {bookings.filter(b => b.userId === currentUser.id || b.userEmail === currentUser.email).map((booking) => (
                  <div key={booking.bookingId} className="bg-[#0e0e0e] border border-zinc-800 hover:border-orange-400/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                    <div className="flex items-start gap-4">
                      <img
                        src={booking.eventImage}
                        alt={booking.eventTitle}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-700"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] rounded-full border border-emerald-500/30">
                            ✓ CONFIRMED
                          </span>
                          <span className="font-mono text-xs text-orange-300 font-bold">{booking.bookingId}</span>
                        </div>
                        <h3 className="font-extrabold text-white text-base line-clamp-1">{booking.eventTitle}</h3>
                        <p className="text-xs text-zinc-400">{booking.eventDate} • {booking.eventVenue}</p>
                        <p className="text-xs text-zinc-300 font-semibold mt-1">
                          {booking.ticketTypeName} (x{booking.quantity})
                          {booking.seatNumbers && ` • Seats: ${booking.seatNumbers.join(', ')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                      <button
                        onClick={() => generateTicketPDF(booking)}
                        className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-orange-300" />
                        <span>PDF Ticket</span>
                      </button>

                      <button
                        onClick={() => setViewTicketModalBooking(booking)}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15"
                      >
                        View Pass
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel and remove ticket pass for ${booking.eventTitle}?`)) {
                            handleCancelBooking(booking.bookingId);
                          }
                        }}
                        title="Cancel & Remove Pass"
                        className="p-2 rounded-xl bg-zinc-900/80 hover:bg-rose-500/20 border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
                <Ticket className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No tickets booked yet</h3>
                <p className="text-xs text-zinc-400">Discover trending events and secure your tickets online.</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="py-2 px-4 bg-orange-400 text-zinc-950 font-bold text-xs rounded-xl"
                >
                  Explore Events
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== SQUAD PLANS TAB ==================== */}
        {activeTab === 'plans' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-white">Squad Mode & Outing Plans</h1>
                  <span className="px-2.5 py-0.5 bg-orange-400/20 text-orange-300 rounded-full font-mono text-xs font-bold border border-orange-400/30">
                    4 Core Members
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">Coordinate meeting points, seat blocks, and add friends by mobile phone number.</p>
              </div>

              <button
                onClick={() => {
                  const targetEvt = events[0] || INITIAL_EVENTS[0];
                  setSquadModalEvent(targetEvt);
                }}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-orange-400/15 flex items-center justify-center gap-1.5 hover:brightness-105 transition-all self-start sm:self-auto shrink-0"
              >
                <Users className="w-4 h-4" />
                <span>+ Plan Outing / Add Friends</span>
              </button>
            </div>

            {/* Current Active Squad Showcase Card */}
            <div className="bg-zinc-950 p-4 sm:p-5 rounded-3xl border border-orange-400/30 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-400/20 text-orange-400 flex items-center justify-center font-bold">
                    👥
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Active Squad: Tanmay, Bharat, Angel & Raksha</h3>
                    <p className="text-[11px] text-zinc-400">KIET Campus Circle • Ready for Group Booking</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const targetEvt = events[0] || INITIAL_EVENTS[0];
                    setSquadModalEvent(targetEvt);
                  }}
                  className="text-xs text-orange-300 hover:text-white font-bold flex items-center gap-1 transition-colors"
                >
                  <span>+ Add by Phone</span>
                </button>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                {[
                  { name: 'Tanmay Pandey', role: 'Squad Lead', phone: '+91 98765 43210', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'Accepted' },
                  { name: 'Bharat Sharma', role: 'Member', phone: '+91 98112 34567', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', status: 'Accepted' },
                  { name: 'Angel Joseph', role: 'Member', phone: '+91 98223 45678', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', status: 'Accepted' },
                  { name: 'Raksha Singh', role: 'Member', phone: '+91 98334 56789', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'Accepted' }
                ].map((squadmate) => (
                  <div key={squadmate.name} className="p-2.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex items-center gap-2.5">
                    <UserAvatar name={squadmate.name} src={squadmate.avatar} size="sm" className="w-8 h-8 rounded-xl shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{squadmate.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">{squadmate.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plans List */}
            {plans.length > 0 ? (
              <div className="space-y-4">
                {plans.map((plan) => {
                  const matchedEvent = events.find(e => e.id === plan.eventId);
                  return (
                    <div key={plan.id} className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-white text-base sm:text-lg">{plan.eventTitle}</h3>
                          <p className="text-xs text-zinc-400">{plan.eventDate} • {plan.eventVenue}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-xs border border-emerald-500/30 self-start sm:self-auto">
                          ✓ {plan.status} Squad Outing
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">📍 MEETING POINT</p>
                          <p className="font-bold text-white mt-0.5">{plan.meetingPoint}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">⏰ MEETING TIME</p>
                          <p className="font-bold text-amber-400 mt-0.5">{plan.meetingTime}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-xs text-zinc-300">
                        <span className="font-bold text-orange-300">Squad Notes: </span>
                        <span>{plan.notes}</span>
                      </div>

                      {/* Squad Members */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-300">Squad Attendees ({plan.friends.length})</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Tanmay, Bharat, Angel, Raksha</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {plan.friends.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-2 bg-zinc-950 rounded-xl border border-zinc-800/80">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <UserAvatar name={f.name} src={f.avatar} size="sm" className="w-6 h-6 rounded-lg shrink-0" />
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-white truncate">{f.name}</p>
                                  <p className="text-[9px] text-zinc-400 font-mono truncate">{f.phoneNumber || f.email}</p>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                                {f.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            const evt = matchedEvent || events[0];
                            setSquadModalEvent(evt);
                          }}
                          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5 text-orange-400" />
                          <span>Edit Plan / Add Friends by Phone</span>
                        </button>

                        <button
                          onClick={() => {
                            const evt = matchedEvent || events.find(e => e.id === plan.eventId) || events[0];
                            handleInitiateBooking(evt, true);
                          }}
                          className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-black text-xs shadow-md shadow-orange-400/15 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Book Tickets with this Squad ({plan.friends.length} Passes)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
                <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No squad plans created yet</h3>
                <p className="text-xs text-zinc-400">Plan an outing with friends directly from any event details page.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== SAVED FAVORITES TAB ==================== */}
        {activeTab === 'favorites' && (
          <div className="space-y-6 pb-12">
            <h1 className="text-2xl font-extrabold text-white pb-2 border-b border-zinc-800">Saved Events ({favorites.length})</h1>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.filter(e => favorites.includes(e.id)).map(evt => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectEvent={handleOpenEventDetails}
                    onBookNow={(e) => handleInitiateBooking(e)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
                <Heart className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No saved events</h3>
                <p className="text-xs text-zinc-400">Click the heart icon on any event card to save it for later.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== ORGANIZER HUB TAB ==================== */}
        {activeTab === 'organizer' && (
          <OrganizerDashboard
            events={events}
            currentUser={currentUser}
            onSaveEvent={handleSaveOrganizerEvent}
            onSelectEvent={setSelectedEventDetails}
          />
        )}

        {/* ==================== USER PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          currentUser.id === 'guest' ? (
            <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 my-8">
              <UserIcon className="w-12 h-12 text-orange-400 mx-auto" />
              <h3 className="text-xl font-extrabold text-white">Student Account Required</h3>
              <p className="text-xs text-zinc-400">Please log in with your college student ID or phone number to access your student profile, interests, and tickets.</p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-3.5 bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-400/20 hover:brightness-105 transition-all"
              >
                Log In to Eventra →
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 pb-12">
            
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-zinc-800">
              <div 
                onClick={() => setPhotoModalOpen(true)}
                className="relative group cursor-pointer"
                title="Click to change profile photo"
              >
                <UserAvatar
                  name={currentUser.name}
                  src={currentUser.profileImage}
                  size="2xl"
                  showCameraBadge={true}
                  className="w-20 h-20 rounded-2xl border-2 border-orange-400 shadow-lg group-hover:scale-105 group-hover:brightness-110 transition-all"
                />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-white">{currentUser.name}</h2>
                  {currentUser.authenticationProvider && (
                    <span className="px-2.5 py-0.5 bg-orange-400/15 border border-orange-400/30 text-orange-300 font-bold text-[10px] rounded-full uppercase">
                      {currentUser.authenticationProvider} Auth
                    </span>
                  )}
                </div>

                <p className="text-xs text-amber-300 font-mono">{currentUser.email || 'No email associated'}</p>
                <p className="text-xs text-zinc-300 font-mono">{currentUser.phoneNumber || 'No phone number added'}</p>
                
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentUser.college}</span>
                  </p>
                  
                  <button
                    onClick={() => setPhotoModalOpen(true)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-amber-300 border border-orange-400/30 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5 text-orange-400" />
                    <span>Change Profile Photo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Info Card (Requirement 8 Format) */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Account Profile Card</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Name</p>
                  <p className="font-bold text-white mt-0.5">{currentUser.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Email Address</p>
                  <p className="font-bold text-amber-300 font-mono mt-0.5">{currentUser.email || 'Not added'}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Phone Number</p>
                  <p className="font-bold text-amber-300 font-mono mt-0.5">{currentUser.phoneNumber || 'Not added'}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">User ID</p>
                  <p className="font-mono text-zinc-400 mt-0.5 truncate">{currentUser.id}</p>
                </div>
              </div>
            </div>

            {/* Preferred Categories */}
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">My Preferred Categories</h3>
              <div className="flex flex-wrap gap-2">
                {currentUser.interests && currentUser.interests.length > 0 ? (
                  currentUser.interests.map(i => (
                    <span key={i} className="px-3 py-1 bg-orange-400/10 text-orange-300 border border-orange-400/25 rounded-full text-xs font-bold">
                      {i}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">No preferred categories selected</span>
                )}
              </div>
            </div>

            {/* Personalized Recommendations Preference Card */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-300" />
                    <span>Personalized Event Recommendations</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Controls whether Eventra uses your views, bookings, and squad activity to tailor event suggestions.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const updated = {
                      ...currentUser,
                      personalizedRecommendationsEnabled: currentUser.personalizedRecommendationsEnabled === false ? true : false
                    };
                    setCurrentUser(updated);
                    StorageService.saveUser(updated);
                    setRecRefreshCounter(c => c + 1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentUser.personalizedRecommendationsEnabled !== false
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {currentUser.personalizedRecommendationsEnabled !== false ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-800/80">
                <span className="text-zinc-500">Learned Interest Data:</span>
                <button
                  onClick={() => {
                    StorageService.saveUserInterestProfile({
                      userId: currentUser.id,
                      interests: {},
                      dislikedEventIds: [],
                      skippedEventIds: [],
                      bookedEventIds: [],
                      updatedAt: new Date().toISOString()
                    });
                    setRecRefreshCounter(c => c + 1);
                    alert('Recommendation learning profile reset successfully!');
                  }}
                  className="text-orange-400 hover:text-orange-300 font-bold underline"
                >
                  Reset Learning Profile
                </button>
              </div>
            </div>

            {/* Edit Profile Controls (Inline Modal/State) */}
            {isEditingProfile ? (
              <div className="p-4 bg-zinc-950 rounded-2xl border border-orange-400/30 space-y-3">
                <h4 className="text-xs font-bold text-orange-300 uppercase">Edit Account Profile</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editingEmail}
                      onChange={(e) => setEditingEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="py-1.5 px-3 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const updated = {
                        ...currentUser,
                        phoneNumber: editingPhone || currentUser.phoneNumber,
                        email: editingEmail || currentUser.email
                      };
                      setCurrentUser(updated);
                      StorageService.saveUser(updated);
                      setIsEditingProfile(false);
                    }}
                    className="py-1.5 px-4 bg-orange-400 text-zinc-950 rounded-xl text-xs font-extrabold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* Requirement 8 Account Settings Buttons */
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Account Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setEditingPhone(currentUser.phoneNumber || '');
                      setEditingEmail(currentUser.email || '');
                      setIsEditingProfile(true);
                    }}
                    className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setEditingPhone(currentUser.phoneNumber || '+91 ');
                      setEditingEmail(currentUser.email || '');
                      setIsEditingProfile(true);
                    }}
                    className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs rounded-xl transition-all"
                  >
                    {currentUser.phoneNumber ? 'Update Phone' : 'Add Phone Number'}
                  </button>

                  <button
                    onClick={() => {
                      setEditingPhone(currentUser.phoneNumber || '');
                      setEditingEmail(currentUser.email || '');
                      setIsEditingProfile(true);
                    }}
                    className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs rounded-xl transition-all"
                  >
                    {currentUser.email ? 'Update Email' : 'Add Email'}
                  </button>
                </div>

                <div className="pt-3 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setAuthNotice(undefined);
                      setAuthModalOpen(true);
                    }}
                    className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
                  >
                    Switch Account / Portal Login
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-2.5 px-4 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded-xl border border-rose-500/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}

          </div>
        )
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ==================== MODALS ==================== */}

      {/* Event Details Drawer Modal */}
      {selectedEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-orange-400/25 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-zinc-900 shrink-0">
              <img src={selectedEventDetails.image} alt={selectedEventDetails.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-black/40" />
              <button
                onClick={handleCloseEventDetails}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-3 py-1 bg-orange-400 text-zinc-950 font-bold text-xs rounded-full uppercase">
                  {selectedEventDetails.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">{selectedEventDetails.title}</h2>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Date & Time</p>
                  <p className="font-bold text-white mt-0.5">{selectedEventDetails.date} • {selectedEventDetails.startTime}</p>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Venue & City</p>
                  <p className="font-bold text-amber-300 mt-0.5">{selectedEventDetails.venue}, {selectedEventDetails.city}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">About the Event</h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{selectedEventDetails.description}</p>
              </div>

              {/* Schedule Agenda */}
              {selectedEventDetails.schedule && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Event Timeline Schedule</h4>
                  <div className="space-y-2">
                    {selectedEventDetails.schedule.map((item, idx) => (
                      <div key={idx} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs flex gap-3">
                        <span className="font-mono text-orange-300 font-bold shrink-0">{item.time}</span>
                        <div>
                          <p className="font-bold text-white">{item.title}</p>
                          <p className="text-zinc-400 text-[11px]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    const evt = selectedEventDetails;
                    setSelectedEventDetails(null);
                    setSquadModalEvent(evt);
                  }}
                  className="py-3 px-3 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-700 transition-colors"
                >
                  <Users className="w-4 h-4 text-orange-300" />
                  <span>Plan With Friends</span>
                </button>

                <button
                  onClick={() => {
                    const evt = selectedEventDetails;
                    setSelectedEventDetails(null);
                    handleInitiateBooking(evt, true);
                  }}
                  className="py-3 px-3 rounded-xl bg-orange-400/15 hover:bg-orange-400/25 border border-orange-400/40 text-orange-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>Book with Squad (4x)</span>
                </button>

                <button
                  onClick={() => {
                    const evt = selectedEventDetails;
                    setSelectedEventDetails(null);
                    handleInitiateBooking(evt, false);
                  }}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 hover:brightness-105 transition-all flex items-center justify-center gap-1"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Individual Pass</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* End blurred page content wrapper */}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen || isGuest}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        savedUser={StorageService.getUser()}
        redirectNotice={authNotice || (isGuest ? "Welcome to Eventra! Please log in to enter the portal." : undefined)}
        isMandatory={isGuest}
      />

      {/* Checkout Modal */}
      {checkoutEvent && (
        <CheckoutModal
          isOpen={true}
          event={checkoutEvent}
          user={currentUser}
          initialSquadMode={checkoutSquadMode}
          onClose={() => {
            setCheckoutEvent(null);
            setCheckoutSquadMode(false);
          }}
          onBookingSuccess={handleBookingSuccess}
          onStartSquadPlan={(b) => {
            const evt = events.find(e => e.id === b.eventId) || checkoutEvent;
            setSquadModalEvent(evt);
          }}
          onViewTicket={(b) => {
            setCheckoutEvent(null);
            setViewTicketModalBooking(b);
          }}
        />
      )}

      {/* Squad Plan Modal */}
      {squadModalEvent && (
        <SquadPlanModal
          isOpen={true}
          event={squadModalEvent}
          currentUser={currentUser}
          allUsers={StorageService.getMockUsers()}
          onClose={() => setSquadModalEvent(null)}
          onSavePlan={handleSavePlan}
        />
      )}

      {/* Eventra AI Assistant Drawer */}
      <EventraAIAssistant
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        events={events}
        currentUser={currentUser}
        onSelectEvent={handleOpenEventDetails}
        onBookNow={(evt) => setCheckoutEvent(evt)}
      />

      {/* View Ticket Detail Modal */}
      <TicketDetailModal
        isOpen={!!viewTicketModalBooking}
        booking={viewTicketModalBooking}
        onClose={() => setViewTicketModalBooking(null)}
        onCancelBooking={handleCancelBooking}
      />

      {/* Profile Photo Management Modal */}
      <ProfilePhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        currentPhotoUrl={currentUser.profileImage}
        userName={currentUser.name}
        onSavePhoto={handleSavePhoto}
        onRemovePhoto={handleRemovePhoto}
      />

    </div>
  );
}

export default App;
