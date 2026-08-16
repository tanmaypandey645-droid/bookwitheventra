import React from 'react';
import { Home, Search, Ticket, Users, User as UserIcon } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'plans', label: 'Plans', icon: Users },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-orange-400/20 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'home');

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all min-w-[64px] min-h-[48px] ${
                isActive 
                  ? 'text-orange-300 font-bold bg-orange-400/10' 
                  : 'text-zinc-400 font-medium hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-orange-300' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-300 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'text-orange-300 font-bold' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
