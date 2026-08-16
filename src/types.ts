export type EventCategory = 
  | 'Technology' 
  | 'College Fest' 
  | 'Music' 
  | 'Concert' 
  | 'Workshop' 
  | 'Hackathon' 
  | 'Sports' 
  | 'Comedy' 
  | 'Cultural' 
  | 'Entrepreneurship';

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  capacity: number;
  available: number;
}

export interface ScheduleItem {
  time: string;
  title: string;
  description: string;
  location?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  tags?: string[];
  image: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  venueName?: string; // Explicit alias for venue name
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  organizer: string;
  organizerVerified: boolean;
  ticketTypes: TicketType[];
  capacity: number;
  availableTickets: number;
  interestsCount: number;
  popularityScore?: number;
  schedule: ScheduleItem[];
  seatingEnabled?: boolean;
  occupiedSeats?: string[];
  refundPolicy?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  city: string;
  interests: string[];
  profileImage: string;
  role: 'user' | 'organizer';
  savedAccount?: boolean;
  phoneNumber?: string;
  authenticationProvider?: 'Google' | 'Phone' | 'Email';
  personalizedRecommendationsEnabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export type InteractionAction = 
  | 'VIEW'
  | 'CLICK'
  | 'SAVE'
  | 'UNSAVE'
  | 'SHARE'
  | 'BOOK'
  | 'SQUAD_JOIN'
  | 'BOOKING_STARTED'
  | 'BOOKING_COMPLETED'
  | 'SKIP'
  | 'DISLIKE'
  | 'ATTEND';

export interface EventInteraction {
  id: string;
  userId: string;
  eventId: string;
  category: EventCategory;
  tags?: string[];
  action: InteractionAction;
  timestamp: string;
  duration?: number; // seconds spent viewing
  sessionId?: string;
}

export interface UserInterestProfile {
  userId: string;
  interests: Record<string, number>; // e.g. { 'AI': 0.95, 'Technology': 0.88 }
  dislikedEventIds: string[];
  skippedEventIds: string[];
  bookedEventIds: string[];
  pricePreferenceAvg?: number;
  cityPreference?: string;
  updatedAt: string;
}

export interface RecommendationLog {
  id: string;
  userId: string;
  eventId: string;
  score: number;
  reason: string;
  timestamp: string;
}

export interface RecommendedEvent {
  event: Event;
  score: number;
  reason: string;
  isExploration?: boolean;
}

export interface BookingAmount {
  ticketPrice: number;
  platformFee: number;
  taxes: number;
  total: number;
}

export interface Booking {
  bookingId: string;
  userId: string;
  userEmail: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventCategory: EventCategory;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  eventAddress: string;
  eventLatitude?: number;
  eventLongitude?: number;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  seatNumbers?: string[];
  amountDetails: BookingAmount;
  paymentMethod: string;
  paymentProvider?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: 'SUCCESS' | 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
  bookingStatus: 'Confirmed' | 'Cancelled' | 'Used';
  qrCodeData: string;
  createdAt: string;
}

export interface SquadMember {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar: string;
  status: 'Accepted' | 'Pending' | 'Declined';
}

export interface MeetingPointLocation {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface OutingPlan {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  creatorId: string;
  creatorName: string;
  friends: SquadMember[];
  meetingPoint: string;
  meetingPointLocation?: MeetingPointLocation;
  meetingTime: string;
  notes: string;
  seats?: string[];
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  date?: string;
  timestamp?: string;
  read: boolean;
  type: 'booking' | 'squad' | 'reminder' | 'recommendation' | 'system';
  eventId?: string;
  link?: string;
}
