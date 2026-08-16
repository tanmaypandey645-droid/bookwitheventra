# Eventra - Next-Gen Campus & Live Event Experience Platform

Eventra is an event discovery, ticket booking, interactive 3D seat reservation, and collaborative squad planning application designed for college festivals, hackathons, concerts, and tech conferences.

---

## 🌟 Key Features

- **Interactive 3D Seating & Stage Sightlines**:
  - Orbit-controlled 3D stage preview with mouse drag rotation, zoom, and live sightline testing from any seat.
  - Multi-category tiered seating (VIP, Premium, Balcony, General).
- **Squad Mode & Social Outing Planning**:
  - Coordinate outing plans with dedicated squad members (**Tanmay, Bharat, Angel, Raksha**).
  - Add friends by 10-digit mobile phone numbers with instant invite generation.
  - One-click **"Book with Squad"** multi-ticket checkout with automatic cost split calculations.
- **Payment & Razorpay Gateway**:
  - Instant UPI Scan & Pay (Google Pay, PhonePe, Paytm, BHIM, CRED).
  - Full card, netbanking, and wallet support powered by Razorpay.
- **Digital Ticketing & Verification**:
  - Auto-generated PDF tickets with high-resolution verifiable QR codes.
  - Ticket detail modal with quick download and sharing capabilities.
- **Organizer Dashboard**:
  - Event creation, attendee analytics, revenue tracking, and seat status management.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend / Dev Server**: Node.js, Express, Vite
- **Visuals & QR**: HTML5 Canvas 3D rendering, QRCode, jsPDF

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-github-repo-url>
cd eventra
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## 📄 License
This project is open-source and available under the MIT License.
