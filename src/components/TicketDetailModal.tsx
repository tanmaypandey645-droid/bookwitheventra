import React, { useState } from 'react';
import { Download, Share2, QrCode, X, Calendar, MapPin, Ticket, ShieldCheck, Check, Search, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { Booking } from '../types';
import { generateTicketPDF } from '../utils/pdfGenerator';

interface TicketDetailModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onCancelBooking?: (bookingId: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  booking,
  onClose,
  onCancelBooking
}) => {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  React.useEffect(() => {
    if (booking) {
      QRCode.toDataURL(booking.qrCodeData || `EVENTRA|${booking.bookingId}`, { width: 300, margin: 1 })
        .then(url => setQrUrl(url))
        .catch(err => console.error(err));
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleDownloadPDF = async () => {
    await generateTicketPDF(booking);
  };

  const handleShareTicket = () => {
    const text = `🎟 My Eventra Ticket for ${booking.eventTitle}!\nBooking ID: ${booking.bookingId}\nDate: ${booking.eventDate}\nVenue: ${booking.eventVenue}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0d0d0d] border border-orange-400/25 rounded-3xl shadow-2xl p-6 overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-300" />
            <h3 className="font-extrabold text-white text-base">Digital Event Pass</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Content Card */}
        <div className="my-5 bg-[#121212] border border-zinc-800 rounded-2xl p-5 space-y-4">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CONFIRMED PASS</span>
            </span>
            <span className="font-mono text-xs font-bold text-orange-300">{booking.bookingId}</span>
          </div>

          {/* Event Title */}
          <div>
            <h2 className="text-lg font-extrabold text-white">{booking.eventTitle}</h2>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-300" />
              <span>{booking.eventDate} • {booking.eventTime}</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{booking.eventVenue}, {booking.eventCity}</span>
            </p>
          </div>

          {/* Ticket Category & Seats */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex justify-between items-center text-xs">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Category</p>
              <p className="font-bold text-white mt-0.5">{booking.ticketTypeName} (x{booking.quantity})</p>
            </div>
            {booking.seatNumbers && (
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Seats</p>
                <p className="font-black text-orange-300 text-sm mt-0.5">{booking.seatNumbers.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Large Dynamic QR Code Display */}
          <div className="p-4 bg-white rounded-2xl text-center border-2 border-orange-400/80 shadow-xl">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-44 h-44 mx-auto" />
            ) : (
              <div className="w-44 h-44 bg-zinc-100 flex items-center justify-center text-zinc-400">
                <QrCode className="w-12 h-12" />
              </div>
            )}
            <p className="text-xs text-zinc-800 font-mono font-bold mt-1">{booking.qrCodeData}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Present this QR code at the entrance gate</p>
          </div>

          {/* User & Payment Record */}
          <div className="text-xs text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
            <p><strong>Attendee:</strong> {booking.userName} ({booking.userEmail})</p>
            <p><strong>Payment Method:</strong> {booking.paymentMethod} (₹{booking.amountDetails.total} Paid)</p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="py-3 px-3 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 hover:brightness-105 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-400/15"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleShareTicket}
            className="py-3 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-orange-300" />}
            <span>{copied ? 'Copied Details' : 'Share Ticket'}</span>
          </button>
        </div>

        {onCancelBooking && (
          <div className="pt-3 border-t border-zinc-800/80 text-center">
            <button
              onClick={() => {
                if (window.confirm(`Cancel and remove pass for ${booking.eventTitle}?`)) {
                  onCancelBooking(booking.bookingId);
                  onClose();
                }
              }}
              className="text-xs text-rose-400/80 hover:text-rose-300 transition-colors font-medium"
            >
              Cancel & Remove Ticket
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
