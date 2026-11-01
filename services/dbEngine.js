const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword } = require('./security');

// Use /tmp directory on Vercel/serverless where standard filesystem is read-only
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless 
  ? path.join('/tmp', 'gatherly_data') 
  : path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'gatherly_db.json');

// Generate 24-character hex ObjectId matching MongoDB format
function generateObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

class DBEngine {
  constructor() {
    this.data = {
      users: [],
      events: [],
      budgets: [],
      expenses: [],
      vendors: [],
      tasks: [],
      ai_recommendations: []
    };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch (e) {
          // Read-only filesystem, continue with in-memory store
        }
      }

      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf8');
          this.data = JSON.parse(raw);
          if (!this.data.events || this.data.events.length === 0 || this.data.events[0]?.location?.includes('Napa Valley')) {
            this.seedInitialData();
          }
        } catch (err) {
          console.warn('[Gatherly DB] Initializing fresh dataset:', err.message);
          this.seedInitialData();
        }
      } else {
        this.seedInitialData();
      }
    } catch (outerErr) {
      console.warn('[Gatherly DB] Operating purely in-memory:', outerErr.message);
      this.seedInitialData();
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      // In-memory changes persist during runtime
    }
  }

  // Model-like wrapper for collections
  collection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }

    const self = this;
    const items = this.data[name];

    return {
      find: async (query = {}) => {
        return items.filter(item => self.matchesQuery(item, query)).map(i => ({ ...i }));
      },
      findOne: async (query = {}) => {
        const found = items.find(item => self.matchesQuery(item, query));
        return found ? { ...found } : null;
      },
      findById: async (id) => {
        const found = items.find(item => item._id === id || item._id === id.toString());
        return found ? { ...found } : null;
      },
      create: async (doc) => {
        const now = new Date().toISOString();
        const newDoc = {
          _id: doc._id || generateObjectId(),
          ...doc,
          createdAt: doc.createdAt || now,
          updatedAt: now
        };
        items.push(newDoc);
        self.save();
        return { ...newDoc };
      },
      findByIdAndUpdate: async (id, update, options = {}) => {
        const idx = items.findIndex(item => item._id === id || item._id === id.toString());
        if (idx === -1) return null;

        const updatedData = update.$set ? { ...items[idx], ...update.$set } : { ...items[idx], ...update };
        updatedData.updatedAt = new Date().toISOString();
        items[idx] = updatedData;
        self.save();
        return { ...items[idx] };
      },
      findByIdAndDelete: async (id) => {
        const idx = items.findIndex(item => item._id === id || item._id === id.toString());
        if (idx === -1) return null;
        const [removed] = items.splice(idx, 1);
        self.save();
        return removed;
      },
      deleteMany: async (query = {}) => {
        const beforeCount = items.length;
        const remaining = items.filter(item => !self.matchesQuery(item, query));
        self.data[name] = remaining;
        self.save();
        return { deletedCount: beforeCount - remaining.length };
      },
      countDocuments: async (query = {}) => {
        return items.filter(item => self.matchesQuery(item, query)).length;
      }
    };
  }

  matchesQuery(item, query) {
    for (const key of Object.keys(query)) {
      if (key === '$or') {
        const orConditions = query[key];
        const anyMatch = orConditions.some(cond => this.matchesQuery(item, cond));
        if (!anyMatch) return false;
        continue;
      }

      const expected = query[key];
      const actual = item[key];

      if (typeof expected === 'object' && expected !== null) {
        if (expected.$in && Array.isArray(expected.$in)) {
          if (!expected.$in.includes(actual)) return false;
        } else if (expected.$ne !== undefined) {
          if (actual === expected.$ne) return false;
        } else if (expected.$gte !== undefined) {
          if (actual < expected.$gte) return false;
        } else if (expected.$lte !== undefined) {
          if (actual > expected.$lte) return false;
        }
      } else {
        if (actual !== expected && String(actual) !== String(expected)) {
          return false;
        }
      }
    }
    return true;
  }

  seedInitialData() {
    console.log('Seeding Gatherly Indian demo events in Rupees (INR)...');
    const userId = generateObjectId();
    const demoUser = {
      _id: userId,
      name: 'Pooja Sharma',
      email: 'demo@gatherly.ai',
      password: hashPassword('password123'),
      role: 'planner',
      avatar: 'avatar-pooja.png',
      createdAt: new Date().toISOString()
    };

    // Event 1: Royal Indian Wedding in Udaipur
    const event1Id = generateObjectId();
    const event1 = {
      _id: event1Id,
      userId,
      name: "Aarav & Diya's Royal Palace Wedding",
      type: 'wedding',
      date: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(), // 45 days in future
      location: 'The Oberoi Udaivilas, Lake Pichola, Udaipur, Rajasthan',
      guestCount: 350,
      estimatedBudget: 4500000, // ₹45,00,000
      theme: 'Royal Rajputana Gilded Gold & Marigold Crimson',
      preferences: {
        colorPalette: ['#D63031', '#FDCB6E', '#6C5CE7', '#FFF200'],
        dietaryOptions: ['Royal Rajasthani Thali', 'Dal Baati Churma', 'Live Chaat Counter', 'Jain Pure Veg'],
        entertainmentStyle: 'Live Punjabi Dhol, Sufi Ghazals & Bollywood Sangeet DJ',
        atmosphere: 'Palatial, Opulent, Vibrant & Spiritual',
        notes: 'Sunset lakeside Varmala, followed by grand courtyard dinner with 1,000 floating brass diya lamps and folk fire dancers.'
      },
      status: 'planning',
      createdAt: new Date().toISOString()
    };

    // Event 2: Bollywood Neon Birthday Bash in Mumbai
    const event2Id = generateObjectId();
    const event2 = {
      _id: event2Id,
      userId,
      name: "Kabir's 25th Bollywood Neon Rooftop Bash",
      type: 'birthday',
      date: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(), // 20 days in future
      location: 'Bandra Seaface Sky Lounge, Mumbai, Maharashtra',
      guestCount: 60,
      estimatedBudget: 350000, // ₹3,50,000
      theme: 'Bollywood Retro 90s & Cyber Neon',
      preferences: {
        colorPalette: ['#E84393', '#6C5CE7', '#00CEC9', '#FDCB6E'],
        dietaryOptions: ['Mumbai Street Sliders', 'Gourmet Tikkas', 'Craft Cocktails'],
        entertainmentStyle: 'Bollywood Remix DJ & Retro Video Booth',
        atmosphere: 'High-energy, Trendy & Glamorous',
        notes: 'LED dhol performance, neon sunglasses for all guests, and custom Bollywood photo backdrop.'
      },
      status: 'planning',
      createdAt: new Date().toISOString()
    };

    // Event 3: Cultural Eco-Festival in Bengaluru
    const event3Id = generateObjectId();
    const event3 = {
      _id: event3Id,
      userId,
      name: 'Bengaluru Tech & Artisan Eco-Utsav',
      type: 'community',
      date: new Date(Date.now() + 75 * 24 * 3600 * 1000).toISOString(), // 75 days in future
      location: 'Cubbon Park Open Grounds, Bengaluru, Karnataka',
      guestCount: 800,
      estimatedBudget: 1200000, // ₹12,00,000
      theme: 'Karnataka Cultural Heritage & Eco Artisan Fair',
      preferences: {
        colorPalette: ['#00B894', '#FDCB6E', '#6C5CE7', '#DFE6E9'],
        dietaryOptions: ['South Indian Filter Coffee', 'Millet Dosa Stalls', 'Mysore Pak Desserts'],
        entertainmentStyle: 'Yakshagana Folk Dance, Indie Fusion Bands & Pottery Workshops',
        atmosphere: 'Inclusive, Cultural, Vibrant & Sustainable',
        notes: 'Zero-waste event, clay cups for drinks, organic handloom stalls, and city art awards.'
      },
      status: 'planning',
      createdAt: new Date().toISOString()
    };

    this.data.users = [demoUser];
    this.data.events = [event1, event2, event3];

    // Seed Budgets in Rupees
    this.data.budgets = [
      {
        _id: generateObjectId(),
        eventId: event1Id,
        totalBudget: 4500000, // ₹45 Lakhs
        categories: [
          { name: 'Venue', allocatedAmount: 1600000, percentage: 36 },
          { name: 'Catering', allocatedAmount: 1200000, percentage: 27 },
          { name: 'Photography', allocatedAmount: 450000, percentage: 10 },
          { name: 'Decoration', allocatedAmount: 400000, percentage: 9 },
          { name: 'Entertainment', allocatedAmount: 300000, percentage: 7 },
          { name: 'Transportation', allocatedAmount: 150000, percentage: 3 },
          { name: 'Invitations', allocatedAmount: 100000, percentage: 2 },
          { name: 'Lighting & Sound', allocatedAmount: 150000, percentage: 3 },
          { name: 'Contingency', allocatedAmount: 150000, percentage: 3 }
        ],
        contingencyRate: 8,
        currency: 'INR',
        notes: 'Udaipur palace destination wedding allocation.'
      },
      {
        _id: generateObjectId(),
        eventId: event2Id,
        totalBudget: 350000, // ₹3.5 Lakhs
        categories: [
          { name: 'Venue', allocatedAmount: 120000, percentage: 34 },
          { name: 'Catering', allocatedAmount: 110000, percentage: 31 },
          { name: 'Decoration', allocatedAmount: 45000, percentage: 13 },
          { name: 'Entertainment', allocatedAmount: 40000, percentage: 11 },
          { name: 'Photography', allocatedAmount: 20000, percentage: 6 },
          { name: 'Contingency', allocatedAmount: 15000, percentage: 5 }
        ],
        contingencyRate: 5,
        currency: 'INR',
        notes: 'Bandra rooftop lounge package.'
      },
      {
        _id: generateObjectId(),
        eventId: event3Id,
        totalBudget: 1200000, // ₹12 Lakhs
        categories: [
          { name: 'Venue', allocatedAmount: 200000, percentage: 17 },
          { name: 'Lighting & Sound', allocatedAmount: 280000, percentage: 23 },
          { name: 'Entertainment', allocatedAmount: 220000, percentage: 18 },
          { name: 'Decoration', allocatedAmount: 160000, percentage: 13 },
          { name: 'Catering', allocatedAmount: 140000, percentage: 12 },
          { name: 'Transportation', allocatedAmount: 70000, percentage: 6 },
          { name: 'Invitations', allocatedAmount: 50000, percentage: 4 },
          { name: 'Contingency', allocatedAmount: 80000, percentage: 7 }
        ],
        contingencyRate: 10,
        currency: 'INR',
        notes: 'Supported by Bengaluru city cultural fund.'
      }
    ];

    // Seed Expenses in Rupees for Event 1
    this.data.expenses = [
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'Venue',
        title: 'Palace Lakefront Lawn & Heritage Courtyard Advance',
        estimatedAmount: 1600000,
        actualAmount: 1625000,
        paymentStatus: 'paid',
        dueDate: '2026-10-15',
        notes: 'Includes royal suites and rehearsal spaces'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'Catering',
        title: 'Royal Banquet, Live Chaat Counter & Halwai Sweets',
        estimatedAmount: 1200000,
        actualAmount: 1180000,
        paymentStatus: 'partial',
        dueDate: '2026-11-20',
        notes: '50% advance given to Rajputana Caterers'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'Photography',
        title: '3-Day 4K Cinematic Wedding Film & Pre-Wedding Shoot',
        estimatedAmount: 450000,
        actualAmount: 450000,
        paymentStatus: 'paid',
        dueDate: '2026-10-25',
        notes: 'Full drone license and candid photographer'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'Decoration',
        title: 'Mandapam, Marigold Floral Drapes & Brass Urlis',
        estimatedAmount: 400000,
        actualAmount: 380000,
        paymentStatus: 'partial',
        dueDate: '2026-12-01',
        notes: 'Advance paid to Genda Phool Decorators'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'Entertainment',
        title: 'Live Punjabi Dhol Troupe & Celebrity Sangeet DJ',
        estimatedAmount: 300000,
        actualAmount: 310000,
        paymentStatus: 'unpaid',
        dueDate: '2026-12-05',
        notes: 'Awaiting final playlist approval'
      }
    ];

    // Seed Indian Vendors
    this.data.vendors = [
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'The Oberoi Udaivilas Palace',
        category: 'Venue',
        contactPerson: 'Vikramaditya Singh Rathore',
        email: 'events.udaivilas@oberoihotels.com',
        phone: '+91 294 243 3300',
        status: 'booked',
        quotedAmount: 1600000,
        agreedAmount: 1625000,
        depositPaid: 1625000,
        paymentStatus: 'fully_paid',
        contractNotes: 'Includes lakeside lawn for Varmala, heritage courtyard for dinner, sound curfew 10:30 PM.',
        checklistItems: [
          { title: 'Site walkthrough with decor team', isCompleted: true },
          { title: 'Confirm royal boat arrival for Baaraat', isCompleted: true },
          { title: 'Verify guest room block allocations', isCompleted: true }
        ]
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'Shahi Rajputana Caterers & Halwai',
        category: 'Catering',
        contactPerson: 'Chef Ratan Maharaj',
        email: 'ratan@shahicaterers.in',
        phone: '+91 98290 12345',
        status: 'booked',
        quotedAmount: 1250000,
        agreedAmount: 1180000,
        depositPaid: 590000,
        paymentStatus: 'deposit_paid',
        contractNotes: '350 guests, 4-course traditional feast, Delhi Chaat street live counters, Rabri Jalebi dessert.',
        checklistItems: [
          { title: 'Food tasting session completed', isCompleted: true },
          { title: 'Special Jain menu setup confirmed', isCompleted: true },
          { title: 'Midnight coffee and snack stall arranged', isCompleted: false }
        ]
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'ShutterShree Wedding Cinematography',
        category: 'Photography',
        contactPerson: 'Arjun Mehta',
        email: 'arjun@shuttershree.com',
        phone: '+91 98200 45678',
        status: 'booked',
        quotedAmount: 480000,
        agreedAmount: 450000,
        depositPaid: 450000,
        paymentStatus: 'fully_paid',
        contractNotes: '3 days coverage (Mehendi, Sangeet, Wedding & Reception), teaser video within 7 days, 4K film.',
        checklistItems: [
          { title: 'Pre-wedding video shoot completed in Jaipur', isCompleted: true },
          { title: 'Submit family photo shot list', isCompleted: false }
        ]
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'Genda Phool & Zari Wedding Decor',
        category: 'Decoration',
        contactPerson: 'Ananya Deshmukh',
        email: 'ananya@gendaphooldecor.in',
        phone: '+91 98333 78901',
        status: 'booked',
        quotedAmount: 420000,
        agreedAmount: 380000,
        depositPaid: 190000,
        paymentStatus: 'deposit_paid',
        contractNotes: 'Mandap by the lake with fresh marigolds & mogra, brass diya stands, royal velvet bolsters.',
        checklistItems: [
          { title: 'Color sample matching review', isCompleted: true },
          { title: 'Floral entrance arch dimensions checked', isCompleted: true }
        ]
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'Rhythm Beats Punjabi Dhol & Sangeet DJ',
        category: 'Entertainment',
        contactPerson: 'DJ Harpreet & Sunny Dholia',
        email: 'booking@rhythmbeats.in',
        phone: '+91 98111 23456',
        status: 'quoted',
        quotedAmount: 320000,
        agreedAmount: 310000,
        depositPaid: 0,
        paymentStatus: 'pending',
        contractNotes: '4 live Punjabi dhol players for Baaraat + 4-hour high-voltage Bollywood Sangeet set.',
        checklistItems: [
          { title: 'Submit Sangeet family performance songs', isCompleted: false },
          { title: 'First couple dance track audio mastered', isCompleted: false }
        ]
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'Maharaja Heritage Royal Coaches',
        category: 'Transportation',
        contactPerson: 'Suresh Verma',
        email: 'tours@maharajacoaches.in',
        phone: '+91 294 252 7788',
        status: 'booked',
        quotedAmount: 160000,
        agreedAmount: 150000,
        depositPaid: 75000,
        paymentStatus: 'deposit_paid',
        contractNotes: 'Airport pickup AC Volvo buses from Udaipur Airport + Vintage open Chevrolet for Baaraat.',
        checklistItems: [
          { title: 'Airport flight arrival spreadsheet shared', isCompleted: true }
        ]
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'Kankotri Gold Foil Invitations',
        category: 'Invitations',
        contactPerson: 'Kunal Choksi',
        email: 'kunal@kankotri.in',
        phone: '+91 98920 11223',
        status: 'completed',
        quotedAmount: 110000,
        agreedAmount: 100000,
        depositPaid: 100000,
        paymentStatus: 'fully_paid',
        contractNotes: 'Royal box invites with gold foil embossed Ganesha, dry fruit jar inserts, and digital QR RSVP.',
        checklistItems: [
          { title: 'Card proofs approved by family elders', isCompleted: true },
          { title: 'Couriers dispatched to all 350 families', isCompleted: true }
        ]
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        name: 'Luster Glow Lights & Stage Engineering',
        category: 'Lighting & Sound',
        contactPerson: 'Farhan Qureshi',
        email: 'farhan@lusterglow.in',
        phone: '+91 97690 33445',
        status: 'booked',
        quotedAmount: 165000,
        agreedAmount: 150000,
        depositPaid: 75000,
        paymentStatus: 'deposit_paid',
        contractNotes: 'Warm amber wash lights on palace stone walls, waterproof lake pontoon audio system.',
        checklistItems: [
          { title: 'Power generator backup verified with palace', isCompleted: true }
        ]
      }
    ];

    // Seed Indian Timeline Tasks
    this.data.tasks = [
      // 3 Months Before
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Lock In Palace Venue & Pay Advance Deposit',
        description: 'Reserve The Oberoi Udaivilas lawns and block 40 guest rooms.',
        milestonePeriod: '3_months_before',
        dueDate: '2026-09-15',
        isCompleted: true,
        priority: 'high',
        category: 'Venue',
        assignedTo: 'Aarav & Diya'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Dispatch Royal Kankotri Wedding Cards',
        description: 'Send invitation boxes with dry fruits and QR RSVP link.',
        milestonePeriod: '3_months_before',
        dueDate: '2026-09-20',
        isCompleted: true,
        priority: 'high',
        category: 'Invitations',
        assignedTo: 'Family Elders'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Book Bridal Lehenga & Sherwani Couturiers',
        description: 'Schedule custom embroidery and trial sessions.',
        milestonePeriod: '3_months_before',
        dueDate: '2026-09-25',
        isCompleted: true,
        priority: 'high',
        category: 'Attire',
        assignedTo: 'Diya'
      },

      // 1 Month Before
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Sangeet Choreography & Dance Practice',
        description: 'Host weekend practice for bridal party and cousin performances.',
        milestonePeriod: '1_month_before',
        dueDate: '2026-11-10',
        isCompleted: true,
        priority: 'high',
        category: 'Entertainment',
        assignedTo: 'Choreographer'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Finalize Royal Rajasthani & Chaat Menu',
        description: 'Confirm live Dal Baati, Tandoor skewers, and live Jalebi counter with Chef Ratan.',
        milestonePeriod: '1_month_before',
        dueDate: '2026-11-15',
        isCompleted: false,
        priority: 'high',
        category: 'Catering',
        assignedTo: 'Pooja (Planner)'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Order Safas & Pagris for Baaraat',
        description: 'Order 150 matching peach-and-gold safas for groom side baaraatis.',
        milestonePeriod: '1_month_before',
        dueDate: '2026-11-20',
        isCompleted: false,
        priority: 'medium',
        category: 'Attire',
        assignedTo: 'Groom Family'
      },

      // 1 Week Before
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Lock In Final Guaranteed Headcount with Palace',
        description: 'Submit guaranteed 338 confirmed guests and 25 vendor meal passes.',
        milestonePeriod: '1_week_before',
        dueDate: '2026-12-05',
        isCompleted: false,
        priority: 'high',
        category: 'Catering',
        assignedTo: 'Pooja (Planner)'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Organize Pooja Samagri & Hawan Wood',
        description: 'Coordinate with Panditji for list of sacred Hawan ingredients, ghee, and coconut.',
        milestonePeriod: '1_week_before',
        dueDate: '2026-12-08',
        isCompleted: false,
        priority: 'high',
        category: 'Rituals',
        assignedTo: 'Panditji & Family'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Prepare Shagun Envelopes & Vendor Gratuities',
        description: 'Pack marked cash envelopes for Dhol players, palace staff, and panditji.',
        milestonePeriod: '1_week_before',
        dueDate: '2026-12-10',
        isCompleted: false,
        priority: 'high',
        category: 'Budget',
        assignedTo: 'Aarav'
      },

      // 1 Day Before
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Mehendi & Sangeet Evening Celebration',
        description: 'Henna artists apply bridal Sojat mehendi, followed by Sangeet performances in palace courtyard.',
        milestonePeriod: '1_day_before',
        dueDate: '2026-12-14',
        timeSlot: '04:00 PM',
        isCompleted: false,
        priority: 'high',
        category: 'Rehearsal',
        assignedTo: 'Full Family'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Sound Check for Lakeside Sound System & Dhol Path',
        description: 'Test wireless microphones for Pheras mantras and Baaraat route speakers.',
        milestonePeriod: '1_day_before',
        dueDate: '2026-12-14',
        timeSlot: '02:00 PM',
        isCompleted: false,
        priority: 'medium',
        category: 'Production',
        assignedTo: 'Luster Glow Audio'
      },

      // Event Day (Minute-by-Minute Runsheet)
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Haldi & Chuda Ceremony',
        description: 'Intimate turmeric paste ceremony with family songs and marigold showers.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '09:30 AM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Family & Glam Team'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Mandap Floral Construction by Lake Pichola',
        description: 'Genda Phool decorators erect 4-pillar floral Mandap with fresh marigold and tuberose garlands.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '11:00 AM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Decor Team'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Safa Tying for Baaraat & Groom Ready',
        description: 'Pagri artists tie custom safas for 150 guests; vintage open car arrives.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '03:30 PM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Safa Artists'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Baaraat Procession Begins with Punjabi Dhol',
        description: 'Lively Baaraat dance procession along palace lakeside drive.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '04:30 PM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Dhol Troupe & Groom'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Milni & Grand Varmala at Sunset Pavilion',
        description: 'Bride arrives under floral Phoolon Ki Chaadar, exchange of royal jasmine Varmalas with cold pyros.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '06:00 PM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Panditji & Couple'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Sacred Pheras & Kanyadaan Ceremony',
        description: 'Vedic wedding vows around holy Agni fire facing illuminated Lake Pichola.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '07:30 PM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Panditji & Couple'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Royal Dinner Feast & Live Classical Sitar',
        description: 'Multi-course royal buffet opens with 50+ dishes and live dessert counters.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '08:30 PM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Catering Lead'
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        title: 'Emotional Bidaai & Vintage Car Send-Off',
        description: 'Traditional flower petal blessing and newlywed departure in vintage heritage car.',
        milestonePeriod: 'event_day',
        dueDate: '2026-12-15',
        timeSlot: '11:15 PM',
        isCompleted: false,
        priority: 'high',
        category: 'Runsheet',
        assignedTo: 'Pooja (Planner)'
      }
    ];

    // Seed Indian AI Recommendations
    this.data.ai_recommendations = [
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'theme_decor',
        title: 'Floating Brass Urlis & Genda Phool Lighting',
        description: 'Float hundreds of scented marigold blossoms and hand-poured sandalwood candles in antique brass urlis around the lakefront walkways.',
        suggestedBudgetImpact: -35000,
        tags: ['Heritage', 'Eco-Friendly', 'Palatial'],
        isApplied: true
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'cost_saving',
        title: 'Seasonal Marigold & Jasmine Floral Architecture',
        description: 'Utilize local Pushkar marigolds and Madurai jasmine rather than imported Dutch carnations. Cuts floral procurement costs by ₹65,000 while elevating traditional authenticity.',
        suggestedBudgetImpact: 65000,
        tags: ['Budget Optimization', 'Authentic', 'Eco-Florals'],
        isApplied: false
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'menu_catering',
        title: 'Signature "Kesariya Rajwadi Spritz" & Masala Chai Bar',
        description: 'Serve saffron-infused sparkling pomegranate coolers in terracotta kulhads as guests arrive from the airport, plus an evening live Kulhad Masala Chai station.',
        suggestedBudgetImpact: -18000,
        tags: ['Culinary', 'Live Counter', 'Signature Drink'],
        isApplied: true
      },
      {
        _id: generateObjectId(),
        eventId: event1Id,
        category: 'entertainment_activities',
        title: 'Puppet & Kathputli Artisan Storytelling Corner',
        description: 'Engage traditional Rajasthani string puppeteers to perform humorous folklore skits during the afternoon high tea, captivating guests of all ages.',
        suggestedBudgetImpact: -22000,
        tags: ['Cultural Folk', 'Kids & Elders', 'Heritage'],
        isApplied: false
      }
    ];

    this.save();
    console.log('Gatherly Indian database initialized successfully in Rupees (INR)!');
  }
}

const db = new DBEngine();

module.exports = {
  db,
  generateObjectId
};
