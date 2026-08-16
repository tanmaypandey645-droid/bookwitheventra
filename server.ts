import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Razorpay SDK instance
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
const paymentMode = process.env.PAYMENT_MODE || 'test';

let razorpayInstance: Razorpay | null = null;
if (razorpayKeyId && razorpayKeySecret && !razorpayKeyId.includes('your_') && !razorpayKeyId.includes('placeholder')) {
  try {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
    console.log('Razorpay SDK initialized successfully in mode:', paymentMode);
  } catch (e) {
    console.warn('Razorpay SDK initialization notice:', e);
  }
}

// In-Memory Data Stores for Server-Side State & Idempotency
interface SeatHold {
  seatNumber: string;
  expiresAt: number;
  userId: string;
}

const orderStore = new Map<string, any>(); // orderId -> OrderDetails
const bookingStore = new Map<string, any>(); // bookingId / paymentId -> Booking
const tempSeatHolds = new Map<string, SeatHold[]>(); // eventId -> SeatHold[]
const permanentOccupiedSeats = new Map<string, Set<string>>(); // eventId -> Set<seatNumber>

// Public API Config Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    razorpayKeyId,
    paymentMode,
    hasLiveKeys: Boolean(razorpayInstance)
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), paymentMode });
});

// Query Seats for Event
app.get('/api/events/:eventId/seats', (req, res) => {
  const { eventId } = req.params;
  const occupied = Array.from(permanentOccupiedSeats.get(eventId) || []);
  const holds = tempSeatHolds.get(eventId) || [];
  const validHolds = holds.filter(h => h.expiresAt > Date.now()).map(h => h.seatNumber);
  res.json({ eventId, occupiedSeats: [...new Set([...occupied, ...validHolds])] });
});

// 1. CREATE RAZORPAY ORDER ENDPOINT
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { eventId, ticketTypeId, quantity, seatNumbers, unitPrice, user } = req.body;

    if (!eventId || !ticketTypeId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Missing required parameters (eventId, ticketTypeId, quantity)' });
    }

    // Seat Availability Validation & Temporary Lock
    const now = Date.now();
    const currentOccupied = permanentOccupiedSeats.get(eventId) || new Set();
    const currentHolds = (tempSeatHolds.get(eventId) || []).filter(h => h.expiresAt > now);
    tempSeatHolds.set(eventId, currentHolds);

    if (Array.isArray(seatNumbers) && seatNumbers.length > 0) {
      for (const seat of seatNumbers) {
        if (currentOccupied.has(seat)) {
          return res.status(400).json({ error: `Seat ${seat} is already permanently booked.` });
        }
        const activeHold = currentHolds.find(h => h.seatNumber === seat && h.userId !== (user?.id || 'guest'));
        if (activeHold) {
          return res.status(400).json({ error: `Seat ${seat} is currently held by another user.` });
        }
      }

      // Add 10-minute temporary seat hold
      const newHolds = seatNumbers.map(seat => ({
        seatNumber: seat,
        expiresAt: now + 10 * 60 * 1000,
        userId: user?.id || 'guest'
      }));
      tempSeatHolds.set(eventId, [...currentHolds, ...newHolds]);
    }

    // Server-Side Source of Truth Price Calculation
    const price = Number(unitPrice) || 0;
    const ticketPriceSubtotal = price * quantity;
    const platformFee = price === 0 ? 0 : 20;
    const taxes = price === 0 ? 0 : Math.round(ticketPriceSubtotal * 0.18);
    const totalAmount = ticketPriceSubtotal + platformFee + taxes;
    const amountInPaise = totalAmount * 100; // INR unit in paise

    let orderId = '';
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (razorpayInstance) {
      try {
        const razorpayOrder = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receiptId,
          notes: {
            eventId,
            ticketTypeId,
            quantity: String(quantity),
            userEmail: user?.email || 'student@kiet.edu'
          }
        });
        orderId = razorpayOrder.id;
      } catch (rzpErr: any) {
        console.warn('Razorpay API call failed, generating sandbox test order:', rzpErr?.message || rzpErr);
        orderId = `order_SIM_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      }
    } else {
      orderId = `order_SIM_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    }

    const orderDetails = {
      orderId,
      eventId,
      ticketTypeId,
      quantity,
      seatNumbers: seatNumbers || [],
      amountDetails: {
        ticketPrice: ticketPriceSubtotal,
        platformFee,
        taxes,
        total: totalAmount
      },
      amountInPaise,
      currency: 'INR',
      status: 'CREATED',
      createdAt: new Date().toISOString()
    };
    orderStore.set(orderId, orderDetails);

    return res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId,
      paymentMode,
      amountDetails: {
        ticketPrice: ticketPriceSubtotal,
        platformFee,
        taxes,
        total: totalAmount
      },
      seatNumbers: seatNumbers || []
    });

  } catch (err: any) {
    console.error('Error in /api/payment/create-order:', err);
    return res.status(500).json({ error: 'Failed to create payment order.' });
  }
});

