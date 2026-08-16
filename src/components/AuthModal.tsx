import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User as UserIcon, 
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Building2
} from 'lucide-react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { StorageService } from '../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  savedUser: User;
  redirectNotice?: string;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  savedUser,
  redirectNotice,
  isMandatory = false
}) => {
  // Main Auth Screen Mode: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Login Method inside 'login' mode: 'email' | 'phone'
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Form Fields - Login Email
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields - Sign Up
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpCollege, setSignUpCollege] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Form Fields - Forgot Password
  const [resetContact, setResetContact] = useState('');

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('123456');

  // UI status state
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [useSavedAccount, setUseSavedAccount] = useState<boolean>(true);

  // Reset errors on mode change
  useEffect(() => {
    setAuthError(null);
    setAuthSuccessMsg(null);
  }, [mode, loginMethod]);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && resendTimer > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  if (!isOpen) return null;

  // Google Authentication Handler
  const handleGoogleAuth = () => {
    setAuthError(null);
    setIsVerifying(true);

    setTimeout(() => {
      const registeredUsers = StorageService.getUsers();
      const googleEmail = savedUser && savedUser.id !== 'guest' && savedUser.email 
        ? savedUser.email 
        : (loginEmail.trim().toLowerCase() || 'alex.rivera@gmail.com');

      const existingUser = registeredUsers.find(
        u => u.email && u.email.trim().toLowerCase() === googleEmail.toLowerCase()
      ) || (savedUser && savedUser.id !== 'guest' ? savedUser : undefined);

      if (!existingUser) {
        setIsVerifying(false);
        setAuthError(`No account found for Google email (${googleEmail}). Please sign up first to create an account.`);
        return;
      }

      const googleUser: User = {
        ...existingUser,
        authenticationProvider: 'Google',
        lastLoginAt: new Date().toISOString()
      };

      setIsVerifying(false);
      setAuthSuccessMsg('Connected with Google successfully!');

      setTimeout(() => {
        onLoginSuccess(googleUser);
        onClose();
      }, 400);
    }, 600);
  };

  // Email/Password Login Submit
  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword || loginPassword.length < 4) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const registeredUsers = StorageService.getUsers();
      const existingUser = registeredUsers.find(
        u => u.email && u.email.trim().toLowerCase() === cleanEmail
      );

      if (!existingUser) {
        setIsVerifying(false);
        setAuthError(`No registered account found with email "${loginEmail}". Please sign up first.`);
        return;
      }

      const authenticatedUser: User = {
        ...existingUser,
        lastLoginAt: new Date().toISOString(),
        authenticationProvider: 'Email'
      };

      setIsVerifying(false);
      setAuthSuccessMsg(`Welcome back, ${existingUser.name}! Logging in...`);

      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
        onClose();
      }, 400);
    }, 600);
  };

  // Sign Up / Create Account Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!signUpName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    const cleanEmail = signUpEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const registeredUsers = StorageService.getUsers();

    // Check if email already registered
    const existingEmailUser = registeredUsers.find(
      u => u.email && u.email.trim().toLowerCase() === cleanEmail
    );
    if (existingEmailUser) {
      setAuthError(`An account with "${signUpEmail}" already exists. Please log in instead.`);
      return;
    }

    // Check if phone already registered
    if (signUpPhone) {
      const cleanPhone = signUpPhone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        const existingPhoneUser = registeredUsers.find(u => {
          if (!u.phoneNumber) return false;
          const uPhone = u.phoneNumber.replace(/\D/g, '');
          return uPhone.includes(cleanPhone) || cleanPhone.includes(uPhone);
        });
        if (existingPhoneUser) {
          setAuthError(`An account with mobile number +91 ${cleanPhone} already exists. Please log in instead.`);
          return;
        }
      }
    }

    setIsVerifying(true);
    setTimeout(() => {
      const newUser: User = {
        id: `usr_signup_${Date.now()}`,
        name: signUpName.trim(),
        email: cleanEmail,
        college: signUpCollege.trim() || 'College / University Student',
        city: 'Delhi NCR',
        interests: ['Technology', 'Fest', 'Hackathons', 'Cultural'],
        profileImage: '',
        role: 'user',
        phoneNumber: signUpPhone ? `+91 ${signUpPhone.replace(/\D/g, '')}` : '+91 98765 43210',
        authenticationProvider: 'Email',
        savedAccount: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      // Register and persist user into storage
      StorageService.setCurrentUser(newUser);

      setIsVerifying(false);
      setAuthSuccessMsg('Account created successfully! Logging you in...');

      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 500);
    }, 650);
  };

  // Forgot Password Submit
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!resetContact.trim()) {
      setAuthError('Please enter your email address or mobile number.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setAuthSuccessMsg(`Password reset link sent to ${resetContact}. Check your inbox.`);
    }, 700);
  };

  // Phone OTP Send Handler
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const registeredUsers = StorageService.getUsers();
    const existingUser = registeredUsers.find(u => {
      if (!u.phoneNumber) return false;
      const uPhone = u.phoneNumber.replace(/\D/g, '');
      return uPhone.includes(cleanPhone) || cleanPhone.includes(uPhone);
    });

    if (!existingUser) {
      setAuthError(`No account found registered with +91 ${cleanPhone}. Please sign up first.`);
      return;
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setResendTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setAuthSuccessMsg(`OTP sent to +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`);
  };

  // Verify OTP Handler
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setAuthError('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      if (enteredOtp !== generatedOtp && enteredOtp !== '123456') {
        setIsVerifying(false);
        setAuthError('Incorrect OTP. Please try again.');
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const registeredUsers = StorageService.getUsers();
      const existingUser = registeredUsers.find(u => {
        if (!u.phoneNumber) return false;
        const uPhone = u.phoneNumber.replace(/\D/g, '');
        return uPhone.includes(cleanPhone) || cleanPhone.includes(uPhone);
      });

      if (!existingUser) {
        setIsVerifying(false);
        setAuthError(`No account found registered with +91 ${cleanPhone}. Please sign up first.`);
        return;
      }

      const phoneUser: User = {
        ...existingUser,
        lastLoginAt: new Date().toISOString(),
        authenticationProvider: 'Phone'
      };

      setIsVerifying(false);
      setAuthSuccessMsg(`Phone verified ✓ Welcome back, ${existingUser.name}!`);

      setTimeout(() => {
        onLoginSuccess(phoneUser);
        onClose();
      }, 500);
    }, 600);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto">
      
      {/* Pitch-Black Claude/AI Live Ambient Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-orange-500/15 via-rose-500/10 to-amber-500/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-rose-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md my-auto text-white space-y-4 animate-in zoom-in-95 duration-300">

        {/* Vibrant Floating Brand Header */}
        <div className="text-center py-1">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 drop-shadow-[0_4px_35px_rgba(249,115,22,0.5)] uppercase font-sans">
            EVENTRA
          </h1>
        </div>

        {/* Redirect Notice Banner */}
        {redirectNotice && (
          <div className="p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-center text-xs text-orange-300 font-semibold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{redirectNotice}</span>
          </div>
        )}

        {/* Main Floating Glass Card */}
        <div className="relative bg-[#0c0c0f]/90 border border-zinc-800/80 rounded-3xl shadow-[0_25px_80px_-15px_rgba(249,115,22,0.18)] p-6 sm:p-8 overflow-hidden z-10 space-y-5 backdrop-blur-xl">
          
          {/* Subtle Ambient Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/80 to-transparent" />

          {/* Optional Close Button */}
          {!isMandatory && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-orange-400/50 transition-all duration-200 z-20"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Flagship Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isVerifying}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#141418] border border-zinc-800 hover:border-orange-400/50 text-white font-extrabold text-xs flex items-center justify-center gap-3 transition-all duration-200 hover:bg-zinc-900 shadow-md active:scale-[0.985] disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                <span>CONNECTING...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-zinc-800/90 w-full" />
            <span className="bg-[#0c0c0f] px-3 text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest shrink-0">
              OR
            </span>
            <div className="border-t border-zinc-800/90 w-full" />
          </div>

          {/* Alert Banners */}
          {authError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex flex-col gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
              {authError.toLowerCase().includes('sign up') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    if (loginEmail) setSignUpEmail(loginEmail);
                    if (phone) setSignUpPhone(phone);
                    setAuthError(null);
                  }}
                  className="self-end px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black text-[10px] rounded-xl hover:brightness-110 transition-all uppercase tracking-wider shadow-md"
                >
                  Sign Up Now →
                </button>
              )}
              {authError.toLowerCase().includes('log in instead') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    if (signUpEmail) setLoginEmail(signUpEmail);
                    setAuthError(null);
                  }}
                  className="self-end px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black text-[10px] rounded-xl hover:brightness-110 transition-all uppercase tracking-wider shadow-md"
                >
                  Log In Now →
                </button>
              )}
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {/* ================= MODE 1: LOG IN ================= */}
          {mode === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Saved Account Card (Instagram / FB style) */}
              {savedUser && savedUser.id !== 'guest' && useSavedAccount && (
                <div className="p-3.5 rounded-2xl bg-[#121217] border border-orange-500/30 space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      SAVED ACCOUNT
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseSavedAccount(false)}
                      className="text-[11px] text-zinc-400 hover:text-amber-300 transition-colors"
                    >
                      Use another account
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
                    <UserAvatar name={savedUser.name} src={savedUser.profileImage} size="sm" className="w-10 h-10 rounded-xl" />
                    <div className="overflow-hidden space-y-0.5 text-left">
                      <p className="font-extrabold text-white text-xs truncate">{savedUser.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{savedUser.email || savedUser.phoneNumber}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onLoginSuccess(savedUser);
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md hover:brightness-105 active:scale-[0.985] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>LOG IN AS {savedUser.name.split(' ')[0].toUpperCase()} →</span>
                  </button>
                </div>
              )}

              {/* Login Method Sub-Switcher (Email vs Phone OTP) */}
              <div className="grid grid-cols-2 p-1 bg-[#121216] border border-zinc-800/80 rounded-2xl text-[11px] font-extrabold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    loginMethod === 'email'
                      ? 'bg-zinc-800 text-white font-extrabold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-orange-400" />
                  <span>Email Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    loginMethod === 'phone'
                      ? 'bg-zinc-800 text-white font-extrabold shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Phone OTP</span>
                </button>
              </div>

              {/* Email Login Form */}
              {loginMethod === 'email' && (
                <form onSubmit={handleEmailLoginSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-zinc-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-amber-400 hover:underline font-bold text-[11px]"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>LOGGING IN...</span>
                      </>
                    ) : (
                      <span>LOG IN →</span>
                    )}
                  </button>
                </form>
              )}

              {/* Phone OTP Login Form */}
              {loginMethod === 'phone' && (
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Mobile Phone Number
                        </label>
                        <div className="flex gap-2">
                          <div className="px-3.5 py-3 rounded-xl bg-[#121216] border border-zinc-800 text-amber-400 font-bold text-sm flex items-center shrink-0">
                            +91
                          </div>
                          <div className="relative flex-1">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                              type="tel"
                              maxLength={10}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                              placeholder="Mobile number"
                              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={phone.length !== 10 || isVerifying}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.985] transition-all duration-200 disabled:opacity-40"
                      >
                        SEND SMS OTP →
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                      <div className="text-center space-y-1">
                        <p className="text-xs text-zinc-300 font-medium">
                          Enter 6-digit OTP sent to <span className="text-amber-300 font-bold">+91 {phone}</span>
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          (Demo OTP: <span className="text-orange-400 font-bold">{generatedOtp}</span> or 123456)
                        </p>
                      </div>

                      <div className="flex justify-between gap-1.5 py-1">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-input-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-10 h-11 text-center text-lg font-bold rounded-xl bg-[#121216] border border-zinc-800 text-amber-300 focus:outline-none focus:border-orange-500 transition-all"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={otp.join('').length !== 6 || isVerifying}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>VERIFYING...</span>
                          </>
                        ) : (
                          <span>VERIFY & LOG IN →</span>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtp(['','','','','','']); }}
                          className="text-zinc-500 hover:text-zinc-300 underline"
                        >
                          Change Number
                        </button>

                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-amber-300 font-bold hover:underline"
                          >
                            Resend OTP
                          </button>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">
                            Resend in {resendTimer}s
                          </span>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ================= MODE 2: SIGN UP / CREATE ACCOUNT ================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  College / University / Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={signUpCollege}
                    onChange={(e) => setSignUpCollege(e.target.value)}
                    placeholder="College or university"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Mobile number"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : (
                  <span>CREATE NEW ACCOUNT →</span>
                )}
              </button>
            </form>
          )}

          {/* ================= MODE 3: FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-3.5 animate-in fade-in duration-200">
              <div className="text-left space-y-1">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Trouble Logging In?</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Enter your email address or mobile number and we'll send you instructions to reset your password.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  value={resetContact}
                  onChange={(e) => setResetContact(e.target.value)}
                  placeholder="Email or mobile number"
                  className="w-full px-4 py-3 rounded-xl bg-[#121216] border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>SENDING...</span>
                  </>
                ) : (
                  <span>SEND RESET LINK →</span>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Flagship App Signature Bottom Box (Instagram / Facebook Style Switcher) */}
        <div className="bg-[#0c0c0f]/90 border border-zinc-800/80 rounded-2xl p-4 text-center text-xs text-zinc-400 font-medium shadow-lg backdrop-blur-xl">
          {mode === 'login' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-orange-400 font-black hover:underline ml-1 uppercase tracking-wider transition-colors"
              >
                Sign up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-orange-400 font-black hover:underline ml-1 uppercase tracking-wider transition-colors"
              >
                Log in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-orange-400 font-black hover:underline ml-1 uppercase tracking-wider transition-colors"
              >
                Back to log in
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
