import { Event, User, Booking, OutingPlan, NotificationItem, EventInteraction, UserInterestProfile, RecommendationLog } from '../types';
import { INITIAL_USERS, INITIAL_EVENTS, INITIAL_BOOKINGS, INITIAL_PLANS, INITIAL_NOTIFICATIONS } from '../data/mockData';

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest User',
  email: 'guest@eventra.com',
  college: 'College / University Student',
  city: 'Delhi NCR',
  interests: [],
  profileImage: '',
  role: 'user',
  savedAccount: false
};

const STORAGE_KEYS = {
  CURRENT_USER: 'eventra_current_user',
  USERS: 'eventra_users',
  EVENTS: 'eventra_events',
  BOOKINGS: 'eventra_bookings',
  FAVORITES: 'eventra_favorites',
  PLANS: 'eventra_plans',
  NOTIFICATIONS: 'eventra_notifications',
  INTERACTIONS: 'eventra_interactions',
  USER_INTEREST_PROFILES: 'eventra_user_interest_profiles',
  RECOMMENDATION_LOGS: 'eventra_recommendation_logs',
  CLEARED_LEGACY_BOOKINGS: 'eventra_cleared_legacy_bookings_v1',
  SQUAD_DATA_VERSION: 'eventra_squad_data_v3',
};

export class StorageService {
  // Initialize storage with mock data if empty
  static init() {
    // Refresh squad data to official Tanmay, Bharat, Angel, Raksha squad
    if (!localStorage.getItem(STORAGE_KEYS.SQUAD_DATA_VERSION)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
      localStorage.setItem(STORAGE_KEYS.SQUAD_DATA_VERSION, 'true');
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
        localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(GUEST_USER));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    }

