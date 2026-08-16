import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Booking } from '../types';

export async function generateTicketPDF(booking: Booking): Promise<string> {
  // Generate QR Code Data URL
  const qrDataUrl = await QRCode.toDataURL(booking.qrCodeData || `EVENTRA|${booking.bookingId}`, {
    width: 300,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // Create jsPDF instance (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth(); // 210mm
  const height = doc.internal.pageSize.getHeight(); // 297mm

  // Fill entire page with Black Background
  doc.setFillColor(8, 9, 13); // Deep Black / Dark Canvas
  doc.rect(0, 0, width, height, 'F');
  
  // Outer Border Frame
  doc.setDrawColor(251, 146, 60); // Orange #fb923c (Faded Orange)
  doc.setLineWidth(0.8);
  doc.rect(10, 10, width - 20, 277);

  // Top Dark Header Banner Container
  doc.setFillColor(18, 19, 26);
  doc.rect(12, 12, width - 24, 38, 'F');

  // Eventra Logo Header
  doc.setTextColor(251, 146, 60); // Faded Orange
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EVENTRA', 20, 28);

  doc.setTextColor(212, 212, 216); // Light Zinc
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL DIGITAL EVENT TICKET', 20, 36);

  // Status Badge
  doc.setFillColor(16, 185, 129); // Emerald Green
  doc.roundedRect(width - 55, 22, 35, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIRMED', width - 50, 28.5);

  // Event Name Section
  doc.setTextColor(255, 255, 255); // Crisp White
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  // Wrap event title if long
  const titleLines = doc.splitTextToSize(booking.eventTitle, width - 40);
  let currentY = 60;
  doc.text(titleLines, 20, currentY);
  currentY += titleLines.length * 8 + 4;

  // Category & City Pill
  doc.setFillColor(39, 39, 42); // Zinc 800
  doc.roundedRect(20, currentY, 65, 8, 2, 2, 'F');
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${booking.eventCategory.toUpperCase()} • ${booking.eventCity.toUpperCase()}`, 24, currentY + 5.5);

  currentY += 16;

  // Horizontal Divider Line
  doc.setDrawColor(39, 39, 42); // Dark zinc border
  doc.setLineWidth(0.5);
  doc.line(20, currentY, width - 20, currentY);
  currentY += 10;

  // Event Details Grid (2 Columns)
  // Left Column: Event Specs
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 161, 170); // Zinc 400
  doc.text('DATE & TIME', 20, currentY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255); // White
  doc.text(`${booking.eventDate} | ${booking.eventTime}`, 20, currentY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 161, 170);
  doc.text('VENUE & ADDRESS', 20, currentY + 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const venueLines = doc.splitTextToSize(`${booking.eventVenue}\n${booking.eventAddress}`, 100);
  doc.text(venueLines, 20, currentY + 24);

  // Right Column: Ticket Specs
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 161, 170);
  doc.text('TICKET TYPE & QTY', 130, currentY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${booking.ticketTypeName} (x${booking.quantity})`, 130, currentY + 6);

  if (booking.seatNumbers && booking.seatNumbers.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 161, 170);
    doc.text('SEAT NUMBER(S)', 130, currentY + 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 191, 36); // Amber highlight
    doc.text(booking.seatNumbers.join(', '), 130, currentY + 24);
  }

  currentY += 48;

  // Second Divider
  doc.setDrawColor(39, 39, 42);
  doc.line(20, currentY, width - 20, currentY);
  currentY += 10;

  // Booking & Payment Info Box
  doc.setFillColor(18, 19, 26); // Dark zinc container
  doc.setDrawColor(39, 39, 42);
  doc.roundedRect(20, currentY, width - 40, 32, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);
  doc.text('BOOKING ID:', 26, currentY + 10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(251, 191, 36);
  doc.text(booking.bookingId, 52, currentY + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('PASSENGER / USER:', 26, currentY + 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${booking.userName} (${booking.userEmail})`, 62, currentY + 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('PAYMENT METHOD:', 26, currentY + 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text(`${booking.paymentMethod} • ₹${booking.amountDetails.total} (PAID)`, 62, currentY + 25);

  currentY += 40;

  // QR Code Box Section (White rounded container for scanner reliability)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect((width - 64) / 2, currentY, 64, 64, 3, 3, 'F');

  // Add QR Image inside
  doc.addImage(qrDataUrl, 'PNG', (width - 58) / 2, currentY + 3, 58, 58);

  currentY += 70;

  // QR Label
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(booking.qrCodeData, width / 2, currentY, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('Please present this QR code at the event gate for entrance verification.', width / 2, currentY + 6, { align: 'center' });

  // Footer Disclaimer
  doc.setFillColor(18, 19, 26);
  doc.rect(12, 268, width - 24, 17, 'F');

  doc.setTextColor(251, 191, 36);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Powered by Eventra', width / 2, 275, { align: 'center' });

  doc.setTextColor(161, 161, 170);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Eventra Outing & Ticket Platform • Need Help? Support@eventra.in', width / 2, 280, { align: 'center' });

  // Save the PDF
  doc.save(`Eventra_Ticket_${booking.bookingId}.pdf`);

  return `Eventra_Ticket_${booking.bookingId}.pdf`;
}
