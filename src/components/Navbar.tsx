import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Bell, 
  User as UserIcon, 
  Ticket, 
  Users, 
  Calendar, 
  Heart, 
  PlusCircle, 
  LogOut, 
  ShieldCheck, 
  Compass,
  MapPin
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: NotificationItem[];
  onOpenAuth: () => void;
  onOpenAI: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenAI,
  onOpenNotifications,
  onLogout,
  unreadCount
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0a0a0a]/95 backdrop-blur-md border-b border-orange-400/20 px-3 sm:px-6 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-2 sm:gap-4">
          
          {/* Left: Live & Floating Profile Section (Shows only First Name) */}
          <div className="flex items-center justify-start relative">
            {user && user.id !== 'guest' ? (
              <>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="group relative flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-full bg-gradient-to-r from-zinc-950 via-[#121218] to-zinc-950 border border-orange-500/40 hover:border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300 active:scale-95"
                >
                  {/* Avatar without green dot */}
                  <div className="relative shrink-0">
                    <UserAvatar
                      name={user.name}
                      src={user.profileImage}
                      size="sm"
                      className="w-8 h-8 sm:w-9.5 sm:h-9.5 rounded-full ring-2 ring-orange-400/60"
                    />
                  </div>

                  <div className="text-left hidden sm:flex items-center">
                    <span className="text-xs sm:text-sm font-black text-white group-hover:text-orange-300 transition-colors line-clamp-1">
                      {user.name.split(' ')[0]}
                    </span>
                  </div>
                </button>

                {/* Profile Dropdown Menu (Anchored to Left) */}
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileMenu(false)} 
                    />
                    <div className="absolute left-0 top-full mt-2.5 w-72 bg-[#0c0c10]/95 backdrop-blur-2xl border border-orange-400/30 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                      
                      {/* User Information & Real-Time Location/College Badge */}
                      <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-2 space-y-2">
                        <div>
                          <p className="text-sm font-black text-white">{user.name}</p>
                          <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                        </div>

                        {/* Real-Time Location & College Badge */}
                        <div className="p-2.5 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-400/30 rounded-lg flex items-center gap-2 text-xs font-bold text-amber-300 shadow-inner">
                          <MapPin className="w-4 h-4 text-orange-400 shrink-0 animate-bounce" />
                          <div className="text-left leading-tight overflow-hidden">
                            <p className="text-[9px] text-zinc-400 uppercase font-black tracking-wider">Live Campus Location</p>
                            <p className="text-xs font-extrabold text-amber-300 truncate">{user.college || 'KIET & Delhi NCR'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <button
                          onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 font-medium transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-orange-300" />
                          <span>My Profile & Interests</span>
                        </button>

                        <button
                          onClick={() => { setActiveTab('tickets'); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 font-medium transition-colors"
                        >
                          <Ticket className="w-4 h-4 text-orange-300" />
                          <span>My Tickets & Bookings</span>
                        </button>

                        <button
                          onClick={() => { setActiveTab('plans'); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 font-medium transition-colors"
                        >
                          <Users className="w-4 h-4 text-orange-300" />
                          <span>Squad Outing Plans</span>
                        </button>

                        {user.role === 'organizer' && (
                          <button
                            onClick={() => { setActiveTab('organizer'); setShowProfileMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 font-medium transition-colors"
                          >
                            <PlusCircle className="w-4 h-4 text-amber-300" />
                            <span>Organizer Dashboard</span>
                          </button>
                        )}

                        <button
                          onClick={() => { 
                            setShowProfileMenu(false);
                            onLogout(); 
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors mt-2 border-t border-zinc-800/80 pt-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 text-zinc-950 text-xs font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
              >
                <UserIcon className="w-4 h-4 text-zinc-950" />
                <span>Login / Register</span>
              </button>
            )}
          </div>

          {/* Center: Enlarged Heavy, Bold EVENTRA Branding */}
          <div className="flex items-center justify-center text-center">
            <button 
              onClick={() => setActiveTab('home')}
              className="group flex items-center justify-center gap-2.5 sm:gap-3 focus:outline-none"
            >
              <div className="w-10 h-10 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-400 to-rose-500 p-[2.5px] shadow-[0_0_25px_rgba(249,115,22,0.55)] group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-[#08080a] rounded-[13px] flex items-center justify-center font-black text-orange-400 text-2xl sm:text-3xl md:text-4xl tracking-tighter shadow-inner">
                  E
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 drop-shadow-[0_6px_35px_rgba(249,115,22,0.75)] uppercase font-sans select-none transition-all group-hover:brightness-110">
                EVENTRA
              </h1>
            </button>
          </div>

          {/* Right: Notifications Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 sm:p-3 rounded-full bg-gradient-to-r from-zinc-900 via-[#121218] to-zinc-900 border border-zinc-800 hover:border-orange-400/50 text-zinc-300 hover:text-white transition-all shadow-md group active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-orange-300 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-amber-400 text-zinc-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Floating Curved Live Navigation Band with Generous Spacing */}
        <div className="flex justify-center w-full pt-4 sm:pt-5 pb-1 px-2">
          <nav 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="relative flex items-center gap-1.5 sm:gap-2 bg-[#0d0d12]/90 backdrop-blur-2xl border border-orange-500/40 p-2 sm:p-2.5 rounded-full shadow-[0_12px_40px_rgba(249,115,22,0.25)] hover:shadow-[0_16px_50px_rgba(249,115,22,0.35)] transition-all duration-300 overflow-x-auto max-w-full no-scrollbar group"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/10 via-amber-400/15 to-rose-500/10 opacity-70 blur-md pointer-events-none" />

            <button
              onClick={() => setActiveTab('home')}
              className={`relative z-10 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 shrink-0 ${
                activeTab === 'home' || activeTab === 'discover'
                  ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Discover</span>
            </button>

            <button
              onClick={() => setActiveTab('myday')}
              className={`relative z-10 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 shrink-0 ${
                activeTab === 'myday' 
                  ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>My Day</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`relative z-10 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 shrink-0 ${
                activeTab === 'tickets' 
                  ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Ticket className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>My Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`relative z-10 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 shrink-0 ${
                activeTab === 'plans' 
                  ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Squad Mode</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`relative z-10 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 shrink-0 ${
                activeTab === 'favorites' 
                  ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Saved</span>
            </button>

            {user.role === 'organizer' && (
              <button
                onClick={() => setActiveTab('organizer')}
                className={`relative z-10 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-300 shrink-0 ${
                  activeTab === 'organizer' 
                    ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                    : 'text-amber-300 hover:bg-amber-400/10'
                }`}
              >
                <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span>Organizer Hub</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Global Floating Round Eventra AI Assistant Button (Positioned safely above mobile bottom nav and in bottom-right on desktop) */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 sm:bottom-8 sm:right-8 z-40 pointer-events-auto">
        <button
          onClick={onOpenAI}
          title="Ask Eventra AI Assistant"
          className="group relative flex items-center justify-center focus:outline-none"
        >
          {/* Pulsing Backlight Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-rose-500 blur-xl opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 animate-pulse" />

          {/* Main Floating Circle */}
          <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-rose-500 p-[2px] sm:p-[2.5px] shadow-[0_10px_35px_rgba(249,115,22,0.6)] group-hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0a0d] rounded-full flex flex-col items-center justify-center text-orange-300 group-hover:bg-[#121218] transition-colors">
              <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-amber-300 animate-pulse" />
              <span className="text-[7.5px] sm:text-[8px] font-black tracking-widest text-orange-400 uppercase mt-0.5">AI</span>
            </div>
          </div>

          {/* Floating Badge Label */}
          <div className="absolute -top-2 -left-2 sm:-top-2.5 sm:-left-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-zinc-950 font-black text-[8px] sm:text-[9px] uppercase tracking-wider shadow-lg pointer-events-none border border-orange-300/40">
            Ask AI
          </div>
        </button>
      </div>
    </>
  );
};