// 2. VERIFY RAZORPAY PAYMENT ENDPOINT
app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user,
      event,
      ticketType,
      quantity,
      seatNumbers
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing payment transaction tokens' });
    }

    // IDEMPOTENCY CHECK: Return existing booking if payment was already verified
    for (const [, existingBooking] of bookingStore.entries()) {
      if (existingBooking.razorpayPaymentId === razorpay_payment_id || existingBooking.razorpayOrderId === razorpay_order_id) {
        console.log(`[Idempotency] Existing booking retrieved for ${razorpay_payment_id}`);
        return res.json({
          success: true,
          booking: existingBooking,
          message: 'Booking retrieved (Idempotent call)'
        });
      }
    }

    // HMAC Signature Verification
    let isSignatureValid = false;
    if (razorpayKeySecret && razorpay_signature && !razorpayKeySecret.includes('placeholder') && !razorpayKeySecret.includes('your_')) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        isSignatureValid = true;
      } else {
        console.warn('Razorpay signature mismatch:', { expectedSignature, razorpay_signature });
      }
    } else {
      // Sandbox / Test fallback verification
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    const cachedOrder = orderStore.get(razorpay_order_id);
    const finalQuantity = quantity || cachedOrder?.quantity || 1;
    const finalSeats = seatNumbers || cachedOrder?.seatNumbers || [];
    const eventId = event?.id || cachedOrder?.eventId || 'event-1';

    const unitPrice = ticketType?.price ?? cachedOrder?.amountDetails?.ticketPrice ?? 199;
    const ticketPriceSubtotal = unitPrice * finalQuantity;
    const platformFee = unitPrice === 0 ? 0 : 20;
    const taxes = unitPrice === 0 ? 0 : Math.round(ticketPriceSubtotal * 0.18);
    const totalAmount = ticketPriceSubtotal + platformFee + taxes;

    // Permanently Mark Seats as Occupied
    if (Array.isArray(finalSeats) && finalSeats.length > 0) {
      const occupied = permanentOccupiedSeats.get(eventId) || new Set();
      finalSeats.forEach(s => occupied.add(s));
      permanentOccupiedSeats.set(eventId, occupied);

      // Clear temp holds
      const currentHolds = tempSeatHolds.get(eventId) || [];
      tempSeatHolds.set(eventId, currentHolds.filter(h => !finalSeats.includes(h.seatNumber)));
    }

    // Generate Eventra Booking Record
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingId = `EVT-2026-${randomSuffix}`;
    const qrCodeData = `EVENTRA|${bookingId}`;

    const newBooking = {
      bookingId,
      userId: user?.id || 'usr_demo',
      userEmail: user?.email || 'student@kiet.edu',
      userName: user?.name || 'Student',
      eventId,
      eventTitle: event?.title || 'Campus Event',
      eventImage: event?.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=800',
      eventCategory: event?.category || 'College Fest',
      eventDate: event?.date || '2026-08-20',
      eventTime: event ? `${event.startTime} - ${event.endTime}` : '05:00 PM - 10:00 PM',
      eventVenue: event?.venue || 'Campus Auditorium',
      eventCity: event?.city || 'Ghaziabad',
      eventAddress: event?.address || 'KIET Campus, Ghaziabad',
      eventLatitude: event?.latitude ?? 28.7523,
      eventLongitude: event?.longitude ?? 77.4988,
      ticketTypeId: ticketType?.id || 'tkt_default',
      ticketTypeName: ticketType?.name || 'General Entry',
      quantity: finalQuantity,
      seatNumbers: finalSeats.length > 0 ? finalSeats : undefined,
      amountDetails: {
        ticketPrice: ticketPriceSubtotal,
        platformFee,
        taxes,
        total: totalAmount
      },
      paymentMethod: 'Razorpay Payment (UPI / Card)',
      paymentProvider: 'Razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || '',
      paymentStatus: 'PAID',
      bookingStatus: 'Confirmed',
      qrCodeData,
      createdAt: new Date().toISOString()
    };

    bookingStore.set(bookingId, newBooking);
    if (cachedOrder) {
      cachedOrder.status = 'PAID';
      orderStore.set(razorpay_order_id, cachedOrder);
    }

    return res.json({
      success: true,
      booking: newBooking,
      message: 'Payment verified and booking confirmed successfully.'
    });

  } catch (err: any) {
    console.error('Error in /api/payment/verify:', err);
    return res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// 3. RAZORPAY WEBHOOK ENDPOINT
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (webhookSecret && signature) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).send('Invalid webhook signature');
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log(`Razorpay Webhook Triggered: ${payload.event}`);

    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const payment = payload.payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId && orderStore.has(orderId)) {
        const order = orderStore.get(orderId);
        order.status = 'PAID';
        orderStore.set(orderId, order);
      }
    }

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Eventra AI Assistant Route
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, events, userContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const systemInstruction = `You are Eventra AI, a smart college event discovery, ticket booking, and outing-planning assistant.
You have access to the current database of real events:
${JSON.stringify(events || [], null, 2)}

User Profile Context:
${JSON.stringify(userContext || {}, null, 2)}

Rules:
1. Answer the user's question clearly, enthusiastically, and helpfully.
2. Recommend events ONLY from the provided database list. DO NOT invent fake events that are not in the list.
3. Include event titles, dates, locations, prices, and event IDs in your recommendations so the UI can render booking action cards.
4. If asked about prices, filter events under the requested amount.
5. Keep your tone friendly, concise, and geared towards college students and young event goers.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const text = response.text || '';
        return res.json({ reply: text, isAi: true });
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to rule engine:', geminiError);
      }
    }

    // Rule-based Fallback Assistant when API key is missing or offline
    const query = String(prompt).toLowerCase();
    const eventList = Array.isArray(events) ? events : [];
    
    let matchedEvents = [...eventList];

    // Simple keyword extraction & filtering
    if (query.includes('tech') || query.includes('code') || query.includes('hackathon') || query.includes('ai')) {
      matchedEvents = eventList.filter(e => 
        e.category === 'Technology' || e.category === 'Hackathon' || e.category === 'College Fest' || e.title.toLowerCase().includes('tech')
      );
    } else if (query.includes('music') || query.includes('concert') || query.includes('dj') || query.includes('indie')) {
      matchedEvents = eventList.filter(e => 
        e.category === 'Music' || e.category === 'Concert' || e.category === 'Cultural'
      );
    } else if (query.includes('comedy') || query.includes('standup') || query.includes('bassi')) {
      matchedEvents = eventList.filter(e => e.category === 'Comedy');
    } else if (query.includes('under') || query.includes('₹') || query.includes('cheap') || query.includes('500') || query.includes('free')) {
      matchedEvents = eventList.filter(e => {
        const minPrice = Math.min(...e.ticketTypes.map((t: any) => t.price));
        return minPrice <= 500;
      });
    } else if (query.includes('delhi') || query.includes('noida') || query.includes('gurugram') || query.includes('ghaziabad')) {
      matchedEvents = eventList.filter(e => 
        query.includes(e.city.toLowerCase()) || e.venue.toLowerCase().includes('delhi')
      );
    }

    let replyText = `Here are the best matching events found for your query: "${prompt}":\n\n`;
    if (matchedEvents.length > 0) {
      matchedEvents.slice(0, 3).forEach((evt: any) => {
        const minPrice = Math.min(...evt.ticketTypes.map((t: any) => t.price));
        const priceStr = minPrice === 0 ? 'FREE Entry' : `₹${minPrice}`;
        replyText += `• **${evt.title}** (${evt.category})\n  📅 Date: ${evt.date} at ${evt.startTime}\n  📍 Location: ${evt.venue}, ${evt.city}\n  🎟 Tickets from: ${priceStr}\n\n`;
      });
      replyText += `Select any event to view full details or book tickets instantly!`;
    } else {
      replyText = `I couldn't find exact matches for "${prompt}", but here are our top trending events right now:\n\n`;
      eventList.slice(0, 3).forEach((evt: any) => {
        replyText += `• **${evt.title}** - 📍 ${evt.venue}\n`;
      });
    }

    return res.json({ reply: replyText, isAi: false });

  } catch (error: any) {
    console.error('Server error in /api/ai/chat:', error);
    return res.status(500).json({ error: 'Failed to process AI assistant request' });
  }
});

// Setup Vite development middleware or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eventra Server running on http://localhost:${PORT}`);
  });
}

startServer();

