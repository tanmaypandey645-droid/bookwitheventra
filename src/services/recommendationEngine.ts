import { Event, User, Booking, OutingPlan, EventInteraction, UserInterestProfile, RecommendationLog, RecommendedEvent, InteractionAction, EventCategory } from '../types';
import { StorageService } from './storage';

export const BEHAVIOR_WEIGHTS: Record<InteractionAction | 'LONG_VIEW' | 'SHORT_VIEW', number> = {
  BOOKING_COMPLETED: 10,
  ATTEND: 10,
  SAVE: 8,
  SQUAD_JOIN: 8,
  SHARE: 6,
  LONG_VIEW: 5,        // view duration > 60s
  CLICK: 3,
  BOOKING_STARTED: 3,
  BOOK: 3,
  SHORT_VIEW: 1,       // view duration 5s - 20s
  UNSAVE: -2,
  SKIP: -2,
  DISLIKE: -8,
  VIEW: 1
};

export class RecommendationEngine {
  /**
   * Track a user behavioral interaction and update their interest profile real-time.
   */
  static trackInteraction(
    userId: string,
    eventId: string,
    action: InteractionAction,
    eventData?: Partial<Event>,
    duration: number = 0
  ) {
    if (!userId || userId === 'guest') return;

    // Load full event if missing
    const allEvents = StorageService.getEvents();
    const event = eventData?.category ? (eventData as Event) : allEvents.find(e => e.id === eventId);
    
    if (!event) return;

    const timestamp = new Date().toISOString();
    const interaction: EventInteraction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      eventId,
      category: event.category,
      tags: event.tags || [event.category],
      action,
      timestamp,
      duration
    };

    // Save interaction
    StorageService.saveInteraction(interaction);