    // Clean up any legacy initial booked tickets across browser sessions
    if (!localStorage.getItem(STORAGE_KEYS.CLEARED_LEGACY_BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CLEARED_LEGACY_BOOKINGS, 'true');
    } else if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(['evt-kiet-techfest-2026', 'evt-hackindia-2026']));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }

  // Users & Auth
  static getUser(): User {
    return this.getCurrentUser();
  }

  static getCurrentUser(): User {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : GUEST_USER;
    } catch {
      return GUEST_USER;
    }
  }

  static saveUser(user: User) {
    this.setCurrentUser(user);
  }

  static setCurrentUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    // update in users list too
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getUsers(): User[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  static getMockUsers(): User[] {
    return this.getUsers();
  }

  // Events
  static getEvents(): Event[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  }

  static getEventById(id: string): Event | undefined {
    return this.getEvents().find(e => e.id === id);
  }

  static saveEvents(events: Event[]) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  static saveEvent(event: Event) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      events[index] = event;
    } else {
      events.unshift(event);
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  // Bookings
  static getBookings(): Booking[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  }

  static saveBookings(bookings: Booking[]) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }

  static getBookingById(id: string): Booking | undefined {
    return this.getBookings().find(b => b.bookingId === id || b.qrCodeData.includes(id));
  }

  static saveBooking(booking: Booking) {
    const bookings = this.getBookings();
    // Idempotency check: don't duplicate if bookingId exists
    const existing = bookings.find(b => b.bookingId === booking.bookingId);
    if (existing) {
      return existing;
    }
    bookings.unshift(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Deduct available tickets and update occupied seats in event
    const event = this.getEventById(booking.eventId);
    if (event) {
      event.availableTickets = Math.max(0, event.availableTickets - booking.quantity);
      if (booking.ticketTypeId) {
        const tType = event.ticketTypes.find(t => t.id === booking.ticketTypeId);
        if (tType) {
          tType.available = Math.max(0, tType.available - booking.quantity);
        }
      }
      if (booking.seatNumbers && booking.seatNumbers.length > 0) {
        if (!event.occupiedSeats) event.occupiedSeats = [];
        event.occupiedSeats.push(...booking.seatNumbers);
      }
      this.saveEvent(event);
    }

    // Create notification
    this.addNotification({
      id: 'notif_' + Date.now(),
      userId: booking.userId,
      title: '🎉 Booking Confirmed!',
      message: `Your booking for ${booking.eventTitle} is ready. Booking ID: ${booking.bookingId}`,
      date: 'Just now',
      read: false,
      type: 'booking',
      link: '/tickets'
    });

    return booking;
  }

  static deleteBooking(bookingId: string): boolean {
    const bookings = this.getBookings();
    const bookingToDelete = bookings.find(b => b.bookingId === bookingId);
    if (!bookingToDelete) return false;

    const remaining = bookings.filter(b => b.bookingId !== bookingId);
    this.saveBookings(remaining);

    // Release back tickets & occupied seats to event if possible
    const event = this.getEventById(bookingToDelete.eventId);
    if (event) {
      event.availableTickets = Math.min(event.capacity, event.availableTickets + bookingToDelete.quantity);
      if (bookingToDelete.ticketTypeId) {
        const tType = event.ticketTypes.find(t => t.id === bookingToDelete.ticketTypeId);
        if (tType) {
          tType.available = Math.min(tType.capacity, tType.available + bookingToDelete.quantity);
        }
      }
      if (bookingToDelete.seatNumbers && bookingToDelete.seatNumbers.length > 0 && event.occupiedSeats) {
        const seatsToRemove = new Set(bookingToDelete.seatNumbers);
        event.occupiedSeats = event.occupiedSeats.filter(seat => !seatsToRemove.has(seat));
      }
      this.saveEvent(event);
    }
    return true;
  }

  static clearAllBookings() {
    this.saveBookings([]);
  }

  // Favorites
  static getFavorites(): string[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static toggleFavorite(eventId: string): boolean {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(eventId);
    let isFav = false;
    if (index >= 0) {
      favorites.splice(index, 1);
      isFav = false;
    } else {
      favorites.push(eventId);
      isFav = true;
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return isFav;
  }

  // Outing Plans (Squad Mode)
  static getPlans(): OutingPlan[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANS);
      return data ? JSON.parse(data) : INITIAL_PLANS;
    } catch {
      return INITIAL_PLANS;
    }
  }

  static getOutingPlans(): OutingPlan[] {
    return this.getPlans();
  }

  static saveOutingPlans(plans: OutingPlan[]) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }

  static savePlan(plan: OutingPlan) {
    const plans = this.getPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.unshift(plan);
    }
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));

    // Send notifications to invited squad members
    plan.friends.forEach(f => {
      if (f.id !== plan.creatorId && f.status === 'Pending') {
        this.addNotification({
          id: 'notif_squad_' + Date.now() + '_' + f.id,
          userId: f.id,
          title: '👥 Squad Outing Invitation',
          message: `${plan.creatorName} invited you to join their squad for ${plan.eventTitle}!`,
          date: 'Just now',
          read: false,
          type: 'squad',
          link: '/plans'
        });
      }
    });
  }

  // Notifications
  static getNotifications(): NotificationItem[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  static saveNotifications(notifs: NotificationItem[]) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  static addNotification(notif: NotificationItem) {
    const notifications = this.getNotifications();
    notifications.unshift(notif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  static markNotificationsRead() {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.read = true);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  // Interactions Tracking
  static getInteractions(userId?: string): EventInteraction[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
      const list: EventInteraction[] = data ? JSON.parse(data) : [];
      return userId ? list.filter(i => i.userId === userId) : list;
    } catch {
      return [];
    }
  }

  static saveInteraction(interaction: EventInteraction) {
    const interactions = this.getInteractions();
    interactions.push(interaction);
    // Limit storage to last 1000 interactions for performance
    if (interactions.length > 1000) {
      interactions.shift();
    }
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
  }

  // User Interest Profiles
  static getUserInterestProfile(userId: string): UserInterestProfile {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_INTEREST_PROFILES);
      const profiles: Record<string, UserInterestProfile> = data ? JSON.parse(data) : {};
      if (profiles[userId]) {
        return profiles[userId];
      }
    } catch {}

    // Default profile
    const currentUser = this.getCurrentUser();
    const initialInterests: Record<string, number> = {};
    if (currentUser.interests) {
      currentUser.interests.forEach(interest => {
        initialInterests[interest] = 0.5;
      });
    }

    return {
      userId,
      interests: initialInterests,
      dislikedEventIds: [],
      skippedEventIds: [],
      bookedEventIds: [],
      updatedAt: new Date().toISOString()
    };
  }

  static saveUserInterestProfile(profile: UserInterestProfile) {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_INTEREST_PROFILES);
      const profiles: Record<string, UserInterestProfile> = data ? JSON.parse(data) : {};
      profiles[profile.userId] = profile;
      localStorage.setItem(STORAGE_KEYS.USER_INTEREST_PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.error('Error saving user interest profile', e);
    }
  }

  // Recommendation Logs
  static getRecommendationLogs(userId?: string): RecommendationLog[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECOMMENDATION_LOGS);
      const logs: RecommendationLog[] = data ? JSON.parse(data) : [];
      return userId ? logs.filter(l => l.userId === userId) : logs;
    } catch {
      return [];
    }
  }

  static saveRecommendationLogs(logs: RecommendationLog[]) {
    this.init();
    try {
      const existing = this.getRecommendationLogs();
      const combined = [...logs, ...existing].slice(0, 500); // keep top 500
      localStorage.setItem(STORAGE_KEYS.RECOMMENDATION_LOGS, JSON.stringify(combined));
    } catch (e) {
      console.error('Error saving recommendation logs', e);
    }
  }
}
