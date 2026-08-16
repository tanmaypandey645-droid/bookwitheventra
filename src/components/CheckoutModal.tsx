import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  QrCode,
  Eye,
  Share2,
  Check,
  AlertTriangle,
  XCircle,
  Phone,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Event, TicketType, Booking, User, SquadMember } from '../types';
import { SeatSelector } from './SeatSelector';
import { generateTicketPDF } from '../utils/pdfGenerator';
import { UserAvatar } from './UserAvatar';

interface CheckoutModalProps {
  isOpen: boolean;
  event: Event;
  user: User;
  initialSquadMode?: boolean;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
  onStartSquadPlan: (booking: Booking) => void;
  onViewTicket?: (booking: Booking) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  event,
  user,
  initialSquadMode = false,
  onClose,
  onBookingSuccess,
  onStartSquadPlan,
  onViewTicket
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSquadBooking, setIsSquadBooking] = useState<boolean>(initialSquadMode);

  // Default squad attendees: Tanmay, Bharat, Angel, Raksha
  const [squadAttendees, setSquadAttendees] = useState<SquadMember[]>([
    {
      id: user.id === 'guest' ? 'user_tanmay' : user.id,
      name: user.id === 'guest' ? 'Tanmay Pandey' : user.name,
      email: user.id === 'guest' ? 'tanmaypandey645@gmail.com' : user.email,
      phoneNumber: user.phoneNumber || '+91 98765 43210',
      avatar: user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Accepted'
    },
    {
      id: 'user_bharat',
      name: 'Bharat Sharma',
      email: 'bharat.sharma@kiet.edu',
      phoneNumber: '+91 98112 34567',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'Accepted'
    },
    {
      id: 'user_angel',
      name: 'Angel Joseph',
      email: 'angel.joseph@kiet.edu',
      phoneNumber: '+91 98223 45678',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'Accepted'
    },
    {
      id: 'user_raksha',
      name: 'Raksha Singh',
      email: 'raksha.singh@kiet.edu',
      phoneNumber: '+91 98334 56789',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Accepted'
    }
  ]);

  const [selectedTicketType, setSelectedTicketType] = useState<TicketType>(
    event.ticketTypes[0] || { id: 'default', name: 'General Entry', price: 199, description: '', capacity: 100, available: 50 }
  );
  
  const [quantity, setQuantity] = useState<number>(initialSquadMode ? 4 : 2);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // UPI Payment details (Direct UPI Streamlined Flow)
  const [upiProvider, setUpiProvider] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [customUpiId, setCustomUpiId] = useState('');

  // Processing & Confirmation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [shareCopied, setShareCopied] = useState(false);

  // Razorpay Transaction Feedback State
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState<string>('');

  // Auto-sync quantity when switching Squad Booking Mode
  const handleToggleSquadMode = (enableSquad: boolean) => {
    setIsSquadBooking(enableSquad);
    if (enableSquad) {
      setQuantity(squadAttendees.length);
      setSelectedSeats(['A12', 'A13', 'A14', 'A15'].slice(0, squadAttendees.length));
    } else {
      setQuantity(2);
      setSelectedSeats([]);
    }
  };

  // Calculation Math
  const ticketPriceSubtotal = selectedTicketType.price * quantity;
  const platformFee = selectedTicketType.price === 0 ? 0 : 20;
  const taxes = selectedTicketType.price === 0 ? 0 : Math.round(ticketPriceSubtotal * 0.18);
  const totalAmount = ticketPriceSubtotal + platformFee + taxes;
  const perMemberSplit = quantity > 0 ? Math.round(totalAmount / quantity) : totalAmount;

  // Generate Step 3 UPI QR Code
  useEffect(() => {
    const upiId = upiProvider === 'custom' && customUpiId ? customUpiId : 'eventra@razorpay';
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Eventra Tickets')}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Ticket - ${event.title.slice(0, 20)}`)}`;
    
    QRCode.toDataURL(upiUri, { width: 220, margin: 1, color: { dark: '#09090b', light: '#ffffff' } })
      .then((url) => setUpiQrCodeUrl(url))
      .catch((err) => console.error('UPI QR generation error:', err));
  }, [totalAmount, upiProvider, customUpiId, event.title]);

  if (!isOpen) return null;

  const seatingEnabled = event.seatingEnabled !== false;

  const handleSeatToggle = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length < quantity) {
        setSelectedSeats([...selectedSeats, seatId]);
      } else {
        // Replace last seat
        setSelectedSeats([...selectedSeats.slice(1), seatId]);
      }
    }
  };

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const executeServerVerification = async (orderId: string, simPaymentId?: string, simSignature?: string) => {
    setIsProcessing(true);
    const pId = simPaymentId || `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const sig = simSignature || `sig_rzp_${Date.now()}`;

    try {
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: pId,
          razorpay_signature: sig,
          user,
          event,
          ticketType: selectedTicketType,
          quantity,
          seatNumbers: seatingEnabled ? selectedSeats : [],
          isSquadBooking,
          squadMembers: isSquadBooking ? squadAttendees : undefined
        })
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.success && verifyData.booking) {
        const confirmed: Booking = verifyData.booking;

        try {
          const qrUrl = await QRCode.toDataURL(confirmed.qrCodeData, { width: 250, margin: 1 });
          setQrCodeUrl(qrUrl);
        } catch (qrErr) {
          console.error('QR code generation error:', qrErr);
        }

        setConfirmedBooking(confirmed);
        setIsProcessing(false);
        onBookingSuccess(confirmed);

        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 }
        });

        setTimeout(async () => {
          try {
            await generateTicketPDF(confirmed);
          } catch (pdfErr) {
            console.error('Auto PDF generation error:', pdfErr);
          }
        }, 300);
      } else {
        setIsProcessing(false);
        setPaymentError(verifyData.error || 'Payment verification failed. No ticket has been issued.');
      }
    } catch (verifyErr: any) {
      setIsProcessing(false);
      setPaymentError(verifyErr.message || 'Error verifying payment with server.');
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    setPaymentCancelled(false);

    try {
      // 1. Create Order via Server API
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          ticketTypeId: selectedTicketType.id,
          quantity,
          seatNumbers: seatingEnabled ? selectedSeats : [],
          unitPrice: selectedTicketType.price,
          user: { id: user.id, name: user.name, email: user.email }
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        setIsProcessing(false);
        setPaymentError(orderData.error || 'Failed to initialize Razorpay payment order.');
        return;
      }

      // Check if we have real, non-placeholder Razorpay credentials AND a non-simulated order
      const isRealRazorpayKey = Boolean(
        orderData.keyId && 
        !orderData.keyId.includes('placeholder') && 
        !orderData.keyId.includes('your_') &&
        orderData.orderId && 
        !orderData.orderId.includes('SIM_')
      );

      if (!isRealRazorpayKey) {
        // In Sandbox/Test environment without live credentials:
        // Complete transaction via server-side verified simulation
        setTimeout(() => {
          executeServerVerification(orderData.orderId);
        }, 1200);
        return;
      }

      // Ensure Razorpay Checkout SDK is loaded
      const isSdkLoaded = await loadRazorpaySDK();
      if (!isSdkLoaded) {
        setTimeout(() => {
          executeServerVerification(orderData.orderId);
        }, 1000);
        return;
      }

      // 2. Open Razorpay Checkout Modal (supports UPI, Cards, Netbanking, Wallets)
      const options: any = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'EVENTRA',
        description: `${event.title} - ${selectedTicketType.name} (x${quantity})`,
        image: event.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=200',
        order_id: orderData.orderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phoneNumber?.replace(/\D/g, '') || '9876543210',
          method: 'upi'
        },
        notes: {
          eventId: event.id,
          ticketTypeName: selectedTicketType.name,
          isSquadBooking: isSquadBooking ? 'true' : 'false',
          squadMembers: isSquadBooking ? squadAttendees.map(m => m.name).join(', ') : 'Individual'
        },
        theme: {
          color: '#f97316' // Eventra Accent Orange
        },
        handler: async function (paymentRes: any) {
          executeServerVerification(
            paymentRes.razorpay_order_id, 
            paymentRes.razorpay_payment_id, 
            paymentRes.razorpay_signature
          );
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setPaymentCancelled(true);
          }
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (failRes: any) {
          setIsProcessing(false);
          setPaymentError(failRes.error?.description || 'Payment was declined or failed.');
        });
        rzp.open();
      } catch (e: any) {
        console.warn('Razorpay checkout modal initialization error:', e);
        executeServerVerification(orderData.orderId);
      }

    } catch (err: any) {
      console.error('Payment processing error:', err);
      setIsProcessing(false);
      setPaymentError(err.message || 'An unexpected error occurred while starting payment.');
    }
  };

  const handleDownloadPDF = async () => {
    if (confirmedBooking) {
      await generateTicketPDF(confirmedBooking);
    }
  };

  const handleShareTicket = async () => {
    if (!confirmedBooking) return;
    const shareText = `🎉 My official Eventra ticket for ${confirmedBooking.eventTitle}!\nBooking ID: ${confirmedBooking.bookingId}\nDate: ${confirmedBooking.eventDate}\nVenue: ${confirmedBooking.eventVenue}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Eventra Ticket - ${confirmedBooking.eventTitle}`,
          text: shareText,
          url: window.location.href
        });
        return;
      } catch (err) {
        // Fallback to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) {
      console.error('Share copy error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0c0d14] border border-zinc-800/90 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="px-6 pt-5 pb-4 border-b border-zinc-800/80 bg-zinc-950/90 relative shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-wider text-orange-400/90 uppercase">
                  {confirmedBooking ? 'CONFIRMATION' : paymentError ? 'PAYMENT STATUS' : paymentCancelled ? 'PAYMENT STATUS' : `STEP ${step} OF ${seatingEnabled ? 3 : 2}`}
                </span>
                {isSquadBooking && !confirmedBooking && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-orange-400/20 to-amber-400/20 text-orange-300 rounded-full border border-orange-400/30 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    <span>Squad Group Booking</span>
                  </span>
                )}
              </div>
              <h2 className="font-extrabold text-white text-base sm:text-lg mt-0.5 leading-snug">
                {confirmedBooking ? '🎉 TICKET CONFIRMED' : paymentError ? '⚠️ PAYMENT ERROR' : paymentCancelled ? 'PAYMENT CANCELLED' : event.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator Bar */}
          {!confirmedBooking && !paymentError && !paymentCancelled && (
            <div className="w-full bg-zinc-800/80 h-1 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-amber-300 transition-all duration-300"
                style={{ width: `${(step / (seatingEnabled ? 3 : 2)) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1">
          {/* Payment Success View */}
          {confirmedBooking ? (
            <div className="p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white">🎉 Payment Successful!</h2>
                <p className="text-sm font-medium text-zinc-300">
                  {isSquadBooking ? `Squad tickets confirmed for ${squadAttendees.map(m => m.name.split(' ')[0]).join(', ')}!` : 'Your ticket is ready.'}
                </p>
                <div className="mt-3 inline-block px-4 py-1.5 bg-orange-400/10 border border-orange-400/25 rounded-full font-mono text-xs font-bold text-orange-300">
                  Booking ID: {confirmedBooking.bookingId}
                </div>
              </div>

              {/* Event Summary Card with QR preview */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-left flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <img
                  src={confirmedBooking.eventImage}
                  alt={confirmedBooking.eventTitle}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-700"
                />
                <div className="flex-1 overflow-hidden text-center sm:text-left">
                  <h4 className="font-extrabold text-white text-sm line-clamp-1">{confirmedBooking.eventTitle}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{confirmedBooking.eventDate} • {confirmedBooking.eventTime}</p>
                  <p className="text-xs text-orange-300 mt-0.5 truncate">{confirmedBooking.eventVenue}</p>
                  <p className="text-xs text-zinc-300 font-bold mt-1">
                    {confirmedBooking.ticketTypeName} (x{confirmedBooking.quantity})
                    {confirmedBooking.seatNumbers && confirmedBooking.seatNumbers.length > 0 && ` • Seats: ${confirmedBooking.seatNumbers.join(', ')}`}
                  </p>
                  {isSquadBooking && (
                    <p className="text-[11px] text-amber-300 mt-1 font-mono">
                      👥 Squad: {squadAttendees.map(s => s.name.split(' ')[0]).join(', ')}
                    </p>
                  )}
                </div>

                {/* QR Code preview */}
                <div className="p-2 bg-white rounded-xl shrink-0 border border-zinc-300 text-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Ticket QR Code" className="w-20 h-20 mx-auto" />
                  ) : (
                    <div className="w-20 h-20 bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <QrCode className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  onClick={handleDownloadPDF}
                  className="py-3 px-3 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download PDF Ticket</span>
                </button>

                <button
                  onClick={() => {
                    if (onViewTicket) {
                      onViewTicket(confirmedBooking);
                    } else {
                      onClose();
                    }
                  }}
                  className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye className="w-4 h-4 text-orange-300 shrink-0" />
                  <span>View Ticket</span>
                </button>

                <button
                  onClick={handleShareTicket}
                  className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-orange-300 shrink-0" />
                      <span>Share Ticket</span>
                    </>
                  )}
                </button>
              </div>

              {/* Plan With Squad secondary action */}
              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  onClick={() => {
                    onClose();
                    onStartSquadPlan(confirmedBooking);
                  }}
                  className="text-xs text-zinc-400 hover:text-orange-300 font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-orange-300" />
                  <span>View or Coordinate in Squad Mode</span>
                </button>
              </div>
            </div>
          ) : paymentError ? (
            /* Payment Failure Screen */
            <div className="p-6 sm:p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Payment Failed</h3>
                <p className="text-xs text-rose-300 max-w-sm mx-auto font-mono bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/60 mt-2">
                  {paymentError}
                </p>
                <p className="text-xs text-zinc-400 pt-2">
                  Your payment could not be completed. No ticket has been issued.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 max-w-sm mx-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => { setPaymentError(null); handleProcessPayment(); }}
                    className="flex-1 py-3 rounded-xl bg-orange-400 hover:brightness-105 text-zinc-950 font-extrabold text-xs transition-all shadow-md"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => { setPaymentError(null); setStep(seatingEnabled ? 3 : 2); }}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs border border-zinc-700 transition-all"
                  >
                    Change Method
                  </button>
                </div>
                <button
                  onClick={() => { 
                    setPaymentError(null); 
                    executeServerVerification(`order_SIM_${Date.now()}`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-orange-400/15 hover:bg-orange-400/25 text-orange-300 font-extrabold text-xs border border-orange-400/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>⚡ Complete in Test Sandbox Mode</span>
                </button>
              </div>
            </div>
          ) : paymentCancelled ? (
            /* Payment Cancelled Screen */
            <div className="p-6 sm:p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-300">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Payment Cancelled</h3>
                <p className="text-xs text-zinc-300">You closed or cancelled the Razorpay checkout screen before completing payment.</p>
              </div>
              <button
                onClick={() => setPaymentCancelled(false)}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-extrabold text-xs shadow-md hover:brightness-105"
              >
                Return to Checkout
              </button>
            </div>
          ) : isProcessing ? (
            /* Payment Processing Loader State */
            <div className="p-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto" />
              <h3 className="text-xl font-extrabold text-white">Connecting to Razorpay...</h3>
              <p className="text-xs text-zinc-400">Opening secure payment gateway...</p>
              <div className="w-48 mx-auto h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-4">
                <div className="w-full h-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 animate-pulse" />
              </div>
            </div>
          ) : (
            /* Checkout Steps */
            <div className="p-5 sm:p-6 space-y-5">

              {/* STEP 1: Mode Switch, Ticket Type & Quantity */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Mode Selector: Individual vs Squad Booking */}
                  <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-2xl grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSquadMode(false)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        !isSquadBooking
                          ? 'bg-orange-400 text-zinc-950 shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>👤 Individual Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSquadMode(true)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        isSquadBooking
                          ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>👥 Book with Squad (4x)</span>
                    </button>
                  </div>

                  {/* If Squad Booking Mode: Show Squad Attendees Card */}
                  {isSquadBooking && (
                    <div className="bg-zinc-950 p-3.5 rounded-2xl border border-orange-400/40 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-xs font-extrabold text-white">Squad Members ({squadAttendees.length})</span>
                        </div>
                        <span className="text-[10px] text-amber-300 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-bold">
                          Group Passes Included
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {squadAttendees.map((member) => (
                          <div key={member.id} className="flex items-center gap-2 p-2 bg-zinc-900/90 rounded-xl border border-zinc-800">
                            <UserAvatar name={member.name} src={member.avatar} size="sm" className="w-6 h-6 rounded-lg shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-white truncate">{member.name}</p>
                              <p className="text-[9px] text-zinc-400 font-mono truncate">{member.phoneNumber || member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-300">
                        <span>Squad Cost Split:</span>
                        <span className="text-orange-300 font-black font-mono">₹{perMemberSplit} / member</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">Select Ticket Category</label>
                    <div className="space-y-2">
                      {event.ticketTypes.map((ticket) => (
                        <div
                          key={ticket.id}
                          onClick={() => setSelectedTicketType(ticket)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            selectedTicketType.id === ticket.id
                              ? 'bg-orange-400/10 border-orange-400/60 text-white shadow-sm'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                selectedTicketType.id === ticket.id ? 'border-orange-400 bg-orange-400' : 'border-zinc-600'
                              }`}>
                                {selectedTicketType.id === ticket.id && <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-white">{ticket.name}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{ticket.description}</p>
                              </div>
                            </div>
                            <p className="text-base font-black text-orange-300">
                              {ticket.price === 0 ? 'FREE' : `₹${ticket.price}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                    <div>
                      <p className="text-xs font-bold text-white">Ticket Quantity</p>
                      <p className="text-[11px] text-zinc-400">
                        {isSquadBooking ? 'Preset for 4 Squad Members' : 'Max 6 tickets per order'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 flex items-center justify-center text-base"
                      >
                        -
                      </button>
                      <span className="font-mono text-base font-extrabold text-orange-300 w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(8, quantity + 1))}
                        className="w-8 h-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 flex items-center justify-center text-base"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(seatingEnabled ? 2 : 2)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-black text-sm shadow-md shadow-orange-400/15 flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    <span>{seatingEnabled ? 'Proceed to Seat Selection' : 'Proceed to Payment'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Seat Selector */}
              {step === 2 && seatingEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-base">Select Your Seats</h3>
                      <p className="text-xs text-zinc-400">
                        {isSquadBooking ? `Select ${quantity} adjacent seats for your squad` : `Click to select ${quantity} seat(s)`}
                      </p>
                    </div>

                    <div className="px-3 py-1.5 bg-orange-400/10 border border-orange-400/30 rounded-full text-xs font-mono font-extrabold text-orange-300">
                      {selectedSeats.length} of {quantity} Selected
                    </div>
                  </div>

                  <SeatSelector
                    quantity={quantity}
                    selectedSeats={selectedSeats}
                    occupiedSeats={event.occupiedSeats || []}
                    onSelectSeat={handleSeatToggle}
                    eventTitle={event.title}
                    venueName={event.venue || event.venueName}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="py-2.5 px-5 rounded-xl bg-[#1c202f] hover:bg-zinc-800 text-zinc-300 font-extrabold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      disabled={selectedSeats.length < quantity}
                      onClick={() => setStep(3)}
                      className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 disabled:opacity-50 text-zinc-950 font-black text-xs shadow-md shadow-orange-400/15 flex items-center gap-1.5 transition-all"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 (or 2 if no seats): Order Summary & Payment */}
              {(step === 3 || (step === 2 && !seatingEnabled)) && (
                <div className="space-y-4">

                  {/* Transparent Order Summary */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider">Transparent Order Summary</h4>
                      {isSquadBooking && (
                        <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          Squad Pass ({quantity}x)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-xs text-zinc-300">
                      <span>{selectedTicketType.name} (x{quantity})</span>
                      <span>₹{ticketPriceSubtotal}</span>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Platform Service Fee</span>
                      <span>₹{platformFee}</span>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>GST / Taxes (18%)</span>
                      <span>₹{taxes}</span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-extrabold text-white">
                      <span>Total Amount Payable</span>
                      <div className="text-right">
                        <span className="text-orange-300 text-base font-black">₹{totalAmount}</span>
                        {isSquadBooking && (
                          <p className="text-[10px] text-zinc-400 font-mono font-normal">₹{perMemberSplit} / squad member</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method - Streamlined Instant UPI & Razorpay */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-300">Pay with Instant UPI</label>
                      <span className="text-[10px] text-orange-400 font-mono font-bold bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
                        Scan & Pay / Apps
                      </span>
                    </div>

                    {/* UPI App Selection */}
                    <div className="grid grid-cols-4 gap-2">
                      {(['gpay', 'phonepe', 'paytm', 'custom'] as const).map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiProvider(app)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                            upiProvider === app
                              ? 'bg-orange-400 text-zinc-950 font-black shadow-sm'
                              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>

                    {upiProvider === 'custom' && (
                      <input
                        type="text"
                        value={customUpiId}
                        onChange={(e) => setCustomUpiId(e.target.value)}
                        placeholder="e.g. username@okaxis / mobile@upi"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-400/60 font-mono"
                      />
                    )}

                    {/* Dynamic UPI Payment QR Code Display */}
                    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-zinc-200">
                        <QrCode className="w-4 h-4 text-orange-400" />
                        <span>Scan QR with Any UPI App</span>
                      </div>

                      {upiQrCodeUrl ? (
                        <div className="relative group inline-block cursor-pointer" onClick={handleProcessPayment}>
                          <div className="bg-white p-2.5 rounded-2xl inline-block shadow-xl shadow-black/40 border border-zinc-200 transition-transform group-hover:scale-[1.02]">
                            <img 
                              src={upiQrCodeUrl} 
                              alt="UPI Payment QR Code" 
                              className="w-32 h-32 mx-auto object-contain rounded-lg"
                            />
                          </div>
                          <div className="absolute inset-0 bg-zinc-950/75 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white font-bold text-xs p-2 text-center">
                            Click to Pay ₹{totalAmount} via Razorpay
                          </div>
                        </div>
                      ) : (
                        <div className="w-32 h-32 mx-auto bg-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-500 text-xs">
                          Generating QR...
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-400 space-y-0.5">
                        <p className="font-mono text-orange-300 font-bold">Amount Payable: ₹{totalAmount}</p>
                        <p className="text-zinc-500">Google Pay • PhonePe • Paytm • BHIM • CRED</p>
                      </div>
                    </div>
                  </div>

                  {/* Informational card regarding Cards/NetBanking on Razorpay */}
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-2.5 text-[11px] text-zinc-400">
                    <CreditCard className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>
                      Need to pay via <strong className="text-zinc-200">Debit / Credit Card</strong> or <strong className="text-zinc-200">NetBanking</strong>? Click below to open Razorpay gateway.
                    </span>
                  </div>

                  {/* Submit Payment CTA */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setStep(seatingEnabled ? 2 : 1)}
                      className="py-4 px-4 rounded-2xl bg-[#1c202f] hover:bg-zinc-800 text-zinc-300 font-extrabold text-xs flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={handleProcessPayment}
                      className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 hover:brightness-105 text-zinc-950 font-black text-sm shadow-md shadow-orange-400/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5 text-zinc-950" />
                      <span>PAY ₹{totalAmount} VIA RAZORPAY</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
