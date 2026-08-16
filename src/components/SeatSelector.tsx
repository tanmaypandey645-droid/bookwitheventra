import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Box,
  Layers,
  Eye,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Users,
  Compass,
  Heart,
  User,
  Crown,
  Glasses,
  Move3d,
  Radio,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Music,
  RotateCw,
  Sparkle,
  ZoomIn,
  ZoomOut,
  MousePointer,
  ArrowLeft,
  Tv
} from 'lucide-react';

interface SeatSelectorProps {
  quantity: number;
  selectedSeats: string[];
  occupiedSeats: string[];
  onSelectSeat: (seatId: string) => void;
  eventTitle?: string;
  venueName?: string;
}

// Seat category types like BookMyShow
type SeatSectionFilter = 'all' | 'vip' | 'couple' | 'solo' | 'group';

interface SeatDetails {
  id: string;
  row: string;
  col: number;
  rowIdx: number;
  category: 'VIP Royal Front' | 'Prime Acoustic' | 'Couple Cozy Recliner' | 'Squad Lounge' | 'Standard';
  section: SeatSectionFilter;
  distance: string;
  sightlinePercent: number;
  energyLevel: 'High Voltage / Front' | 'Pure Acoustic Focus' | 'Romantic & Intimate' | 'Squad Party' | 'Balanced';
  comfort: string;
  audioProfile: string;
  priceMultiplier: number;
  isPair?: boolean;
  sideLabel: string;
  sideDescription: string;
  sideAngle: number;
  stageShiftX: number;
  stageRotateY: number;
  stageScale: number;
  stageElevationY: number;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  quantity,
  selectedSeats,
  occupiedSeats,
  onSelectSeat,
  eventTitle = 'Live Stage Performance',
  venueName = 'Grand Auditorium Arena'
}) => {
  // Main view mode: 'map-3d' (Interactive 3D Seating Map), 'vr-360' (VR Experience & Vibe), 'venue-dollhouse' (3D Venue Architecture)
  const [viewMode, setViewMode] = useState<'map-3d' | 'vr-360' | 'venue-dollhouse'>('map-3d');
  const [sectionFilter, setSectionFilter] = useState<SeatSectionFilter>('all');
  
  // Active inspected seat for Vibe & VR
  const [activeSeat, setActiveSeat] = useState<string>('B5');
  const [isVrStereo, setIsVrStereo] = useState<boolean>(false);
  const [isAudioAmbiencePlaying, setIsAudioAmbiencePlaying] = useState<boolean>(false);
  const [lightingPreset, setLightingPreset] = useState<'concert' | 'neon' | 'acoustic' | 'cinema'>('concert');

  // VR 360 Pan Angles & Zoom
  const [panX, setPanX] = useState<number>(0); // -180 to 180 horizontal pan
  const [panY, setPanY] = useState<number>(0); // -30 to 30 vertical pitch
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.65 to 2.2 zoom
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPointerInside, setIsPointerInside] = useState<boolean>(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioOscillatorsRef = useRef<any[]>([]);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Map seat ID to specialized section and vibe data with realistic 3D perspective geometry
  const getSeatData = (seatId: string): SeatDetails => {
    const row = seatId[0] || 'B';
    const col = parseInt(seatId.slice(1) || '5', 10);
    const rIdx = Math.max(0, rows.indexOf(row));
    const colOffset = col - 5.5; // -4.5 (Far Left, Col 1) to +4.5 (Far Right, Col 10)

    // Distance calculation
    const distanceMeters = (4.5 + rIdx * 2.8).toFixed(1);
    const sightline = Math.max(85, Math.round(99 - rIdx * 1.5 - Math.abs(colOffset) * 1.2));

    // Perspective calculation relative to center stage
    let sideLabel = 'Golden Center Stage';
    let sideDescription = 'Direct head-on stage sightline • Symmetrical Dolby Atmos sound & balanced stage lighting';
    let sideAngle = 0;

    if (colOffset <= -3.0) {
      sideLabel = 'Far Left Wing';
      sideDescription = 'Stage viewed from the left wing • Left front speaker line arrays and diagonal stage depth';
      sideAngle = 28;
    } else if (colOffset <= -1.0) {
      sideLabel = 'Mid-Left Wing';
      sideDescription = 'Optimal left acoustic perspective with wide diagonal sightline to center stage';
      sideAngle = 14;
    } else if (colOffset >= 3.0) {
      sideLabel = 'Far Right Wing';
      sideDescription = 'Stage viewed from the right wing • Right front speaker line arrays and diagonal stage depth';
      sideAngle = -28;
    } else if (colOffset >= 1.0) {
      sideLabel = 'Mid-Right Wing';
      sideDescription = 'Optimal right acoustic perspective with wide diagonal sightline to center stage';
      sideAngle = -14;
    }

    // 3D spatial transformation parameters for the stage viewport
    // Shift the stage so when sitting on left, stage appears rightwards and skewed towards user
    const stageShiftX = Math.round(-colOffset * 28);
    const stageRotateY = Number((colOffset * 3.4).toFixed(1));
    const stageScale = Number(Math.max(0.72, 1.34 - rIdx * 0.08).toFixed(2));
    const stageElevationY = (rIdx - 1.5) * 6;

    const baseData = {
      rowIdx: rIdx,
      sideLabel,
      sideDescription,
      sideAngle,
      stageShiftX,
      stageRotateY,
      stageScale,
      stageElevationY,
    };

    if (row === 'A' || row === 'B') {
      return {
        id: seatId,
        row,
        col,
        category: 'VIP Royal Front',
        section: 'vip',
        distance: `${distanceMeters}m from stage`,
        sightlinePercent: sightline,
        energyLevel: 'High Voltage / Front',
        comfort: 'Plush Royal Velvet Recliner with personal service',
        audioProfile: '102 dB Live Stage Thump • Front Line Array Punch',
        priceMultiplier: 1.5,
        ...baseData
      };
    }

    if (row === 'G' || row === 'H') {
      return {
        id: seatId,
        row,
        col,
        category: 'Couple Cozy Recliner',
        section: 'couple',
        distance: `${distanceMeters}m from stage`,
        sightlinePercent: sightline,
        energyLevel: 'Romantic & Intimate',
        comfort: 'Dual Loveseat Recliner with retractable privacy divider & blanket',
        audioProfile: '88 dB Intimate Spatial Stereo • Balanced Ambience',
        priceMultiplier: 1.3,
        isPair: true,
        ...baseData
      };
    }

    if (row === 'E' || row === 'F') {
      return {
        id: seatId,
        row,
        col,
        category: 'Squad Lounge',
        section: 'group',
        distance: `${distanceMeters}m from stage`,
        sightlinePercent: sightline,
        energyLevel: 'Squad Party',
        comfort: 'Connected Bench Seating • Group Table & Armrest-Free',
        audioProfile: '94 dB 360° Stadium Surround Sound',
        priceMultiplier: 1.15,
        ...baseData
      };
    }

    // Rows C, D are Solo / Prime Acoustic
    return {
      id: seatId,
      row,
      col,
      category: 'Prime Acoustic',
      section: 'solo',
      distance: `${distanceMeters}m from stage`,
      sightlinePercent: sightline,
      energyLevel: 'Pure Acoustic Focus',
      comfort: 'Ergonomic High-Back Acoustic Chair with optimal armrests',
      audioProfile: '96 dB Perfect Golden Triangle • Dolby Atmos Center',
      priceMultiplier: 1.2,
      ...baseData
    };
  };

  // Sync selected seat with inspected vibe
  useEffect(() => {
    if (selectedSeats.length > 0) {
      setActiveSeat(selectedSeats[selectedSeats.length - 1]);
    }
  }, [selectedSeats]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      stopAudioAmbience();
    };
  }, []);

  // Synthesized Venue Ambience Engine using Web Audio API
  const startAudioAmbience = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Ambience Drone (Low warm hum)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
      gain1.gain.setValueAtTime(0.04, ctx.currentTime);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();

      // Atmospheric high harmonic shimmer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, ctx.currentTime); // A4
      gain2.gain.setValueAtTime(0.015, ctx.currentTime);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();

      audioOscillatorsRef.current = [osc1, osc2];
      setIsAudioAmbiencePlaying(true);
    } catch (e) {
      console.warn('Web Audio ambience preview unavailable:', e);
    }
  };

  const stopAudioAmbience = () => {
    audioOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    audioOscillatorsRef.current = [];
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setIsAudioAmbiencePlaying(false);
  };

  const toggleAudioAmbience = () => {
    if (isAudioAmbiencePlaying) {
      stopAudioAmbience();
    } else {
      startAudioAmbience();
    }
  };

  // 3D Stage Mouse Dragging & Wheel Zoom Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY, startPanX: panX, startPanY: panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width && rect.height) {
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setCursorPos({ x, y });
    }

    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPanX(Math.max(-170, Math.min(170, dragStartRef.current.startPanX + deltaX * 0.45)));
    setPanY(Math.max(-35, Math.min(35, dragStartRef.current.startPanY - deltaY * 0.35)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomLevel((prev) => Math.max(0.65, Math.min(2.0, prev - e.deltaY * 0.0015)));
  };

  // Touch handlers for mobile 360 pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      isDraggingRef.current = true;
      dragStartRef.current = { x: touch.clientX, y: touch.clientY, startPanX: panX, startPanY: panY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    setPanX(Math.max(-170, Math.min(170, dragStartRef.current.startPanX + deltaX * 0.5)));
    setPanY(Math.max(-35, Math.min(35, dragStartRef.current.startPanY - deltaY * 0.35)));
  };

  const currentSeatInfo = getSeatData(activeSeat);

  return (
    <div className="space-y-4">
      {/* Top Experience Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/80 p-2 rounded-2xl border border-zinc-800/90 shadow-md">
        {/* Navigation Modes */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setViewMode('map-3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'map-3d'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>3D Seating Map</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('vr-360')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'vr-360'
                ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 text-orange-300 border border-orange-400/50 shadow-[0_0_15px_rgba(249,115,22,0.25)]'
                : 'text-zinc-400 hover:text-orange-300 hover:bg-zinc-900/60'
            }`}
          >
            <Move3d className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>3D Stage View ({activeSeat})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('venue-dollhouse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'venue-dollhouse'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>Venue 3D Dollhouse</span>
          </button>
        </div>
      </div>

      {/* BookMyShow-Style Section Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider pl-1 shrink-0">
          Sections:
        </span>
        
        {[
          { id: 'all', label: 'All Seats', icon: Layers, count: '80' },
          { id: 'vip', label: 'VIP Royal Front', icon: Crown, count: '20' },
          { id: 'couple', label: 'Couple Friendly', icon: Heart, count: '20' },
          { id: 'solo', label: 'Solo Explorer', icon: User, count: '20' },
          { id: 'group', label: 'Squad / Group Lounge', icon: Users, count: '20' },
        ].map((sec) => {
          const Icon = sec.icon;
          const isSelected = sectionFilter === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSectionFilter(sec.id as SeatSectionFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20 font-black'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-zinc-950' : 'text-orange-400'}`} />
              <span>{sec.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                {sec.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= VIEW 1: ENHANCED 3D SEATING MAP ================= */}
      {viewMode === 'map-3d' && (
        <div className="space-y-4">
          {/* Curved Stage Header with Concert Lighting Glow */}
          <div className="relative w-full bg-gradient-to-r from-zinc-900 via-orange-950/30 to-zinc-900 border border-orange-500/30 rounded-2xl py-3 px-4 text-center shadow-[0_0_25px_rgba(249,115,22,0.15)] overflow-hidden">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-16 bg-gradient-to-b from-orange-400/30 to-transparent blur-xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              <p className="text-xs sm:text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-200 to-rose-300 uppercase">
                MAIN STAGE • {venueName}
              </p>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">All seats are tiered with direct acoustic sightlines to stage</p>
          </div>

          {/* 3D Tiered Perspective Seating Grid */}
          <div className="relative bg-[#080a12] border border-zinc-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-x-auto">
            {/* Ambient Lighting Rays in Background */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-orange-500/5 blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-rose-500/5 blur-3xl pointer-events-none" />

            <div className="space-y-3 min-w-[420px] pb-2">
              {rows.map((row, rIdx) => {
                const isCoupleRow = row === 'G' || row === 'H';
                const isVipRow = row === 'A' || row === 'B';
                const isGroupRow = row === 'E' || row === 'F';
                const isSoloRow = row === 'C' || row === 'D';

                // Check section filter match
                const isSectionMatch = 
                  sectionFilter === 'all' ||
                  (sectionFilter === 'vip' && isVipRow) ||
                  (sectionFilter === 'couple' && isCoupleRow) ||
                  (sectionFilter === 'group' && isGroupRow) ||
                  (sectionFilter === 'solo' && isSoloRow);

                return (
                  <div
                    key={row}
                    className={`flex items-center justify-center gap-2 transition-all ${
                      isSectionMatch ? 'opacity-100 scale-100' : 'opacity-35 scale-95 grayscale'
                    }`}
                  >
                    {/* Row Label with Category Indicator */}
                    <div className="w-16 flex items-center justify-end gap-1.5 pr-1 shrink-0">
                      {isVipRow && <Crown className="w-3 h-3 text-amber-400" />}
                      {isCoupleRow && <Heart className="w-3 h-3 text-rose-400" />}
                      {isGroupRow && <Users className="w-3 h-3 text-emerald-400" />}
                      {isSoloRow && <User className="w-3 h-3 text-sky-400" />}
                      <span className="text-xs font-mono font-black text-zinc-400 uppercase">
                        {row}
                      </span>
                    </div>

                    {/* Seats in Row */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {cols.map((col, cIdx) => {
                        const seatId = `${row}${col}`;
                        const isOccupied = occupiedSeats.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);
                        const isInspected = activeSeat === seatId;

                        // For couple rows, group by pairs (1-2, 3-4, 5-6, 7-8, 9-10)
                        const isPairDivider = isCoupleRow && col % 2 === 0 && col < 10;

                        return (
                          <React.Fragment key={seatId}>
                            <button
                              type="button"
                              disabled={isOccupied}
                              onClick={() => {
                                onSelectSeat(seatId);
                                setActiveSeat(seatId);
                              }}
                              onDoubleClick={() => {
                                setActiveSeat(seatId);
                                setViewMode('vr-360');
                              }}
                              onMouseEnter={() => setActiveSeat(seatId)}
                              title={`Seat ${seatId} (${getSeatData(seatId).category}) - Click to select • Double click for 3D Stage View`}
                              className={`relative group/seat rounded-lg font-mono text-xs font-bold transition-all duration-150 flex flex-col items-center justify-between ${
                                isCoupleRow
                                  ? 'w-8 h-9 sm:w-9 sm:h-10 p-1' // Wider couple lounger
                                  : 'w-7 h-8 sm:w-8 sm:h-9 p-0.5'
                              } ${
                                isOccupied
                                  ? 'bg-zinc-950 text-zinc-700 border border-zinc-900 cursor-not-allowed opacity-40'
                                  : isSelected
                                  ? 'bg-gradient-to-b from-orange-300 via-amber-400 to-orange-500 text-zinc-950 font-black ring-2 ring-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.8)] scale-110 z-10'
                                  : isInspected
                                  ? 'bg-zinc-800 text-white ring-1 ring-orange-400/80 shadow-md scale-105'
                                  : isVipRow
                                  ? 'bg-amber-950/40 text-amber-200 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-900/50'
                                  : isCoupleRow
                                  ? 'bg-rose-950/30 text-rose-200 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-900/40'
                                  : isGroupRow
                                  ? 'bg-emerald-950/30 text-emerald-200 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-900/40'
                                  : 'bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-orange-400/50 hover:bg-zinc-800'
                              }`}
                            >
                              {/* 3D Seat Headrest Cushion */}
                              <div
                                className={`w-full h-1.5 rounded-t-[3px] transition-colors ${
                                  isSelected
                                    ? 'bg-amber-200'
                                    : isOccupied
                                    ? 'bg-zinc-900'
                                    : isVipRow
                                    ? 'bg-amber-400/60'
                                    : isCoupleRow
                                    ? 'bg-rose-400/50'
                                    : isGroupRow
                                    ? 'bg-emerald-400/50'
                                    : 'bg-zinc-700/60'
                                }`}
                              />
                              
                              <span className="leading-none text-[11px]">{col}</span>

                              {/* Hover Quick Vibe Preview Pill */}
                              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-950/95 text-zinc-200 text-[10px] py-1 px-2 rounded-lg border border-zinc-700 whitespace-nowrap pointer-events-none opacity-0 group-hover/seat:opacity-100 transition-opacity z-30 shadow-xl hidden sm:flex items-center gap-1">
                                <span className="font-bold text-orange-300">{seatId}</span>
                                <span>• 3D View</span>
                              </div>
                            </button>

                            {/* Divider gap for couple pairs */}
                            {isPairDivider && (
                              <div className="w-1.5 h-4 border-r border-dashed border-rose-500/20 mx-0.5" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Seating Categories Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-5 pt-4 border-t border-zinc-800/80 text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40" />
                <span className="text-amber-300 font-bold">VIP Royal (Rows A-B)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-sky-500/20 border border-sky-500/40" />
                <span>Prime Acoustic (C-D)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
                <span>Squad Lounge (E-F)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500/40" />
                <span className="text-rose-300 font-bold">Couple Cozy (G-H)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-orange-400 shadow-sm" />
                <span className="text-orange-300 font-bold">Selected ({selectedSeats.length}/{quantity})</span>
              </div>
            </div>

            {/* Selected Seat Stage POV Quick Launch Banner */}
            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-[#0d101d] via-[#15192b] to-[#0d101d] border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
                  <Eye className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-white">
                      Stage POV from <strong className="text-orange-400 font-mono">Seat {activeSeat}</strong>
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-400/20 text-orange-300 font-mono border border-orange-400/30 uppercase">
                      {currentSeatInfo.sideLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 max-w-md line-clamp-1">
                    {currentSeatInfo.sideDescription}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('vr-360')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 text-zinc-950 font-black text-xs hover:brightness-110 shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95"
              >
                <Move3d className="w-3.5 h-3.5 text-zinc-950" />
                <span>Open 3D Stage View ({activeSeat})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: 3D STAGE SINGLE SCREEN EXPERIENCE ================= */}
      {viewMode === 'vr-360' && (
        <div className="space-y-4">
          {/* Main 3D Stage Single Screen Viewport */}
          <div className="relative bg-[#030407] border border-orange-500/40 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(249,115,22,0.2)]">
            
            {/* Top Stage Control Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-zinc-950/95 border-b border-zinc-800/90 z-20 relative backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                {/* Back to Seating Map Button */}
                <button
                  type="button"
                  onClick={() => setViewMode('map-3d')}
                  className="p-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
                  title="Back to Seating Map"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Map</span>
                </button>

                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-400/30 shrink-0 shadow-inner">
                  <Move3d className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>3D Stage POV</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-gradient-to-r from-orange-400 to-amber-300 text-zinc-950 font-black font-mono shadow-sm">
                        Seat {activeSeat}
                      </span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono uppercase bg-orange-500/20 text-orange-300 border border-orange-400/40">
                      {currentSeatInfo.sideLabel} ({currentSeatInfo.sideAngle > 0 ? `+${currentSeatInfo.sideAngle}° Left Angle` : currentSeatInfo.sideAngle < 0 ? `${currentSeatInfo.sideAngle}° Right Angle` : '0° Center'})
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {currentSeatInfo.category} • {currentSeatInfo.distance} • Acoustic Sightline: <strong className="text-emerald-400 font-mono">{currentSeatInfo.sightlinePercent}%</strong>
                  </p>
                </div>
              </div>

              {/* Stage Controls: Audio, Zoom, Reset */}
              <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                {/* Audio Ambience Synthesizer Button */}
                <button
                  type="button"
                  onClick={toggleAudioAmbience}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isAudioAmbiencePlaying
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm animate-pulse'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                  title="Play/Pause live venue acoustic sound preview"
                >
                  {isAudioAmbiencePlaying ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isAudioAmbiencePlaying ? 'Acoustics Live' : 'Sound Vibe'}</span>
                </button>

                {/* Zoom Out (-) */}
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.65, z - 0.15))}
                  className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs shadow-sm transition-all"
                  title="Zoom Out Stage"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Zoom Level Indicator */}
                <span className="text-[10px] font-mono font-bold text-orange-300 px-1.5 py-1 bg-zinc-950 rounded-lg border border-zinc-800">
                  {Math.round(zoomLevel * 100)}%
                </span>

                {/* Zoom In (+) */}
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                  className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs shadow-sm transition-all"
                  title="Zoom In Stage"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                {/* Reset Center Angle & Zoom */}
                <button
                  type="button"
                  onClick={() => { setPanX(0); setPanY(0); setZoomLevel(1.0); }}
                  className="p-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs flex items-center gap-1 shadow-sm transition-all"
                  title="Reset Stage View to Center"
                >
                  <RotateCw className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[10px] font-bold">Reset</span>
                </button>
              </div>
            </div>

            {/* Quick Angle Presets Bar */}
            <div className="px-3 py-1.5 bg-[#090b14] border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto scrollbar-thin">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Compass className="w-3 h-3 text-orange-400" />
                <span>POV Angle:</span>
              </span>
              {[
                { id: 'A1', label: '👈 Far Left Wing (A1)', side: 'left' },
                { id: 'B3', label: 'Left Center (B3)', side: 'left' },
                { id: 'B5', label: '🎯 Golden Center (B5)', side: 'center' },
                { id: 'B8', label: 'Right Center (B8)', side: 'right' },
                { id: 'A10', label: '👉 Far Right Wing (A10)', side: 'right' },
                { id: 'H5', label: '🛋️ Rear Balcony (H5)', side: 'balcony' }
              ].map((p) => {
                const isCurrent = activeSeat === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveSeat(p.id);
                      setPanX(0);
                      setPanY(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-zinc-950 font-black shadow-sm scale-105'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3D Interactive Stage Canvas Container - Movable with Mouse */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                handleMouseUp();
                setIsPointerInside(false);
              }}
              onMouseEnter={() => setIsPointerInside(true)}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="relative h-[340px] sm:h-[400px] cursor-grab active:cursor-grabbing select-none overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#05060d] via-[#080a14] to-[#020306]"
            >
              {/* Dynamic Follow-Spotlight Glare reflecting cursor position */}
              {isPointerInside && (
                <div
                  className="absolute w-96 h-96 rounded-full pointer-events-none transition-opacity duration-300 opacity-20 blur-3xl"
                  style={{
                    left: `${cursorPos.x}%`,
                    top: `${cursorPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(249,115,22,0.6) 0%, rgba(251,191,36,0.3) 40%, transparent 70%)'
                  }}
                />
              )}

              {/* Dynamic 3D Spatial Canvas with perspective scaling, rotation, and mouse panning */}
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                <div
                  className="absolute inset-0 transition-transform duration-75 ease-out flex items-center justify-center"
                  style={{
                    transform: `perspective(850px) scale(${zoomLevel}) rotateY(${panX}deg) rotateX(${panY}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* 1. FRONT WALL: MAIN STAGE FROM SELECTED SEAT PERSPECTIVE */}
                  <div
                    className="absolute w-[600px] sm:w-[740px] h-[300px] sm:h-[340px] flex flex-col items-center justify-end transition-all duration-300 ease-out"
                    style={{
                      transform: `translateZ(-360px) translateX(${currentSeatInfo.stageShiftX}px) translateY(${currentSeatInfo.stageElevationY}px) rotateY(${currentSeatInfo.stageRotateY}deg) scale(${currentSeatInfo.stageScale})`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Atmospheric Spotlights - Angled according to seat position */}
                    <div
                      className="absolute -top-16 left-1/4 w-40 h-80 bg-gradient-to-b from-orange-500/40 via-amber-500/20 to-transparent blur-lg transform animate-pulse transition-transform duration-300"
                      style={{
                        transform: `rotate(${-22 + currentSeatInfo.sideAngle * 0.45}deg)`
                      }}
                    />
                    <div
                      className="absolute -top-16 right-1/4 w-40 h-80 bg-gradient-to-b from-rose-500/40 via-orange-500/20 to-transparent blur-lg transform animate-pulse transition-transform duration-300"
                      style={{
                        transform: `rotate(${22 + currentSeatInfo.sideAngle * 0.45}deg)`
                      }}
                    />
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-60 bg-gradient-to-b from-amber-300/30 to-transparent blur-2xl" />

                    {/* Laser Light Beams across the Stage */}
                    <div
                      className="absolute -top-10 left-1/3 w-1 h-72 bg-gradient-to-b from-cyan-400 via-sky-300 to-transparent blur-[1px] opacity-70 transform -rotate-45 pointer-events-none"
                    />
                    <div
                      className="absolute -top-10 right-1/3 w-1 h-72 bg-gradient-to-b from-rose-400 via-pink-300 to-transparent blur-[1px] opacity-70 transform rotate-45 pointer-events-none"
                    />

                    {/* Hanging Lighting Rig Truss */}
                    <div className="w-full h-4 bg-zinc-900 border border-zinc-700 rounded-md mb-2 flex items-center justify-around px-4 shadow-xl">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((l) => (
                        <div
                          key={l}
                          className={`w-2 h-2 rounded-full shadow-md animate-ping ${
                            l % 3 === 0 ? 'bg-amber-300 shadow-[0_0_8px_#fde047]' : l % 3 === 1 ? 'bg-orange-400 shadow-[0_0_8px_#fb923c]' : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                          }`}
                          style={{ animationDuration: `${1.0 + (l % 5) * 0.2}s` }}
                        />
                      ))}
                    </div>

                    {/* Stage Left / Right Line Array Towers (Scale dynamically based on seat proximity) */}
                    <div className="w-full flex items-end justify-between px-2 sm:px-4 z-10">
                      {/* Left Line Array Tower */}
                      <div
                        className={`w-9 h-32 bg-gradient-to-b from-zinc-900 to-black border border-zinc-700 rounded-lg p-1.5 flex flex-col justify-around shadow-2xl transition-all duration-300 ${
                          currentSeatInfo.col <= 4 ? 'scale-110 border-orange-400/60 shadow-orange-500/25 ring-1 ring-orange-400/40' : 'scale-90 opacity-75'
                        }`}
                      >
                        <div className="w-full h-1.5 bg-orange-400 rounded-full" />
                        {[1, 2, 3, 4].map((sp) => (
                          <div key={sp} className="w-full h-4 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
                          </div>
                        ))}
                        <span className="text-[7px] font-mono text-zinc-400 text-center font-bold">L-ARRAY</span>
                      </div>

                      {/* Massive LED Screen on Stage with Diagonal Stage Sightline */}
                      <div className="relative flex-1 mx-2 h-[155px] sm:h-[185px] bg-gradient-to-b from-[#121528] via-[#090b16] to-black rounded-t-2xl border-2 border-orange-400/60 p-3 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(249,115,22,0.45)] overflow-hidden">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-[10px] text-orange-300 font-black backdrop-blur-sm">
                          <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                          <span>STAGE SIGHTLINE • SEAT {activeSeat} ({currentSeatInfo.sideLabel})</span>
                        </div>
                        
                        <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] line-clamp-1">
                          {eventTitle}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-amber-300 font-bold">
                            {currentSeatInfo.category}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            • {currentSeatInfo.distance}
                          </span>
                        </div>

                        {/* Dynamic Audio Visualizer */}
                        <div className="absolute bottom-2 flex items-end gap-1 opacity-90">
                          {[30, 60, 95, 75, 100, 85, 90, 55, 80, 70, 85, 50, 95, 45, 70, 90, 60, 85, 100, 75].map((h, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-gradient-to-t from-orange-500 via-amber-400 to-rose-400 rounded-t-sm animate-pulse"
                              style={{
                                height: `${h * 0.28}px`,
                                animationDuration: `${0.4 + (i % 5) * 0.15}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Right Line Array Tower */}
                      <div
                        className={`w-9 h-32 bg-gradient-to-b from-zinc-900 to-black border border-zinc-700 rounded-lg p-1.5 flex flex-col justify-around shadow-2xl transition-all duration-300 ${
                          currentSeatInfo.col >= 7 ? 'scale-110 border-orange-400/60 shadow-orange-500/25 ring-1 ring-orange-400/40' : 'scale-90 opacity-75'
                        }`}
                      >
                        <div className="w-full h-1.5 bg-orange-400 rounded-full" />
                        {[1, 2, 3, 4].map((sp) => (
                          <div key={sp} className="w-full h-4 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
                          </div>
                        ))}
                        <span className="text-[7px] font-mono text-zinc-400 text-center font-bold">R-ARRAY</span>
                      </div>
                    </div>

                    {/* Stage Floor & Live Artist Silhouettes */}
                    <div className="w-full h-16 bg-gradient-to-b from-zinc-800 to-zinc-950 border-t-2 border-orange-400/90 rounded-b-2xl flex items-center justify-between px-8 shadow-2xl relative">
                      {/* Subwoofer Stage Bins */}
                      <div className="flex gap-1.5">
                        {[1, 2].map((b) => (
                          <div key={b} className="w-7 h-9 bg-zinc-950 border border-zinc-700 rounded-t flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800" />
                          </div>
                        ))}
                      </div>

                      {/* Performer Silhouettes (Shifted dynamically with perspective angle) */}
                      <div
                        className="flex items-end gap-4 -mt-9 transition-transform duration-300"
                        style={{
                          transform: `translateX(${currentSeatInfo.sideAngle * 0.9}px)`
                        }}
                      >
                        {/* Band Member Left */}
                        <div className="w-4 h-10 bg-zinc-950 rounded-full border border-orange-400/30 flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 -mt-1" />
                        </div>
                        
                        {/* Main Lead Performer (Glowing Amber Silhouette) */}
                        <div className="w-7 h-14 bg-gradient-to-b from-orange-400 to-amber-500 rounded-full shadow-[0_0_30px_rgba(249,115,22,1)] flex flex-col items-center animate-bounce" style={{ animationDuration: '2.5s' }}>
                          <div className="w-4 h-4 rounded-full bg-amber-200 -mt-2 shadow-[0_0_12px_#fde047]" />
                        </div>
                        
                        {/* Band Member Right */}
                        <div className="w-4 h-10 bg-zinc-950 rounded-full border border-orange-400/30 flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 -mt-1" />
                        </div>
                      </div>

                      {/* Subwoofer Stage Bins */}
                      <div className="flex gap-1.5">
                        {[1, 2].map((b) => (
                          <div key={b} className="w-7 h-9 bg-zinc-950 border border-zinc-700 rounded-t flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Foreground Audience Heads for Rear / Balcony rows (Rows E-H) */}
                    {currentSeatInfo.rowIdx >= 4 && (
                      <div className="w-full flex items-end justify-around -mt-5 opacity-60 pointer-events-none px-6">
                        {[1, 2, 3, 4, 5, 6, 7].map((aud) => (
                          <div key={aud} className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800" />
                            <div className="w-6 h-3.5 bg-zinc-950 rounded-t-lg -mt-0.5" />
                            {aud % 2 === 0 && (
                              <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#ea580c] -mt-4 animate-pulse" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. LEFT AUDITORIUM WALL (Rotated 90 deg) */}
                  <div
                    className="absolute w-[460px] h-[300px] bg-gradient-to-r from-zinc-950 via-[#0a0c16] to-zinc-950 border-r border-zinc-800/80 p-4 flex flex-col justify-around transition-all duration-300"
                    style={{
                      transform: `translateX(-370px) rotateY(${90 - currentSeatInfo.stageRotateY}deg)`,
                    }}
                  >
                    <div className="space-y-1 border-l-2 border-orange-500/40 pl-3">
                      <span className="text-xs font-black text-zinc-300 uppercase">Left Wing VIP Boxes</span>
                      <p className="text-[10px] text-zinc-500">Tiered box seating with architectural wall illumination</p>
                    </div>
                    <div className="flex justify-around opacity-60">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className="w-14 h-22 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 flex flex-col items-center justify-between">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50 shadow-[0_0_10px_#f59e0b]" />
                          <span className="text-[9px] font-mono text-zinc-400 font-bold">Box L{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. RIGHT AUDITORIUM WALL (Rotated -90 deg) */}
                  <div
                    className="absolute w-[460px] h-[300px] bg-gradient-to-l from-zinc-950 via-[#0a0c16] to-zinc-950 border-l border-zinc-800/80 p-4 flex flex-col justify-around transition-all duration-300"
                    style={{
                      transform: `translateX(370px) rotateY(${-90 - currentSeatInfo.stageRotateY}deg)`,
                    }}
                  >
                    <div className="space-y-1 border-r-2 border-orange-500/40 pr-3 text-right">
                      <span className="text-xs font-black text-zinc-300 uppercase">Right Wing VIP Boxes</span>
                      <p className="text-[10px] text-zinc-500">Surround sound array and direct VIP exit corridor</p>
                    </div>
                    <div className="flex justify-around opacity-60">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className="w-14 h-22 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 flex flex-col items-center justify-between">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-400/50 shadow-[0_0_10px_#ea580c]" />
                          <span className="text-[9px] font-mono text-zinc-400 font-bold">Box R{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. REAR SOUND BOOTH & EXIT (Rotated 180 deg) */}
                  <div
                    className="absolute w-[560px] h-[300px] bg-gradient-to-b from-zinc-950 to-black border border-zinc-800/60 p-5 flex flex-col items-center justify-center text-center"
                    style={{
                      transform: 'translateZ(370px) rotateY(180deg)',
                    }}
                  >
                    <div className="p-4 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl max-w-sm">
                      <Music className="w-6 h-6 text-orange-400 mx-auto mb-1.5" />
                      <h5 className="text-xs font-black text-white">Central Sound & Lighting Console</h5>
                      <p className="text-[10px] text-zinc-400 mt-1">Master FOH Audio Desk • 64-Channel Live Atmos Stage Mixer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HUD Overlay Crosshair, Sightline Compass, & Mouse Movement Hint Banner */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 z-30">
                <div className="flex items-center justify-between">
                  <div className="bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] text-zinc-300 flex items-center gap-2 shadow-lg">
                    <Compass className="w-3.5 h-3.5 text-orange-400" />
                    <span>Azimuth: <strong className="font-mono text-white">{Math.round(panX)}°</strong></span>
                    <span className="text-zinc-600">|</span>
                    <span className="font-mono text-orange-300 font-bold">Pitch: {Math.round(panY)}°</span>
                  </div>

                  {/* Movable with Mouse Indicator Badge */}
                  <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-orange-400/40 text-[10px] text-orange-300 font-bold shadow-lg flex items-center gap-1.5">
                    <MousePointer className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                    <span>Drag Mouse to Look • Scroll to Zoom</span>
                  </div>
                </div>

                {/* Center Aim Crosshair Reticle */}
                <div className="self-center w-7 h-7 rounded-full border border-orange-400/40 flex items-center justify-center opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                </div>

                <div className="self-center bg-zinc-950/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-orange-400/40 text-[10px] text-orange-300 font-black shadow-xl flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    {panX > 45 ? 'Looking towards Right Wing' : panX < -45 ? 'Looking towards Left Wing' : Math.abs(panX) > 130 ? 'Looking Back at FOH Sound Desk' : `Direct Stage View from ${currentSeatInfo.sideLabel}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seat Vibe & Acoustic Radar Card */}
          <div className="bg-gradient-to-b from-[#0e111d] to-[#080910] border border-zinc-800/90 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div>
                <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase">
                  SEAT VIBE & SIGHTLINE RADAR
                </span>
                <h4 className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
                  <span>Seat {activeSeat}</span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 text-[11px] font-bold border border-orange-400/30">
                    {currentSeatInfo.category}
                  </span>
                </h4>
              </div>

              {/* Direct Booking Button for Current Seat */}
              <button
                type="button"
                onClick={() => onSelectSeat(activeSeat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedSeats.includes(activeSeat)
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 hover:brightness-105 shadow-md shadow-orange-400/20'
                }`}
              >
                {selectedSeats.includes(activeSeat) ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Selected</span>
                  </>
                ) : (
                  <>
                    <Sparkle className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Select Seat {activeSeat}</span>
                  </>
                )}
              </button>
            </div>

            {/* Vibe Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Energy & Atmosphere</span>
                </div>
                <p className="text-zinc-200 font-medium text-[11px]">{currentSeatInfo.energyLevel}</p>
                <p className="text-[10px] text-zinc-500">{currentSeatInfo.distance}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Acoustics & Bass Punch</span>
                </div>
                <p className="text-zinc-200 font-medium text-[11px]">{currentSeatInfo.audioProfile}</p>
                <p className="text-[10px] text-zinc-500">Acoustic line-of-sight: {currentSeatInfo.sightlinePercent}%</p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-orange-300 font-bold">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Stage Sightline Angle</span>
                </div>
                <p className="text-zinc-200 font-medium text-[11px]">{currentSeatInfo.sideLabel}</p>
                <p className="text-[10px] text-orange-400 font-mono">
                  {currentSeatInfo.sideAngle > 0 ? `+${currentSeatInfo.sideAngle}° Left Offset` : currentSeatInfo.sideAngle < 0 ? `${currentSeatInfo.sideAngle}° Right Offset` : '0° Head-On Direct'}
                </p>
              </div>

              <div className="sm:col-span-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[11px] font-bold text-zinc-200">Comfort & Space:</span>
                    <p className="text-[10px] text-zinc-400">{currentSeatInfo.comfort}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                  {currentSeatInfo.priceMultiplier}x Base Tier
                </span>
              </div>
            </div>

            {/* Quick Picker Bar for other seats inside VR mode */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400">Switch VR preview seat:</span>
              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-thin">
                {rows.map((row) => (
                  <div key={row} className="flex items-center gap-0.5 shrink-0 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <span className="w-3.5 text-[9px] font-mono font-black text-zinc-500 text-center">{row}</span>
                    {cols.map((col) => {
                      const sId = `${row}${col}`;
                      const isOcc = occupiedSeats.includes(sId);
                      const isAct = activeSeat === sId;
                      const isSel = selectedSeats.includes(sId);
                      return (
                        <button
                          key={sId}
                          type="button"
                          disabled={isOcc}
                          onClick={() => setActiveSeat(sId)}
                          className={`w-5 h-5 rounded text-[8px] font-mono font-bold flex items-center justify-center transition-all ${
                            isOcc
                              ? 'bg-zinc-950 text-zinc-800 cursor-not-allowed'
                              : isAct
                              ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-zinc-950 font-black scale-110 shadow-sm'
                              : isSel
                              ? 'bg-orange-500/80 text-white'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: VENUE 3D DOLLHOUSE ARCHITECTURE ================= */}
      {viewMode === 'venue-dollhouse' && (
        <div className="space-y-4">
          <div className="relative bg-gradient-to-b from-[#060810] to-[#020306] border border-orange-500/30 rounded-2xl p-5 shadow-2xl overflow-hidden min-h-[380px] flex flex-col items-center justify-center">
            
            {/* Header info */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-orange-400" />
                <h4 className="text-xs font-black text-white">3D Architectural Venue Model</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-orange-300 font-mono font-bold bg-orange-500/20 px-2 py-0.5 rounded">
                  Tiered Stadium Geometry
                </span>
              </div>
            </div>

            {/* 3D Dollhouse Isometric Cutaway Stage */}
            <div
              className="relative w-full max-w-md py-6 transition-all duration-300"
              style={{
                perspective: '1000px',
                transform: 'rotateX(42deg) rotateZ(-18deg) scale(0.95)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Grand Main Stage Platform */}
              <div className="w-full h-24 bg-gradient-to-r from-orange-500 via-amber-400 to-rose-600 rounded-t-3xl p-1 shadow-[0_0_50px_rgba(249,115,22,0.6)] mb-4">
                <div className="w-full h-full bg-zinc-950 rounded-t-[22px] flex flex-col items-center justify-center border-t border-orange-300/60">
                  <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-200 uppercase">
                    PROSCENIUM MAIN STAGE
                  </span>
                  <p className="text-[9px] text-zinc-400 mt-0.5">Surround Line-Array Acoustics • Dynamic LED Backdrop</p>
                </div>
              </div>

              {/* Tier 1: VIP Front Lounge Area */}
              <div className="w-full bg-amber-950/40 border border-amber-500/50 rounded-xl p-2.5 mb-2.5 shadow-lg flex items-center justify-between px-4">
                <span className="text-[10px] font-black text-amber-300 uppercase">VIP Royal Tier (Rows A-B)</span>
                <span className="text-[9px] font-mono text-amber-200">5m Proximity</span>
              </div>

              {/* Tier 2: Prime Acoustic & Solo Explorer */}
              <div className="w-full bg-sky-950/40 border border-sky-500/50 rounded-xl p-2.5 mb-2.5 shadow-lg flex items-center justify-between px-4">
                <span className="text-[10px] font-black text-sky-300 uppercase">Prime Acoustic Golden Center (Rows C-D)</span>
                <span className="text-[9px] font-mono text-sky-200">12m Center</span>
              </div>

              {/* Tier 3: Squad Party Lounges */}
              <div className="w-full bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-2.5 mb-2.5 shadow-lg flex items-center justify-between px-4">
                <span className="text-[10px] font-black text-emerald-300 uppercase">Squad Group Terrace (Rows E-F)</span>
                <span className="text-[9px] font-mono text-emerald-200">18m Elevated</span>
              </div>

              {/* Tier 4: Couple Loveseat Recliner Suite */}
              <div className="w-full bg-rose-950/40 border border-rose-500/50 rounded-xl p-2.5 shadow-lg flex items-center justify-between px-4">
                <span className="text-[10px] font-black text-rose-300 uppercase">Couple Cozy Suites (Rows G-H)</span>
                <span className="text-[9px] font-mono text-rose-200">24m Private</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 text-center mt-2">
              All 4 tiers feature dedicated entrance tunnels, ADA wheelchair access, and optimal acoustic dampening.
            </p>
          </div>
        </div>
      )}

      {/* Selected Seats Status Bar */}
      <div className="px-1 flex items-center justify-between text-xs pt-1">
        {selectedSeats.length === quantity ? (
          <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>All {quantity} seat(s) confirmed: {selectedSeats.join(', ')}</span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-orange-300 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Selected {selectedSeats.length} of {quantity} seat(s) needed</span>
          </p>
        )}

        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <span>Active:</span>
          <strong className="text-orange-300 font-mono font-bold">{activeSeat}</strong>
        </div>
      </div>
    </div>
  );
};
