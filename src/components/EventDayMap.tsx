import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Users, 
  Compass, 
  Layers, 
  Locate, 
  ExternalLink, 
  Clock, 
  Route, 
  Calendar,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { Event, OutingPlan, MeetingPointLocation } from '../types';

interface EventDayMapProps {
  event: Event;
  plan?: OutingPlan;
  className?: string;
}

// Haversine formula to compute great-circle distance in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate road transit time in minutes (~32 km/h average in urban NCR + 5 min buffer)
function estimateTravelTimeMinutes(distanceKm: number): number {
  if (distanceKm <= 0.1) return 1;
  const estimatedHours = (distanceKm * 1.25) / 32; // 1.25 winding factor
  return Math.max(3, Math.round(estimatedHours * 60));
}

export const EventDayMap: React.FC<EventDayMapProps> = ({
  event,
  plan,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [mapLayerType, setMapLayerType] = useState<'voyager' | 'dark'>('dark');

  // Venue coordinates (guaranteed fallback to event defaults)
  const venueLat = event.latitude || 28.7523;
  const venueLng = event.longitude || 77.4988;
  const venueName = event.venueName || event.venue || 'Event Venue';
  const venueAddress = event.address || `${event.city}, India`;

  // Resolved Meeting point location
  const meetingLocation: MeetingPointLocation | null = React.useMemo(() => {
    if (!plan || !plan.meetingPoint) return null;
    if (plan.meetingPointLocation && plan.meetingPointLocation.latitude && plan.meetingPointLocation.longitude) {
      return plan.meetingPointLocation;
    }
    // Smart landmark coordinate resolver for known hubs / offsets relative to event
    const nameLower = plan.meetingPoint.toLowerCase();
    if (nameLower.includes('shaheed sthal') || nameLower.includes('metro gate 2') || nameLower.includes('bus stop')) {
      return {
        name: plan.meetingPoint,
        address: 'Shaheed Sthal (New Bus Adda) Metro Station, Red Line, Ghaziabad',
        latitude: 28.6712,
        longitude: 77.4121
      };
    }
    if (nameLower.includes('hauz khas') || nameLower.includes('iit gate')) {
      return {
        name: plan.meetingPoint,
        address: 'Hauz Khas Metro Interchange, Yellow & Magenta Line, New Delhi',
        latitude: 28.5432,
        longitude: 77.2065
      };
    }
    if (nameLower.includes('botanical') || nameLower.includes('sector 18') || nameLower.includes('noida')) {
      return {
        name: plan.meetingPoint,
        address: 'Botanical Garden Metro Station & Bus Hub, Noida',
        latitude: 28.5645,
        longitude: 77.3340
      };
    }
    if (nameLower.includes('cyber hub') || nameLower.includes('sikanderpur') || nameLower.includes('gurugram')) {
      return {
        name: plan.meetingPoint,
        address: 'Cyber Hub Gateway & Rapid Metro Station, Gurugram',
        latitude: 28.4915,
        longitude: 77.0870
      };
    }
    // Default smart offset for campus main gate / nearby transit (~1.2 km away)
    return {
      name: plan.meetingPoint,
      address: `Near ${venueName}, ${event.city}`,
      latitude: venueLat - 0.0095,
      longitude: venueLng - 0.0082
    };
  }, [plan, venueLat, venueLng, venueName, event.city]);

  // Route calculations
  const routeStats = React.useMemo(() => {
    if (!meetingLocation) return null;
    const distanceKm = calculateHaversineDistance(
      meetingLocation.latitude,
      meetingLocation.longitude,
      venueLat,
      venueLng
    );
    const roundedDist = Number(distanceKm.toFixed(1));
    const estTime = estimateTravelTimeMinutes(distanceKm);
    return {
      distanceKm: roundedDist,
      estTimeMinutes: estTime
    };
  }, [meetingLocation, venueLat, venueLng]);

  // Distance from user to venue (if GPS enabled)
  const userToVenueDistance = React.useMemo(() => {
    if (!userLocation) return null;
    const dist = calculateHaversineDistance(userLocation.lat, userLocation.lng, venueLat, venueLng);
    return {
      distanceKm: Number(dist.toFixed(1)),
      estTime: estimateTravelTimeMinutes(dist)
    };
  }, [userLocation, venueLat, venueLng]);

  // Tile layer URLs
  const tileLayers = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  };

  // Initialize and update map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // If map already initialized, clear previous instance safely
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 1. Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: [venueLat, venueLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false, // Prevents unintended page scroll disruption
    });

    mapInstanceRef.current = map;

    // 2. Add Base Tile Layer
    const activeTileUrl = tileLayers[mapLayerType];
    L.tileLayer(activeTileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // 3. Feature group for markers and bounds
    const featureGroup = L.featureGroup().addTo(map);
    markersGroupRef.current = featureGroup;

    // ==========================================
    // MARKER 1: EVENT VENUE MARKER (📍 🔵)
    // ==========================================
    const venueIcon = L.divIcon({
      className: 'custom-venue-pin',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-12 h-12 rounded-full bg-cyan-500/25 animate-ping opacity-75"></div>
          <div class="absolute w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 opacity-90 blur-sm"></div>
          <div class="relative w-9 h-9 rounded-full bg-[#0a0f1d] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)] text-cyan-300 transform transition-transform hover:scale-110">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-[#0a0f1d]/90 border border-cyan-500/40 text-[10px] font-black text-cyan-300 whitespace-nowrap shadow-lg uppercase tracking-wider">
            📍 Event Venue
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -22]
    });

    const venuePopupHtml = `
      <div class="p-3.5 space-y-2 text-zinc-200 min-w-[240px]">
        <div class="flex items-center gap-1.5 text-cyan-400 font-extrabold text-[11px] uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          OFFICIAL EVENT VENUE
        </div>
        <div>
          <h4 class="font-black text-white text-sm leading-tight">${event.title}</h4>
          <p class="text-xs font-bold text-zinc-300 mt-1 flex items-center gap-1">
            <span>📍</span> <span>${venueName}</span>
          </p>
          <p class="text-[11px] text-zinc-400">${venueAddress}</p>
        </div>
        <div class="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
          <span>📅 ${event.date}</span>
          <span class="text-amber-300">⏰ ${event.startTime}</span>
        </div>
        <div class="pt-2">
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=${venueLat},${venueLng}"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 text-center"
          >
            <span>🧭 Navigate Here</span>
          </a>
        </div>
      </div>
    `;

    const venueMarker = L.marker([venueLat, venueLng], { icon: venueIcon })
      .bindPopup(venuePopupHtml, { maxWidth: 300 })
      .addTo(featureGroup);

    // ==========================================
    // MARKER 2: SQUAD MEETING POINT (📍 🟠)
    // ==========================================
    if (meetingLocation) {
      const meetingIcon = L.divIcon({
        className: 'custom-meeting-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-12 h-12 rounded-full bg-orange-500/25 animate-ping opacity-75"></div>
            <div class="absolute w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 opacity-90 blur-sm"></div>
            <div class="relative w-9 h-9 rounded-full bg-[#180e06] border-2 border-orange-400 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.8)] text-orange-400 transform transition-transform hover:scale-110">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-[#180e06]/90 border border-orange-500/40 text-[10px] font-black text-orange-300 whitespace-nowrap shadow-lg uppercase tracking-wider">
              🟠 Squad Meeting Point
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22]
      });

      const meetingPopupHtml = `
        <div class="p-3.5 space-y-2 text-zinc-200 min-w-[240px]">
          <div class="flex items-center gap-1.5 text-orange-400 font-extrabold text-[11px] uppercase tracking-wider">
            <span class="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            SQUAD MEETING POINT
          </div>
          <div>
            <h4 class="font-black text-white text-sm leading-tight">${meetingLocation.name}</h4>
            <p class="text-[11px] text-zinc-400 mt-0.5">${meetingLocation.address || 'Designated Squad Outing Spot'}</p>
          </div>
          ${plan?.meetingTime ? `
            <div class="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-300 flex items-center justify-between">
              <span>⏰ Meeting Time:</span>
              <span class="font-mono text-amber-300">${plan.meetingTime}</span>
            </div>
          ` : ''}
          ${plan?.notes ? `
            <p class="text-[11px] text-zinc-300 italic bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              📝 "${plan.notes}"
            </p>
          ` : ''}
          <div class="pt-2 flex items-center gap-2">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${meetingLocation.latitude},${meetingLocation.longitude}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 text-center"
            >
              <span>🧭 Navigate to Meeting</span>
            </a>
          </div>
        </div>
      `;

      L.marker([meetingLocation.latitude, meetingLocation.longitude], { icon: meetingIcon })
        .bindPopup(meetingPopupHtml, { maxWidth: 300 })
        .addTo(featureGroup);

      // ==========================================
      // ROUTE: POLYLINE BETWEEN MEETING POINT & EVENT
      // ==========================================
      const latlngs: [number, number][] = [
        [meetingLocation.latitude, meetingLocation.longitude],
        [venueLat, venueLng]
      ];

      // Outer glow line
      L.polyline(latlngs, {
        color: '#f97316',
        weight: 6,
        opacity: 0.4,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(featureGroup);

      // Main dashed route line
      const routeLine = L.polyline(latlngs, {
        color: '#fbbf24',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(featureGroup);

      routePolylineRef.current = routeLine;
    }

    // ==========================================
    // MARKER 3: USER CURRENT LOCATION (📍 🟢)
    // ==========================================
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full bg-emerald-500/30 animate-ping"></div>
            <div class="relative w-8 h-8 rounded-full bg-[#06170e] border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.9)] text-emerald-300">
              <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
            </div>
            <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-[#06170e]/95 border border-emerald-500/40 text-[9px] font-black text-emerald-300 whitespace-nowrap">
              🟢 You Are Here
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const userPopupHtml = `
        <div class="p-3 space-y-1.5 text-zinc-200 min-w-[200px]">
          <div class="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            YOUR CURRENT POSITION
          </div>
          <p class="text-xs text-zinc-300">Device GPS accurately located.</p>
          ${userToVenueDistance ? `
            <div class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-300">
              📍 ~${userToVenueDistance.distanceKm} km to Event Venue (~${userToVenueDistance.estTime} mins)
            </div>
          ` : ''}
        </div>
      `;

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup(userPopupHtml)
        .addTo(featureGroup);
    }

    // 4. Fit bounds to include all markers seamlessly
    if (featureGroup.getLayers().length > 1) {
      map.fitBounds(featureGroup.getBounds(), {
        padding: [45, 45],
        maxZoom: 15
      });
    } else {
      map.setView([venueLat, venueLng], 14);
    }

    // Force tile recalculation after layout animation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [venueLat, venueLng, venueName, venueAddress, meetingLocation, userLocation, mapLayerType, event]);

  // Request User Location with graceful fallback
  const handleLocateUser = () => {
    if (userLocation) {
      // If already located, just pan and recenter
      if (mapInstanceRef.current && markersGroupRef.current) {
        mapInstanceRef.current.fitBounds(markersGroupRef.current.getBounds(), { padding: [40, 40] });
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setTimeout(() => setLocationStatus(null), 4000);
      return;
    }

    setIsLocating(true);
    setLocationStatus('Accessing device GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocationStatus('Location found! Distance calculated.');
        setTimeout(() => setLocationStatus(null), 3500);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation access issue:', err.message);
        setLocationStatus('Location permission was not granted. Showing venue on map.');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Recenter map on event venue
  const handleRecenterVenue = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([venueLat, venueLng], 15, { animate: true });
    }
  };

  // Fit all active points
  const handleFitAll = () => {
    if (mapInstanceRef.current && markersGroupRef.current) {
      mapInstanceRef.current.fitBounds(markersGroupRef.current.getBounds(), { padding: [50, 50], animate: true });
    }
  };

  // Dynamic Google Maps Directions URL
  const directionsUrl = React.useMemo(() => {
    // If meeting point exists, provide route from meeting point to event venue
    if (meetingLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(meetingLocation.latitude + ',' + meetingLocation.longitude)}&destination=${encodeURIComponent(venueLat + ',' + venueLng)}&travelmode=driving`;
    }
    // Fallback directly to venue coordinates
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueLat + ',' + venueLng)}`;
  }, [meetingLocation, venueLat, venueLng]);

  return (
    <div className={`bg-[#0c0c11] border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl relative ${className}`}>
      
      {/* Top Map Action Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-950 via-[#101017] to-zinc-950 border-b border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-300" />
              LIVE EVENT DAY VENUE & ROUTE MAP
            </span>
          </div>
          <h3 className="font-extrabold text-white text-base sm:text-lg mt-1 flex items-center gap-2">
            <span>{venueName}</span>
            <span className="text-zinc-500 text-xs font-normal">({event.city})</span>
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Recenter button */}
          <button
            onClick={handleRecenterVenue}
            title="Recenter on Event Venue"
            className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-bold">Venue</span>
          </button>

          {/* Fit all bounds */}
          {meetingLocation && (
            <button
              onClick={handleFitAll}
              title="Show Full Route View"
              className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline font-bold">Full Route</span>
            </button>
          )}

          {/* Locate Me Button */}
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            title="Show My Current Location"
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              userLocation
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-400' : userLocation ? 'text-emerald-400' : 'text-zinc-400'}`} />
            <span>{isLocating ? 'Locating...' : userLocation ? 'GPS Active' : 'Locate Me'}</span>
          </button>

          {/* Map Style Toggle */}
          <button
            onClick={() => setMapLayerType(mapLayerType === 'dark' ? 'voyager' : 'dark')}
            title="Switch Map Theme"
            className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-semibold">{mapLayerType === 'dark' ? 'Dark' : 'Street'}</span>
          </button>

          {/* Prominent GET DIRECTIONS Button */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:brightness-105 active:scale-95 text-zinc-950 font-black text-xs shadow-md shadow-orange-400/20 flex items-center gap-1.5 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>Get Directions</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* Route & Status Banner Overlay */}
      {routeStats && (
        <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent px-4 py-2.5 border-b border-orange-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200 font-bold">
            <Route className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              Squad Meeting Point <span className="text-orange-400 font-extrabold">➔</span> Event Venue
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-300 font-mono text-[11px]">
            <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-orange-500/20">
              🚗 <strong>~{routeStats.distanceKm} km</strong>
            </span>
            <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/20 text-amber-300">
              <Clock className="w-3 h-3 text-amber-400" /> <strong>~{routeStats.estTimeMinutes} mins</strong>
            </span>
          </div>
        </div>
      )}

      {/* Temporary Toast for Geolocation Notification */}
      {locationStatus && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl bg-zinc-900/95 border border-orange-400/40 text-xs font-bold text-white shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Info className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{locationStatus}</span>
        </div>
      )}

      {/* Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[320px] sm:h-[380px] md:h-[420px] z-10 eventra-map-container"
      />

      {/* Legend & Location Badges Footer */}
      <div className="p-3.5 bg-zinc-950 border-t border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Venue Marker Legend */}
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <span>📍 Event Venue: {venueName}</span>
          </div>

          {/* Meeting Point Legend */}
          {meetingLocation && (
            <div className="flex items-center gap-1.5 text-orange-300 font-bold text-[11px]">
              <span className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
              <span>🟠 Squad Meeting: {meetingLocation.name}</span>
            </div>
          )}

          {/* User Location Legend */}
          {userLocation && (
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span>🟢 You Are Here (~{userToVenueDistance?.distanceKm} km away)</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-zinc-500">
          Tap markers for full event address, meeting time, and navigation
        </p>
      </div>

    </div>
  );
};
