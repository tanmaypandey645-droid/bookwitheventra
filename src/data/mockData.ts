import { Event, User, Booking, OutingPlan, NotificationItem } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_tanmay',
    name: 'Tanmay Pandey',
    email: 'tanmaypandey645@gmail.com',
    college: 'KIET Group of Institutions, Ghaziabad',
    city: 'Ghaziabad',
    interests: ['Technology', 'Hackathon', 'Music', 'College Fest', 'AI'],
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    savedAccount: true,
    phoneNumber: '+91 98765 43210',
    authenticationProvider: 'Google',
    createdAt: '2026-01-15T10:00:00.000Z',
    lastLoginAt: '2026-08-11T02:00:00.000Z'
  },
  {
    id: 'user_bharat',
    name: 'Bharat Sharma',
    email: 'bharat.sharma@kiet.edu',
    college: 'KIET Group of Institutions, Ghaziabad',
    city: 'Ghaziabad',
    interests: ['Technology', 'Hackathon', 'Robotics', 'Coding'],
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    phoneNumber: '+91 98112 34567',
  },
  {
    id: 'user_angel',
    name: 'Angel Joseph',
    email: 'angel.joseph@kiet.edu',
    college: 'KIET Group of Institutions, Ghaziabad',
    city: 'Ghaziabad',
    interests: ['Music', 'Concerts', 'Cultural', 'Design'],
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    phoneNumber: '+91 98223 45678',
  },
  {
    id: 'user_raksha',
    name: 'Raksha Singh',
    email: 'raksha.singh@kiet.edu',
    college: 'KIET Group of Institutions, Ghaziabad',
    city: 'Ghaziabad',
    interests: ['AI', 'Workshops', 'College Fest', 'Cybersecurity'],
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    phoneNumber: '+91 98334 56789',
  },
  {
    id: 'org_kiet',
    name: 'KIET Student Council & Tech Club',
    email: 'events@kiet.edu',
    college: 'KIET Group of Institutions',
    city: 'Ghaziabad',
    interests: ['College Fest', 'Technology'],
    profileImage: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80',
    role: 'organizer',
  }
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'evt-kiet-techfest-2026',
    title: 'KIET Tech Fest 2026 (Innotech & CyberWars)',
    description: 'The flagship annual technical fest of KIET Group of Institutions. Featuring 24-hr Hackathons, Robotics Arena, CyberWars CTF, Drone Racing, Coding Sprints, and Celebrity Tech Talks.',
    category: 'College Fest',
    tags: ['AI', 'Cybersecurity', 'Hackathon', 'Robotics', 'Coding', 'Technology', 'College Fest'],
    popularityScore: 92,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
    date: '2026-08-22',
    startTime: '10:00 AM',
    endTime: '08:00 PM',
    venue: 'KIET Main Campus Grounds & Auditorium',
    city: 'Ghaziabad',
    address: 'Delhi-NCR, Meerut Road, Muradnagar, Ghaziabad, Uttar Pradesh 201206',
    latitude: 28.7523,
    longitude: 77.4988,
    organizer: 'KIET Tech Council & IEEE Student Branch',
    organizerVerified: true,
    capacity: 2500,
    availableTickets: 420,
    interestsCount: 1840,
    seatingEnabled: true,
    occupiedSeats: ['A1', 'A2', 'B5', 'B6', 'C10', 'C11', 'D1', 'D2'],
    refundPolicy: 'Full refund up to 48 hours prior to event start.',
    createdAt: '2026-08-01T10:00:00Z',
    ticketTypes: [
      {
        id: 'tk-ktf-std',
        name: 'Student Pass (All Events Access)',
        price: 199,
        description: 'Grants access to all technical exhibitions, keynote sessions, and hackathon viewing.',
        capacity: 2000,
        available: 350
      },
      {
        id: 'tk-ktf-vip',
        name: 'VIP Arena Pass',
        price: 499,
        description: 'Front row seating for Celebrity Speaker session, Fast-Track Entry & Merchandise Kit.',
        capacity: 300,
        available: 45
      },
      {
        id: 'tk-ktf-team',
        name: 'Hackathon Team Entry (4 Members)',
        price: 799,
        description: 'Official 24-hr hackathon team participation with meals & mentoring included.',
        capacity: 200,
        available: 25
      }
    ],
    schedule: [
      { time: '10:00 AM', title: 'Inauguration & Keynote Address', description: 'Opening ceremony at Main Auditorium with Chief Guest from ISRO.', location: 'Auditorium' },
      { time: '11:30 AM', title: 'CyberWars CTF & Code Sprint', description: 'National level cybersecurity competition starts.', location: 'CS Block Lab 3' },
      { time: '02:00 PM', title: 'Robotics Wars & Drone Race', description: 'Heavyweight bot combat in the outdoor arena.', location: 'Central Grounds' },
      { time: '06:00 PM', title: 'Celebrity Tech Talk & Award Ceremony', description: 'Prize distribution followed by interactive AMA.', location: 'Main Stage' }
    ]
  },
  {
    id: 'evt-sunburn-campus-2026',
    title: 'Sunburn Campus Concert ft. DJ Nucleya & Lost Stories',
    description: 'Get ready for India’s premier electronic music festival coming to Delhi NCR campus grounds! Mind-blowing lasers, massive bass, and unforgettable festival vibes.',
    category: 'Concert',
    tags: ['Music', 'Concert', 'EDM', 'DJ', 'Festival', 'Dance', 'College Fest'],
    popularityScore: 98,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&auto=format&fit=crop&q=80',
    date: '2026-08-28',
    startTime: '05:00 PM',
    endTime: '10:30 PM',
    venue: 'IIT Delhi Athletics Grounds',
    city: 'New Delhi',
    address: 'Hauz Khas, New Delhi, Delhi 110016',
    latitude: 28.5450,
    longitude: 77.1926,
    organizer: 'Percept Live & IIT Delhi Gymkhana',
    organizerVerified: true,
    capacity: 5000,
    availableTickets: 850,
    interestsCount: 4210,
    seatingEnabled: false,
    refundPolicy: 'Non-refundable. Ticket transfer allowed via Eventra Squad Mode.',
    createdAt: '2026-08-02T12:00:00Z',
    ticketTypes: [
      {
        id: 'tk-sbn-gen',
        name: 'General Access Pass',
        price: 499,
        description: 'Standard festival arena access with food court stalls.',
        capacity: 4000,
        available: 720
      },
      {
        id: 'tk-sbn-fan',
        name: 'Fan Pit (Front Stage)',
        price: 999,
        description: 'Unrestricted front-of-stage access, dedicated bar counter, free Sunburn wristband.',
        capacity: 1000,
        available: 130
      }
    ],
    schedule: [
      { time: '05:00 PM', title: 'Gates Open & Opening DJ Sets', description: 'Student DJs performance.', location: 'Main Stage' },
      { time: '07:00 PM', title: 'Lost Stories Live Set', description: 'Progressive house and EDM anthems.', location: 'Main Stage' },
      { time: '08:45 PM', title: 'DJ NUCLEA Headliner', description: 'High-energy bass drop finale.', location: 'Main Stage' }
    ]
  },
  {
    id: 'evt-hackindia-2026',
    title: 'HackIndia 24-Hour AI & Web3 Innovation Hackathon',
    description: 'India’s largest student hackathon focused on building generative AI agents, Web3 protocols, and sustainable tech solutions. ₹5,00,000+ Prize Pool + Direct Investor Pitches!',
    category: 'Hackathon',
    tags: ['AI', 'Hackathon', 'Machine Learning', 'Python', 'Web3', 'Programming', 'Technology'],
    popularityScore: 95,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80',
    date: '2026-09-05',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    venue: 'BITS Pilani Off-Campus Innovation Hub',
    city: 'Noida',
    address: 'Sector 125, Noida, Uttar Pradesh 201313',
    latitude: 28.5435,
    longitude: 77.3320,
    organizer: 'HackIndia Foundation & BITS Innovation Cell',
    organizerVerified: true,
    capacity: 1000,
    availableTickets: 180,
    interestsCount: 3100,
    seatingEnabled: false,
    refundPolicy: 'Free participation event upon selection.',
    createdAt: '2026-08-03T09:00:00Z',
    ticketTypes: [
      {
        id: 'tk-hid-free',
        name: 'Free Hacker Pass (Solo / Team)',
        price: 0,
        description: 'Includes meals, hacker swag, high-speed WiFi, overnight staying space, and sponsor credits.',
        capacity: 1000,
        available: 180
      }
    ],
    schedule: [
      { time: '09:00 AM', title: 'Check-in & Breakfast', description: 'Badges and hacker kits distribution.', location: 'Lobby' },
      { time: '10:30 AM', title: 'Hacking Phase Begins', description: '24-hour continuous coding sprint starts.', location: 'Main Arena' },
      { time: '03:00 PM', title: 'Mentorship Rounds', description: 'Industry experts review team architectures.', location: 'Mentor Booths' }
    ]
  },
  {
    id: 'evt-ecell-pitch-2026',
    title: 'E-Cell Startup Summit & Angel Pitch Night',
    description: 'Watch top 15 college startups pitch live to leading Angel Investors & VCs! Featuring keynote panels on raising pre-seed funding, product building, and growth hacks.',
    category: 'Entrepreneurship',
    tags: ['Entrepreneurship', 'Startup', 'Business', 'Technology', 'Funding', 'Innovation'],
    popularityScore: 85,
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80',
    date: '2026-09-12',
    startTime: '02:00 PM',
    endTime: '07:30 PM',
    venue: 'DTU BR Ambedkar Main Auditorium',
    city: 'New Delhi',
    address: 'Shahbad Daulatpur, Main Bawana Road, Delhi 110042',
    latitude: 28.7499,
    longitude: 77.1170,
    organizer: 'E-Cell DTU',
    organizerVerified: true,
    capacity: 800,
    availableTickets: 290,
    interestsCount: 1250,
    seatingEnabled: true,
    occupiedSeats: ['B1', 'B2', 'B3'],
    refundPolicy: 'Refunds permitted up to 24 hours prior.',
    createdAt: '2026-08-04T15:00:00Z',
    ticketTypes: [
      {
        id: 'tk-ecl-std',
        name: 'Student Attendee Pass',
        price: 149,
        description: 'Audience seat, networking lounge access, certificate of participation.',
        capacity: 700,
        available: 250
      },
      {
        id: 'tk-ecl-fnd',
        name: 'Founder Pitch Pass',
        price: 399,
        description: 'Includes pitch slot application, investor 1-on-1 meetup lounge access.',
        capacity: 100,
        available: 40
      }
    ],
    schedule: [
      { time: '02:00 PM', title: 'Investor Panel: From Campus to $10M ARR', description: 'Insights from YC alumni and Indian founders.', location: 'Auditorium' },
      { time: '04:00 PM', title: 'Live Pitch Competition', description: 'Top 15 startups pitch in 5-min slots.', location: 'Main Stage' },
      { time: '06:30 PM', title: 'High-Tea & Founder Networking', description: '1-on-1 conversations over tea and coffee.', location: 'VIP Lounge' }
    ]
  },
  {
    id: 'evt-bassi-comedy-2026',
    title: 'Standup Comedy Night with Anubhav Bassi Live',
    description: 'Get ready for two hours of non-stop laughter with Anubhav Bassi! Relive hilarious college stories, hostel banter, and relatable everyday chaos.',
    category: 'Comedy',
    tags: ['Comedy', 'Standup', 'Entertainment', 'Humor', 'Live Show'],
    popularityScore: 96,
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1000&auto=format&fit=crop&q=80',
    date: '2026-09-18',
    startTime: '07:00 PM',
    endTime: '09:00 PM',
    venue: 'Kingdom of Dreams Open Air Theatre',
    city: 'Gurugram',
    address: 'Auditorium Complex, Sector 29, Gurugram, Haryana 122001',
    latitude: 28.4682,
    longitude: 77.0628,
    organizer: 'Comicstaan Live & Canvas Laugh Club',
    organizerVerified: true,
    capacity: 1200,
    availableTickets: 140,
    interestsCount: 3890,
    seatingEnabled: true,
    occupiedSeats: ['A10', 'A11', 'A12', 'B12', 'B13', 'C1', 'C2'],
    refundPolicy: 'Non-refundable.',
    createdAt: '2026-08-05T11:00:00Z',
    ticketTypes: [
      {
        id: 'tk-bsc-balc',
        name: 'Standard Balcony Seat',
        price: 399,
        description: 'Elevated seating tier with clear stage sightlines.',
        capacity: 800,
        available: 95
      },
      {
        id: 'tk-bsc-front',
        name: 'Front Row Premium Seat',
        price: 699,
        description: 'Closest to stage with row seating and complimentary beverage voucher.',
        capacity: 400,
        available: 45
      }
    ],
    schedule: [
      { time: '07:00 PM', title: 'Opening Act: Up-and-coming Student Comic', description: '15 min warm-up set.', location: 'Main Stage' },
      { time: '07:20 PM', title: 'Anubhav Bassi Main Special', description: 'Brand new 90-minute standup show.', location: 'Main Stage' }
    ]
  },
  {
    id: 'evt-esports-bgmi-2026',
    title: 'Inter-College eSports BGMI & FIFA 26 Championship',
    description: 'Battle for supremacy in BGMI and FIFA 26! Live spectator arena with shoutcasting, gaming gear booths, giveaways, and ₹1,50,000 cash prizes.',
    category: 'Sports',
    tags: ['Sports', 'Gaming', 'eSports', 'BGMI', 'FIFA', 'Tournament'],
    popularityScore: 90,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80',
    date: '2026-09-22',
    startTime: '11:00 AM',
    endTime: '08:00 PM',
    venue: 'Cyber Hub Gaming Arena & Amphitheatre',
    city: 'Gurugram',
    address: 'DLF Cyber City, Phase 2, Gurugram, Haryana 122002',
    latitude: 28.4950,
    longitude: 77.0887,
    organizer: 'Nodwin Gaming & Delhi eSports Club',
    organizerVerified: true,
    capacity: 1500,
    availableTickets: 310,
    interestsCount: 2450,
    seatingEnabled: false,
    refundPolicy: 'Refunds permitted up to 7 days before tournament date.',
    createdAt: '2026-08-05T14:00:00Z',
    ticketTypes: [
      {
        id: 'tk-esp-solo',
        name: 'FIFA 26 Solo Player Pass',
        price: 199,
        description: 'Guaranteed minimum 2 tournament matches on PS5 consoles.',
        capacity: 500,
        available: 120
      },
      {
        id: 'tk-esp-sqd',
        name: 'BGMI Squad Pass (4 Players)',
        price: 599,
        description: 'Official squad entry into custom room LAN tournament.',
        capacity: 300,
        available: 70
      },
      {
        id: 'tk-esp-spec',
        name: 'Spectator & Gaming Pass',
        price: 99,
        description: 'Live arena seating, VR gaming trial zone access.',
        capacity: 700,
        available: 120
      }
    ],
    schedule: [
      { time: '11:00 AM', title: 'FIFA 26 Group Stage Matches', description: 'Simultaneous matches across 20 PS5 stations.', location: 'PS5 Zone' },
      { time: '02:00 PM', title: 'BGMI LAN Quarter-Finals', description: 'Top 32 squads compete on high-refresh mobile rigs.', location: 'Main Stage' },
      { time: '06:30 PM', title: 'Grand Finals & Trophy Ceremony', description: 'Live broadcasted finale with professional casters.', location: 'Main Stage' }
    ]
  },
  {
    id: 'evt-gemini-pytorch-workshop-2026',
    title: 'Hands-on AI Workshop: Gemini API & PyTorch Fine-Tuning',
    description: 'Learn to build production-grade AI agents using Google Gemini 3.6 Flash and PyTorch. Build real multimodal projects, agentic workflows, and deploy to Cloud Run.',
    category: 'Workshop',
    tags: ['AI', 'Machine Learning', 'Python', 'Workshop', 'Technology', 'Programming', 'Coding'],
    popularityScore: 94,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
    date: '2026-09-26',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    venue: 'IIIT Delhi Computer Science Lab 102',
    city: 'New Delhi',
    address: 'Okhla Industrial Estate, Phase III, New Delhi 110020',
    latitude: 28.5457,
    longitude: 77.2732,
    organizer: 'Google Developer Student Club (GDSC) IIITD',
    organizerVerified: true,
    capacity: 120,
    availableTickets: 22,
    interestsCount: 1680,
    seatingEnabled: true,
    occupiedSeats: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2'],
    refundPolicy: 'Full refund if cancelled 24 hours prior.',
    createdAt: '2026-08-06T10:00:00Z',
    ticketTypes: [
      {
        id: 'tk-ai-wrk',
        name: 'Interactive Lab Seat Pass',
        price: 299,
        description: 'Includes lab PC access, $50 Google Cloud credits, completion certificate, and lunch.',
        capacity: 120,
        available: 22
      }
    ],
    schedule: [
      { time: '10:00 AM', title: 'Introduction to Multimodal Gemini 3.6', description: 'Prompt engineering & function calling fundamentals.', location: 'Lab 102' },
      { time: '01:00 PM', title: 'Networking Lunch', description: 'Complimentary buffet for attendees.', location: 'Cafeteria' },
      { time: '02:00 PM', title: 'Building & Deploying Agentic AI Apps', description: 'Hands-on coding session.', location: 'Lab 102' }
    ]
  },
  {
    id: 'evt-bollywood-cultural-2026',
    title: 'Bollywood Cultural Night, Fashion Walk & Star DJ',
    description: 'Celebration of Indian art, dance, fashion, and cinema! Inter-college dance battle, celebrity fashion show, and high-octane DJ performance.',
    category: 'Cultural',
    tags: ['Cultural', 'Dance', 'Bollywood', 'Fashion', 'Music', 'College Fest'],
    popularityScore: 88,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1000&auto=format&fit=crop&q=80',
    date: '2026-10-02',
    startTime: '06:00 PM',
    endTime: '11:00 PM',
    venue: 'Amity University Central Amphitheatre',
    city: 'Noida',
    address: 'Sector 125, Noida, Uttar Pradesh 201313',
    latitude: 28.5430,
    longitude: 77.3330,
    organizer: 'Amity Cultural Society',
    organizerVerified: true,
    capacity: 3000,
    availableTickets: 600,
    interestsCount: 2980,
    seatingEnabled: false,
    refundPolicy: 'Refundable up to 3 days prior.',
    createdAt: '2026-08-06T16:00:00Z',
    ticketTypes: [
      {
        id: 'tk-cul-std',
        name: 'Cultural Evening Pass',
        price: 249,
        description: 'Includes entry to dance show, fashion walk, and DJ night.',
        capacity: 3000,
        available: 600
      }
    ],
    schedule: [
      { time: '06:00 PM', title: 'Inter-College Group Dance Finals', description: 'Top 10 dance crews perform live.', location: 'Amphitheatre' },
      { time: '08:00 PM', title: 'Ethnic Fashion Walk', description: 'Choreographed theme showcase.', location: 'Ramp' },
      { time: '09:30 PM', title: 'Bollywood Beats DJ Night', description: 'Dance floor open to all attendees.', location: 'Main Ground' }
    ]
  },
  {
    id: 'evt-unplugged-indie-2026',
    title: 'Indie Acoustic Evening ft. Local College Bands',
    description: 'Unwind with soul-stirring indie folk, acoustic rock, and original poetry in an intimate candlelit rooftop setting in Hauz Khas Village.',
    category: 'Music',
    tags: ['Music', 'Acoustic', 'Indie', 'Live Music', 'Poetry', 'Concert'],
    popularityScore: 82,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80',
    date: '2026-10-08',
    startTime: '06:30 PM',
    endTime: '09:30 PM',
    venue: 'Hauz Khas Social Rooftop',
    city: 'New Delhi',
    address: '9A & 12, Hauz Khas Village, New Delhi 110016',
    latitude: 28.5532,
    longitude: 77.1945,
    organizer: 'Delhi Underground Music Scene',
    organizerVerified: true,
    capacity: 150,
    availableTickets: 35,
    interestsCount: 910,
    seatingEnabled: false,
    refundPolicy: 'Full refund up to 24 hrs before event.',
    createdAt: '2026-08-07T09:00:00Z',
    ticketTypes: [
      {
        id: 'tk-ind-pass',
        name: 'Rooftop Access + Welcome Mocktail',
        price: 350,
        description: 'Guaranteed comfortable lounge seat and 1 signature drink included.',
        capacity: 150,
        available: 35
      }
    ],
    schedule: [
      { time: '06:30 PM', title: 'Acoustic Set 1: Yellow Cab Band', description: 'Indie rock covers & originals.', location: 'Rooftop Stage' },
      { time: '08:00 PM', title: 'Acoustic Set 2: Surbhi & Friends', description: 'Sufi fusion & acoustic tunes.', location: 'Rooftop Stage' }
    ]
  },
  {
    id: 'evt-drones-robotics-2026',
    title: 'Autonomous Drone Flying & Robotics Expo',
    description: 'Witness autonomous drone obstacle courses, AI vision race tracks, and interactive robotics exhibits crafted by top engineering university labs.',
    category: 'Technology',
    tags: ['Technology', 'Robotics', 'AI', 'Drones', 'Hardware', 'Engineering'],
    popularityScore: 86,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=1000&auto=format&fit=crop&q=80',
    date: '2026-10-15',
    startTime: '10:00 AM',
    endTime: '05:00 PM',
    venue: 'Bennett University Indoor Sports Complex',
    city: 'Greater Noida',
    address: 'Plot No 8-11, TechZone II, Greater Noida, Uttar Pradesh 201310',
    latitude: 28.4600,
    longitude: 77.5020,
    organizer: 'Robotics Society of India',
    organizerVerified: true,
    capacity: 1000,
    availableTickets: 450,
    interestsCount: 1120,
    seatingEnabled: true,
    occupiedSeats: ['A1', 'A2'],
    refundPolicy: 'Refundable.',
    createdAt: '2026-08-07T14:00:00Z',
    ticketTypes: [
      {
        id: 'tk-drn-pass',
        name: 'Expo Entry Ticket',
        price: 199,
        description: 'Full day access to FPV drone flight simulator & arena seats.',
        capacity: 1000,
        available: 450
      }
    ],
    schedule: [
      { time: '10:00 AM', title: 'FPV Drone Sprint Time Trials', description: 'Speeds up to 120 km/h indoor circuit.', location: 'Arena' },
      { time: '02:00 PM', title: 'AI Vision Drone Obstacle Race', description: 'Fully autonomous navigation challenge.', location: 'Arena' }
    ]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_PLANS: OutingPlan[] = [
  {
    id: 'plan_kiet_squad_1',
    eventId: 'evt-kiet-techfest-2026',
    eventTitle: 'KIET Tech Fest 2026 (Innotech & CyberWars)',
    eventDate: '2026-08-22',
    eventVenue: 'KIET Main Campus Grounds & Auditorium',
    creatorId: 'user_tanmay',
    creatorName: 'Tanmay Pandey',
    friends: [
      { id: 'user_tanmay', name: 'Tanmay Pandey', email: 'tanmaypandey645@gmail.com', phoneNumber: '+91 98765 43210', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'Accepted' },
      { id: 'user_bharat', name: 'Bharat Sharma', email: 'bharat.sharma@kiet.edu', phoneNumber: '+91 98112 34567', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', status: 'Accepted' },
      { id: 'user_angel', name: 'Angel Joseph', email: 'angel.joseph@kiet.edu', phoneNumber: '+91 98223 45678', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', status: 'Accepted' },
      { id: 'user_raksha', name: 'Raksha Singh', email: 'raksha.singh@kiet.edu', phoneNumber: '+91 98334 56789', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'Accepted' }
    ],
    meetingPoint: 'Metro Station Gate 2 (Shaheed Sthal / Bus Stop)',
    meetingPointLocation: {
      name: 'Metro Station Gate 2 (Shaheed Sthal / Bus Stop)',
      address: 'Shaheed Sthal (New Bus Adda) Metro Station, Red Line, Ghaziabad',
      latitude: 28.6712,
      longitude: 77.4121
    },
    meetingTime: '09:30 AM',
    notes: 'Squad Assembled (Tanmay, Bharat, Angel, Raksha): Meeting at Metro Gate 2 to take the campus express shuttle together. Bring college IDs!',
    seats: ['A12', 'A13', 'A14', 'A15'],
    status: 'Active',
    createdAt: '2026-08-07T19:00:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_welcome',
    userId: 'user_tanmay',
    title: '🎓 Welcome to Eventra!',
    message: 'Discover verified college fests, concerts, hackathons and tech sprints across Delhi NCR.',
    date: 'Just now',
    read: false,
    type: 'system',
    link: '/discover'
  },
  {
    id: 'notif_2',
    userId: 'user_tanmay',
    title: '👥 Squad Confirmed (4 Members)',
    message: 'Bharat, Angel, and Raksha joined your squad for KIET Tech Fest 2026.',
    date: '10 mins ago',
    read: false,
    type: 'squad',
    link: '/plans'
  },
  {
    id: 'notif_3',
    userId: 'user_tanmay',
    title: '✨ Recommended Event for You',
    message: 'HackIndia 24-Hour AI Hackathon matches your interest in AI & Hackathons.',
    date: 'Yesterday',
    read: true,
    type: 'recommendation',
    link: '/discover'
  }
];