    // Update User Interest Profile
    this.updateUserInterestProfile(userId, interaction, event);
  }

  /**
   * Update or refine the user's interest profile based on recent interaction.
   */
  private static updateUserInterestProfile(userId: string, interaction: EventInteraction, event: Event) {
    const profile = StorageService.getUserInterestProfile(userId);
    let delta = 0;

    // Determine numerical impact based on action and view duration
    if (interaction.action === 'VIEW') {
      if (interaction.duration && interaction.duration > 60) {
        delta = BEHAVIOR_WEIGHTS.LONG_VIEW;
      } else if (interaction.duration && interaction.duration >= 5) {
        delta = BEHAVIOR_WEIGHTS.SHORT_VIEW;
      } else {
        delta = 0.5; // mild view
      }
    } else if (interaction.action === 'DISLIKE') {
      delta = BEHAVIOR_WEIGHTS.DISLIKE;
      if (!profile.dislikedEventIds.includes(interaction.eventId)) {
        profile.dislikedEventIds.push(interaction.eventId);
      }
    } else if (interaction.action === 'SKIP') {
      delta = BEHAVIOR_WEIGHTS.SKIP;
      if (!profile.skippedEventIds.includes(interaction.eventId)) {
        profile.skippedEventIds.push(interaction.eventId);
      }
    } else if (interaction.action === 'BOOKING_COMPLETED') {
      delta = BEHAVIOR_WEIGHTS.BOOKING_COMPLETED;
      if (!profile.bookedEventIds.includes(interaction.eventId)) {
        profile.bookedEventIds.push(interaction.eventId);
      }
    } else {
      delta = BEHAVIOR_WEIGHTS[interaction.action] || 1;
    }

    // Apply category & tag increments
    const catKey = `category:${event.category}`;
    profile.interests[catKey] = Math.max(0, (profile.interests[catKey] || 0) + delta * 0.1);

    const tags = event.tags || [event.category];
    tags.forEach(tag => {
      const tagKey = `tag:${tag}`;
      profile.interests[tagKey] = Math.max(0, (profile.interests[tagKey] || 0) + delta * 0.08);
    });

    // Update price preference average if user booked or saved event
    if (['BOOKING_COMPLETED', 'SAVE'].includes(interaction.action)) {
      const minPrice = Math.min(...event.ticketTypes.map(t => t.price));
      if (profile.pricePreferenceAvg) {
        profile.pricePreferenceAvg = Math.round((profile.pricePreferenceAvg * 0.7) + (minPrice * 0.3));
      } else {
        profile.pricePreferenceAvg = minPrice;
      }
    }

    // Update location preference
    if (event.city) {
      profile.cityPreference = event.city;
    }

    profile.updatedAt = new Date().toISOString();
    StorageService.saveUserInterestProfile(profile);
  }

  /**
   * Main Personalized Recommendation Logic
   * Generates prioritized list of RecommendedEvent objects with dynamic explanations.
   */
  static getRecommendations(
    userId: string,
    allEvents: Event[],
    allBookings: Booking[],
    allPlans: OutingPlan[],
    limit: number = 6
  ): RecommendedEvent[] {
    const currentUser = StorageService.getCurrentUser();

    // Check if recommendations are disabled in profile settings
    if (currentUser && currentUser.personalizedRecommendationsEnabled === false) {
      return this.getColdStartRecommendations(allEvents, currentUser, limit);
    }

    const isGuest = !userId || userId === 'guest';
    const profile = isGuest ? null : StorageService.getUserInterestProfile(userId);
    const userInteractions = isGuest ? [] : StorageService.getInteractions(userId);
    const userBookings = isGuest ? [] : allBookings.filter(b => b.userId === userId);
    const userPlans = isGuest ? [] : allPlans.filter(p => p.friends.some(f => f.id === userId));

    // COLD START DETECTION: If user has < 2 interactions and 0 bookings, serve cold-start popular/trending events
    if (isGuest || (!profile || (userInteractions.length < 2 && userBookings.length === 0))) {
      return this.getColdStartRecommendations(allEvents, currentUser, limit);
    }

    // Set of booked event IDs to avoid recommending already booked events
    const bookedEventIds = new Set(userBookings.map(b => b.eventId));
    const dislikedEventIds = new Set(profile.dislikedEventIds || []);

    // Get last booked event for explicit context ("Because you booked X")
    const lastBooking = userBookings.length > 0 ? userBookings[0] : null;
    const lastBookedEvent = lastBooking ? allEvents.find(e => e.id === lastBooking.eventId) : null;

    // Build tag & category weight lookup with time decay
    const tagWeights: Record<string, number> = {};
    const categoryWeights: Record<string, number> = {};

    // 1. Ingest profile interests
    Object.entries(profile.interests || {}).forEach(([key, score]) => {
      if (key.startsWith('category:')) {
        categoryWeights[key.replace('category:', '')] = score;
      } else if (key.startsWith('tag:')) {
        tagWeights[key.replace('tag:', '')] = score;
      }
    });

    // 2. Ingest interactions with exponential recency decay
    const now = Date.now();
    userInteractions.forEach(i => {
      const daysAgo = (now - new Date(i.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.exp(-0.1 * daysAgo); // Decay over time
      const actWeight = (BEHAVIOR_WEIGHTS[i.action] || 1) * recencyFactor;

      categoryWeights[i.category] = (categoryWeights[i.category] || 0) + actWeight * 0.15;
      (i.tags || []).forEach(tag => {
        tagWeights[tag] = (tagWeights[tag] || 0) + actWeight * 0.12;
      });
    });

    // Score candidate events
    const scoredCandidates: RecommendedEvent[] = [];

    for (const event of allEvents) {
      // Exclude already booked or disliked events
      if (bookedEventIds.has(event.id) || dislikedEventIds.has(event.id)) {
        continue;
      }

      let score = 0;
      let primaryReason = '';

      // A. Category match
      const catWeight = categoryWeights[event.category] || 0;
      score += catWeight * 20;

      // B. Tag similarity score
      let tagMatchCount = 0;
      const eventTags = event.tags || [event.category];
      eventTags.forEach(tag => {
        if (tagWeights[tag]) {
          score += tagWeights[tag] * 15;
          tagMatchCount++;
        }
      });

      // C. Booking Similarity (Strongest Signal +10 Boost if similar to booked event)
      let matchedBookedTitle = '';
      if (lastBookedEvent) {
        if (event.category === lastBookedEvent.category) {
          score += 35;
          matchedBookedTitle = lastBookedEvent.title;
        }
        const commonTags = (event.tags || []).filter(t => (lastBookedEvent.tags || []).includes(t));
        if (commonTags.length > 0) {
          score += commonTags.length * 20;
          if (!matchedBookedTitle) matchedBookedTitle = lastBookedEvent.title;
        }
      }

      // D. Squad match (If squad members are planning events in this category)
      let isSquadMatch = false;
      userPlans.forEach(plan => {
        if (plan.eventId === event.id || plan.eventTitle.includes(event.category)) {
          score += 25;
          isSquadMatch = true;
        }
      });

      // E. Location preference (Proximity match)
      if (currentUser && currentUser.city && event.city.toLowerCase() === currentUser.city.toLowerCase()) {
        score += 15;
      }

      // F. Price preference match
      const lowestTicketPrice = Math.min(...event.ticketTypes.map(t => t.price));
      if (profile.pricePreferenceAvg) {
        const priceDiff = Math.abs(lowestTicketPrice - profile.pricePreferenceAvg);
        if (priceDiff <= 200) {
          score += 10;
        }
      }

      // G. Popularity baseline
      score += (event.popularityScore || 50) * 0.1;

      // H. Penalty for skipped events
      const skipCount = (profile.skippedEventIds || []).filter(id => id === event.id).length;
      if (skipCount > 0) {
        score -= skipCount * 8;
      }

      // Generate Human-Readable Explanation Badge Reason
      if (matchedBookedTitle) {
        primaryReason = `Because you booked "${matchedBookedTitle.length > 28 ? matchedBookedTitle.substring(0, 28) + '...' : matchedBookedTitle}"`;
      } else if (isSquadMatch) {
        primaryReason = 'Picked for your Squad Outings';
      } else if (tagMatchCount >= 2) {
        const topMatchedTags = eventTags.filter(t => tagWeights[t] > 0).slice(0, 2);
        primaryReason = `Matches your interest in ${topMatchedTags.join(' & ')}`;
      } else if (catWeight > 2) {
        primaryReason = `Recommended for ${event.category} lovers`;
      } else if (currentUser && currentUser.city && event.city.toLowerCase() === currentUser.city.toLowerCase()) {
        primaryReason = `Trending in ${event.city}`;
      } else {
        primaryReason = 'Highly rated on Eventra';
      }

      scoredCandidates.push({
        event,
        score: Math.round(score),
        reason: primaryReason,
        isExploration: false
      });
    }

    // Sort by final composite score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Personalization vs Exploration Split (70% Personalized, 30% Discovery)
    const personalizedCount = Math.ceil(limit * 0.7); // 4 for limit 6
    const explorationCount = limit - personalizedCount; // 2 for limit 6

    const topPersonalized = scoredCandidates.slice(0, personalizedCount);

    // Select exploration candidates from outside top personalized categories
    const personalizedCategories = new Set(topPersonalized.map(p => p.event.category));
    const explorationCandidates = scoredCandidates
      .slice(personalizedCount)
      .filter(c => !personalizedCategories.has(c.event.category))
      .slice(0, explorationCount);

    // If not enough distinct exploration candidates, backfill from remaining candidates
    if (explorationCandidates.length < explorationCount) {
      const remainingNeeded = explorationCount - explorationCandidates.length;
      const backfill = scoredCandidates
        .slice(personalizedCount)
        .filter(c => !explorationCandidates.some(ec => ec.event.id === c.event.id))
        .slice(0, remainingNeeded);
      explorationCandidates.push(...backfill);
    }

    // Mark exploration candidates
    explorationCandidates.forEach(item => {
      item.isExploration = true;
      item.reason = `Discover New: ${item.event.category}`;
    });

    const finalRecommendations = [...topPersonalized, ...explorationCandidates];

    // Log recommendation batch
    const logs: RecommendationLog[] = finalRecommendations.map(r => ({
      id: `rec_${Date.now()}_${r.event.id}`,
      userId,
      eventId: r.event.id,
      score: r.score,
      reason: r.reason,
      timestamp: new Date().toISOString()
    }));
    StorageService.saveRecommendationLogs(logs);

    return finalRecommendations;
  }

  /**
   * Cold Start fallback recommendations for new users or guests.
   */
  private static getColdStartRecommendations(allEvents: Event[], user: User | null, limit: number): RecommendedEvent[] {
    const userCity = user?.city || 'Ghaziabad';
    
    // Sort events by popularityScore and proximity
    const sorted = [...allEvents].sort((a, b) => {
      const aCityMatch = a.city.toLowerCase() === userCity.toLowerCase() ? 20 : 0;
      const bCityMatch = b.city.toLowerCase() === userCity.toLowerCase() ? 20 : 0;
      return (b.popularityScore || 50) + bCityMatch - ((a.popularityScore || 50) + aCityMatch);
    });

    return sorted.slice(0, limit).map((event, idx) => {
      let reason = 'Popular Campus Event';
      if (event.city.toLowerCase() === userCity.toLowerCase()) {
        reason = `Trending in ${event.city}`;
      } else if (idx === 0) {
        reason = '🔥 #1 Most Popular This Week';
      } else if (event.category === 'College Fest' || event.category === 'Hackathon') {
        reason = `Top rated ${event.category}`;
      }

      return {
        event,
        score: (event.popularityScore || 80) + (10 - idx),
        reason,
        isExploration: idx % 2 === 1
      };
    });
  }

  /**
   * Analytics Summary for the recommendation engine
   */
  static getAnalyticsSummary(userId: string) {
    const interactions = StorageService.getInteractions(userId);
    const logs = StorageService.getRecommendationLogs(userId);

    const impressions = logs.length;
    const clicks = interactions.filter(i => i.action === 'CLICK').length;
    const bookings = interactions.filter(i => i.action === 'BOOKING_COMPLETED').length;
    const totalDuration = interactions.reduce((sum, i) => sum + (i.duration || 0), 0);
    const avgDuration = interactions.length > 0 ? Math.round(totalDuration / interactions.length) : 0;

    return {
      totalImpressions: impressions,
      totalClicks: clicks,
      totalBookings: bookings,
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) + '%' : '0%',
      conversionRate: clicks > 0 ? ((bookings / clicks) * 100).toFixed(1) + '%' : '0%',
      avgViewDurationSec: avgDuration
    };
  }
}
