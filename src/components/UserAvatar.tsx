import React, { useState } from 'react';

interface UserAvatarProps {
  name: string;
  src?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onClick?: () => void;
  showCameraBadge?: boolean;
}

export const getInitials = (name: string): string => {
  if (!name) return 'E';
  // Remove special chars like +91 in phone names if needed
  const cleanName = name.replace(/\(\+[\d\s]+\)/, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'E';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  src,
  className = '',
  size = 'md',
  onClick,
  showCameraBadge = false
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
    '2xl': 'w-24 h-24 text-xl'
  };

  const hasValidImage = src && src.trim() !== '' && !imgError;

  return (
    <div 
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none overflow-hidden ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
    >
      {hasValidImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-rose-400 p-[2px] shadow-sm">
          <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center font-extrabold text-orange-300 tracking-wider">
            {initials}
          </div>
        </div>
      )}

      {showCameraBadge && (
        <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-orange-400 text-zinc-950 shadow-md border-2 border-zinc-900">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" strokeWidth={2.5} />
          </svg>
        </div>
      )}
    </div>
  );
};
