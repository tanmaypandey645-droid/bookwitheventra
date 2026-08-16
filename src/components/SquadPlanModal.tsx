import React, { useState } from 'react';
import { Users, MapPin, Clock, Share2, CheckCircle2, UserPlus, Send, X, Copy, Check, Phone, MessageSquare } from 'lucide-react';
import { Event, User, OutingPlan, SquadMember } from '../types';
import { UserAvatar } from './UserAvatar';

interface SquadPlanModalProps {
  isOpen: boolean;
  event: Event;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onSavePlan: (plan: OutingPlan) => void;
}

export const SquadPlanModal: React.FC<SquadPlanModalProps> = ({
  isOpen,
  event,
  currentUser,
  allUsers,
  onClose,
  onSavePlan
}) => {
  const [meetingPoint, setMeetingPoint] = useState('Metro Station Gate 2 (Shaheed Sthal / Bus Stop)');
  const [meetingTime, setMeetingTime] = useState('09:30 AM');
  const [notes, setNotes] = useState("Squad assembled: Tanmay, Bharat, Angel, and Raksha. Meeting 30 mins before the opening gate! Bring college IDs.");
  
  // Default squad with Tanmay, Bharat, Angel, and Raksha
  const [invitedFriends, setInvitedFriends] = useState<SquadMember[]>(() => {
    // Look for Bharat, Angel, Raksha from directory, or provide default squad members
    const defaultSquad = [
      {
        id: currentUser.id === 'guest' ? 'user_tanmay' : currentUser.id,
        name: currentUser.id === 'guest' ? 'Tanmay Pandey' : currentUser.name,
        email: currentUser.id === 'guest' ? 'tanmaypandey645@gmail.com' : currentUser.email,
        phoneNumber: currentUser.phoneNumber || '+91 98765 43210',
        avatar: currentUser.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'Accepted' as const
      },
      {
        id: 'user_bharat',
        name: 'Bharat Sharma',
        email: 'bharat.sharma@kiet.edu',
        phoneNumber: '+91 98112 34567',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        status: 'Accepted' as const
      },
      {
        id: 'user_angel',
        name: 'Angel Joseph',
        email: 'angel.joseph@kiet.edu',
        phoneNumber: '+91 98223 45678',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        status: 'Accepted' as const
      },
      {
        id: 'user_raksha',
        name: 'Raksha Singh',
        email: 'raksha.singh@kiet.edu',
        phoneNumber: '+91 98334 56789',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'Accepted' as const
      }
    ];
    return defaultSquad;
  });

  // State for adding friend by phone number
  const [friendPhone, setFriendPhone] = useState('');
  const [friendName, setFriendName] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAddFriendByPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const cleanPhone = friendPhone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile phone number');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91 ${cleanPhone.replace(/\D/g, '').slice(-10)}`;

    // Check if phone number already in squad
    if (invitedFriends.some(f => f.phoneNumber?.replace(/\D/g, '') === formattedPhone.replace(/\D/g, ''))) {
      setPhoneError('This phone number is already added to the squad');
      return;
    }

    // Check if matching registered user in directory
    const matchedUser = allUsers.find(u => u.phoneNumber?.replace(/\D/g, '') === formattedPhone.replace(/\D/g, ''));
    const finalName = friendName.trim() || matchedUser?.name || `Friend (${formattedPhone.slice(-4)})`;
    const finalAvatar = matchedUser?.profileImage || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`;

    const newMember: SquadMember = {
      id: matchedUser?.id || `squad_ph_${Date.now()}`,
      name: finalName,
      email: matchedUser?.email || `${finalName.toLowerCase().replace(/\s+/g, '')}@eventra.squad`,
      phoneNumber: formattedPhone,
      avatar: finalAvatar,
      status: 'Pending'
    };

    setInvitedFriends([...invitedFriends, newMember]);
    setFriendPhone('');
    setFriendName('');
  };

  const handleAddPresetContact = (name: string, phone: string, email: string, avatar: string) => {
    if (!invitedFriends.some(f => f.phoneNumber?.replace(/\D/g, '') === phone.replace(/\D/g, '') || f.name.toLowerCase() === name.toLowerCase())) {
      setInvitedFriends([
        ...invitedFriends,
        {
          id: `squad_user_${Date.now()}`,
          name,
          email,
          phoneNumber: phone,
          avatar,
          status: 'Accepted'
        }
      ]);
    }
  };

  const handleRemoveFriend = (id: string) => {
    if (id === currentUser.id || id === 'user_tanmay') return; // Cannot remove creator
    setInvitedFriends(invitedFriends.filter(f => f.id !== id));
  };

  const meetingPointPresets = [
    'Metro Station Gate 2 (Shaheed Sthal / Bus Hub)',
    'Campus Main Gateway & Reception',
    'Student Activity Center & Cafe',
    'North Parking Plaza & Pickup Bay'
  ];

  const handleSave = () => {
    const latOffset = (event.latitude || 28.7523) - 0.0095;
    const lngOffset = (event.longitude || 77.4988) - 0.0082;

    const newPlan: OutingPlan = {
      id: 'plan_squad_' + Date.now(),
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventVenue: event.venue || event.venueName || 'Campus Venue',
      creatorId: currentUser.id === 'guest' ? 'user_tanmay' : currentUser.id,
      creatorName: currentUser.id === 'guest' ? 'Tanmay Pandey' : currentUser.name,
      friends: invitedFriends,
      meetingPoint,
      meetingTime,
      meetingPointLocation: {
        name: meetingPoint,
        address: `${meetingPoint}, ${event.city}`,
        latitude: latOffset,
        longitude: lngOffset
      },
      notes,
      seats: ['A12', 'A13', 'A14', 'A15'].slice(0, invitedFriends.length),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    onSavePlan(newPlan);
    onClose();
  };

  const shareText = `🚀 Join my Eventra Squad for ${event.title}!\n👥 Squad: ${invitedFriends.map(f => f.name).join(', ')}\n📍 Meeting Point: ${meetingPoint}\n⏰ Meeting Time: ${meetingTime}\n📝 Notes: ${notes}\nOpen Eventra to confirm attendance!`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-orange-400/25 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-400/15 text-orange-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Plan Outing With Squad</h3>
              <p className="text-[11px] text-zinc-400">Squad Mode & Phone Friend Coordination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-3 pr-0.5 flex-1">
          {/* Event Preview Banner */}
          <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center gap-3">
            <img
              src={event.image}
              alt={event.title}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-700"
            />
            <div className="overflow-hidden">
              <h4 className="font-extrabold text-white text-xs line-clamp-1">{event.title}</h4>
              <p className="text-[11px] text-zinc-400">{event.date} • {event.venue}</p>
            </div>
          </div>

          {/* Form Controls */}
          <div className="space-y-4 text-xs">
            
            {/* Meeting Point Selection */}
            <div>
              <label className="block font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-300" />
                <span>Choose Meeting Point</span>
              </label>
              <input
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="e.g. Metro Station Gate 2 / Campus Canteen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium focus:outline-none focus:border-orange-400/60"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {meetingPointPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMeetingPoint(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                      meetingPoint === preset
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    📍 {preset.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting Time Selection */}
            <div>
              <label className="block font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Set Meeting Time</span>
              </label>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="e.g. 09:30 AM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium focus:outline-none focus:border-orange-400/60 font-mono"
              />
            </div>

            {/* Outing Notes */}
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Squad Outing Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add instructions or chat notes for your squad..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium focus:outline-none focus:border-orange-400/60 resize-none"
              />
            </div>

            {/* SQUAD MEMBERS LIST (Tanmay, Bharat, Angel, Raksha + Added Friends) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  <span>Active Squad ({invitedFriends.length} Members)</span>
                </label>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Tanmay, Bharat, Angel, Raksha
                </span>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {invitedFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800/90 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <UserAvatar name={friend.name} src={friend.avatar} size="sm" className="w-8 h-8 rounded-xl shrink-0" />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-white text-xs truncate">{friend.name}</p>
                          {friend.id === currentUser.id || friend.id === 'user_tanmay' ? (
                            <span className="px-1.5 py-0.2 bg-orange-400/20 text-orange-300 font-mono text-[9px] rounded font-bold">
                              Leader
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-orange-400/80" />
                          <span>{friend.phoneNumber || friend.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        friend.status === 'Accepted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {friend.status === 'Accepted' ? '✓ Accepted' : '○ Invited'}
                      </span>

                      {friend.id !== currentUser.id && friend.id !== 'user_tanmay' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADD FRIEND USING PHONE NUMBER FEATURE */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-orange-400/30 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-300">
                  <Phone className="w-3.5 h-3.5 text-orange-400" />
                  <span>Add Friend by Phone Number</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Instant Invite</span>
              </div>

              <form onSubmit={handleAddFriendByPhone} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      placeholder="Friend's Name (e.g. Rohit)"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-orange-400/60"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={friendPhone}
                      onChange={(e) => {
                        setFriendPhone(e.target.value);
                        setPhoneError('');
                      }}
                      placeholder="10-digit Mobile Number"
                      maxLength={14}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono placeholder:text-zinc-500 focus:outline-none focus:border-orange-400/60"
                    />
                  </div>
                </div>

                {phoneError && (
                  <p className="text-[11px] text-rose-400 font-medium">{phoneError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-black text-xs hover:brightness-105 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Add Friend to Squad</span>
                </button>
              </form>

              {/* Quick Suggestion Chips for Core Squad Contacts */}
              <div className="pt-2 border-t border-zinc-900">
                <p className="text-[10px] text-zinc-400 mb-1.5 font-bold uppercase tracking-wider">Quick Squad Contacts:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Bharat', phone: '+91 98112 34567', email: 'bharat.sharma@kiet.edu', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                    { name: 'Angel', phone: '+91 98223 45678', email: 'angel.joseph@kiet.edu', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
                    { name: 'Raksha', phone: '+91 98334 56789', email: 'raksha.singh@kiet.edu', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
                    { name: 'Tanmay', phone: '+91 98765 43210', email: 'tanmaypandey645@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
                  ].filter(c => !invitedFriends.some(f => f.name.toLowerCase().includes(c.name.toLowerCase()))).map((contact) => (
                    <button
                      key={contact.name}
                      type="button"
                      onClick={() => handleAddPresetContact(contact.name, contact.phone, contact.email, contact.avatar)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-[11px]"
                    >
                      <UserPlus className="w-3 h-3 text-orange-300" />
                      <span>+ {contact.name} ({contact.phone.slice(-4)})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3.5 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyShare}
            className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold flex items-center gap-1.5 text-xs transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-300" />}
            <span>{copied ? 'Copied Link!' : 'Copy Share'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Create Squad Outing Plan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
