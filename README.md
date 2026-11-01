# 🌟 Gatherly – GenAI-Powered Event Planning Assistant

> A modern, responsive, full-stack event planning web application powered by Generative AI, designed to help hosts and professional coordinators organize **Weddings**, **Birthday Parties**, and **Community Events** with intelligent budget optimization, automated milestone countdowns, vendor checklists, and personalized AI ideas.

---

## 🎨 Design Philosophy & Theme
Gatherly is built with a signature **Royal Purple, Crisp White, and Warm Golden** aesthetic:
- **Primary Purple (`#6C5CE7` & `#4834D4`)**: Conveys sophistication, creativity, and executive control.
- **Warm Gold (`#FDCB6E` & `#E2B93B`)**: Accentuates milestones, budget targets, luxury finishes, and AI inspiration.
- **Crisp Surfaces (`#FFFFFF` & `#F8F9FE`)**: High-contrast typography and sleek cards for intuitive planning.

---

## 🚀 Key Features

### 1. 🛡️ User Authentication & Multi-Event Management
- **Secure Authentication**: Salted PBKDF2 password hashing and standard JWT authorization.
- **User Dashboard**: Personalized dashboard with user profile switcher, planner vs. host roles, and instant 1-click demo login.
- **Multi-Event Portfolio**: Create and manage multiple concurrent events across Weddings, Birthdays, and Community Galas.

### 2. 📅 Event Creation Wizard
- Supports **Weddings**, **Birthday Parties**, **Community Events**, and custom celebrations.
- Collects name, date, location, guest count, estimated budget, theme, and user preferences.
- **Automated Initialization**: Creating an event automatically instantiates:
  1. Standard budget category distribution tailored to event type.
  2. Auto-calculated 5-stage milestone timeline (3 months out down to event day).
  3. Pre-populated vendor checklist across all 8 major event trades.

### 3. 🧠 GenAI Planning Assistant Studio
- **Dual-Mode AI Engine**:
  - **Live Gemini API Support**: Connect your `GEMINI_API_KEY` (or OpenAI) to synthesize real-time generative plans via Google Generative Language API.
  - **Built-in High-Fidelity Synthesizer**: Runs 100% offline out-of-the-box with tailored algorithmic recommendations.
- **Master Plan Blueprint**:
  - Executive vision summary.
  - 3 Curated Themes with color palettes (hex color swatches) and ambient moods.
  - 4 Decor & Atmosphere concepts (focal arches, lighting schemes, photobooths).
  - 4-Course Menu & Mixology (Appetizers, Mains, Desserts, and Signature Themed Drinks).
  - Entertainment & crowd-pleasing interactive activities.
  - Minute-by-minute runsheet highlights.
  - High-impact cost-saving tips.
- **Personalized Ideas Generator**: Filter and brainstorm ideas based on event category, budget, guest count, theme, location, and stylistic preferences.
- **One-Click "Add to Plan"**: Instantly transforms any AI suggestion into an itemized budget expense and a timeline checklist task!

### 4. 💰 Smart Budget Management
- **Budget Tracking**: Overall budget ceiling, allocated budget, committed & paid expenses, and remaining buffer.
- **Interactive Chart.js Visuals**:
  - **Doughnut Chart**: Spending breakdown by category.
  - **Bar Chart**: Allocated vs. Actual/Estimated spending comparison.
- **Dynamic Overbudget Warning**: Real-time visual banners when expenditures exceed target limits, paired with an **AI Cost-Cutting Rebalancer** that suggests actionable budget compromises.
- **Expense Ledger**: Line-item tracking with category, title, estimated cost, actual cost, payment status (Paid, Partial, Unpaid), due date, and notes.

### 5. ⏳ Event Timeline & Runsheet
- Auto-generated chronologically based on the event date:
  - **3 Months Before**: Strategic bookings, venue deposits, invitations.
  - **1 Month Before**: RSVP tally, dress fittings, floor layout.
  - **1 Week Before**: Final headcounts, runsheet distribution, vendor contact lists.
  - **1 Day Before**: Ceremony/venue rehearsal, decor delivery, sound check.
  - **Event Day**: Granular minute-by-minute runsheet with time slots, cues, and leads.
- **Calendar Export**: Download `.ics` calendar files with one click to import milestones directly into Google Calendar, Apple Calendar, or Outlook.

### 6. 🤝 Vendor Directory & Checklist
- Pre-configured checklist covering all 8 core vendor categories:
  1. **Venue**
  2. **Catering**
  3. **Photography**
  4. **Decoration**
  5. **Entertainment**
  6. **Transportation**
  7. **Invitations**
  8. **Lighting & Sound**
- Detailed tracking: Vendor name, contact person, phone, email, status (`Researching`, `Contacted`, `Quoted`, `Booked`, `Completed`), quoted amount, agreed price, deposit paid, and remaining balance.
- Built-in category-specific checklists (e.g., verifying noise curfews, food tastings, RAW photo delivery, power amperage).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Custom Purple & Gold design system), JavaScript (ES6+), Bootstrap 5.3.3, Bootstrap Icons, Chart.js |
| **Backend** | Node.js, Express.js REST API architecture, HTTP/HTTPS services |
| **Database** | MongoDB with Mongoose Schemas (with built-in document store fallback) |
| **Authentication** | JSON Web Tokens (JWT), Salted PBKDF2/Bcrypt password hashing |
| **AI Integration** | Google Gemini API (`gemini-2.5-flash`), OpenAI API, Built-in Local GenAI Engine |
| **Utilities** | iCalendar (`.ics`) generator, CSV export, responsive mobile drawer |

---

## 📂 Project Structure

```
c:\Users\HP\OneDrive\Desktop\Prompt War\
├── .env                  # Active environment variables (PORT, DB, JWT, Gemini key)
├── .env.example          # Environment template
├── package.json          # Dependencies and npm scripts
├── server.js             # Express & Node.js application server
├── start.bat             # One-click Windows application launcher
├── start.ps1             # PowerShell application launcher
├── README.md             # Complete documentation
│
├── bin\
│   └── node.cmd          # Bundled Node.js v24 executable wrapper
│
├── config\
│   ├── env.js            # Environment loader
│   └── db.js             # MongoDB & Mongoose connection manager
│
├── models\               # Mongoose Schemas & Collections
│   ├── mongooseHelper.js # Dual-mode Mongoose compatibility layer
│   ├── User.js           # Users collection
│   ├── Event.js          # Events collection
│   ├── Budget.js         # Budgets collection
│   ├── Expense.js        # Expenses collection
│   ├── Vendor.js         # Vendors collection
│   ├── Task.js           # Tasks (Timeline) collection
│   └── AIRecommendation.js # AI Recommendations collection
│
├── middleware\
│   └── auth.js           # JWT authentication middleware
│
├── controllers\
│   ├── authController.js     # User registration, login, and profile
│   ├── eventController.js    # Multi-event CRUD and auto-initializers
│   ├── budgetController.js   # Budget categories, expenses, and alerts
│   ├── vendorController.js   # Vendor directory and checklist manager
│   ├── timelineController.js # Timeline milestones and runsheets
│   └── aiController.js       # AI plan generation and idea brainstormer
│
├── routes\
│   ├── expressHelper.js      # Express Router helper
│   ├── authRoutes.js         # /api/auth routes
│   ├── eventRoutes.js        # /api/events routes
│   ├── budgetRoutes.js       # /api/budget routes
│   ├── vendorRoutes.js       # /api/vendors routes
│   ├── timelineRoutes.js     # /api/timeline routes
│   └── aiRoutes.js           # /api/ai routes
│
├── services\
│   ├── security.js           # JWT tokens and salted password hashing
│   ├── dbEngine.js           # Document store with MongoDB ObjectId generator
│   └── aiService.js          # Gemini API caller and local generative engine
│
├── scripts\
│   └── seed.js               # Database seeder script
│
├── data\
│   └── gatherly_db.json      # Persistent local database store
│
└── public\                   # Frontend Single-Page Application
    ├── index.html            # Main UI dashboard and modals
    ├── css\
    │   └── style.css         # Custom purple, gold, and white styles
    └── js\
        ├── api.js            # REST API client
        ├── auth.js           # Auth manager
        ├── dashboard.js      # Dashboard controller
        ├── budget.js         # Budget and Chart.js controller
        ├── timeline.js       # Timeline and .ics export controller
        ├── vendors.js        # Vendor directory controller
        ├── aiPlanner.js      # GenAI Studio controller
        └── app.js            # Main application router
```

---

## ⚡ How to Run Gatherly

### 🎯 Instant Launch (Recommended - Zero Setup Needed)
Run either of these commands in your PowerShell terminal:

```powershell
.\start.bat
```
or
```powershell
.\npm start
```
*(You can also simply double-click **`start.bat`** in File Explorer)*

This immediately starts the Gatherly server and opens `http://localhost:5000` in your default browser!

---

### 💡 To enable direct `npm start` in your PowerShell terminal:
If you want PowerShell to recognize `npm` without the `.\` prefix:
1. Paste this one-liner into your current PowerShell window:
   ```powershell
   $env:PATH = "$PWD;$PWD\bin;$env:PATH"
   ```
2. Then simply run:
   ```powershell
   npm start
   ```

---

### Option B: Standard Global Node.js & MongoDB Atlas
If running on a workstation with global Node.js & npm installed:
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/gatherly
   JWT_SECRET=your_secret_key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Access the web dashboard at: `http://localhost:5000`

---

## 🔑 Demo Credentials
Gatherly comes pre-seeded with a comprehensive demo account and 3 realistic events:
- **Email**: `demo@gatherly.ai`
- **Password**: `password123`
*(Or simply click the **".One-Click Demo Login"** button on the Sign-In modal)*

### Pre-loaded Showcase Events:
1. **💍 Aria & Ethan's Royal Vineyard Wedding**
   - 150 Guests • \$38,000 Budget • Napa Valley, CA
   - Complete 9-category budget, active expenses, booked vendors, and full 5-milestone timeline.
2. **🎂 Leo's 30th Retro Neon Arcade Bash**
   - 45 Guests • \$4,500 Budget • Austin, TX
   - Cyberpunk theme, street food catering, retro arcade tournament.
3. **🎪 Oakridge Eco-Harvest & Community Fair**
   - 500 Attendees • \$14,000 Budget • Seattle, WA
   - Farm-to-table trucks, artisan market, stage performances, zero-waste logistics.

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate and receive a JWT Bearer token.
- `GET /api/auth/me`: Retrieve current authenticated user profile.

### Events
- `GET /api/events`: List all user events (sorted by date).
- `POST /api/events`: Create a new event and auto-generate budget, tasks, and vendors.
- `GET /api/events/:id`: Retrieve single event with full metrics, expenses, and timeline.
- `PUT /api/events/:id`: Update event parameters.
- `DELETE /api/events/:id`: Delete event and cascade deletion of related records.

### Smart Budget
- `GET /api/budget/:eventId`: Get category breakdown, expenses, and overbudget status.
- `PUT /api/budget/:eventId`: Update budget ceiling or category allocations.
- `POST /api/budget/:eventId/expenses`: Add an expense line item.
- `PUT /api/budget/expenses/:expenseId`: Update an expense item.
- `DELETE /api/budget/expenses/:expenseId`: Delete an expense item.

### Event Timeline
- `GET /api/timeline/:eventId`: Get tasks bucketed into the 5 milestones with countdown stats.
- `POST /api/timeline/:eventId/tasks`: Add a new milestone task.
- `PUT /api/timeline/tasks/:taskId`: Update task status (e.g., mark completed).
- `DELETE /api/timeline/tasks/:taskId`: Remove a task.

### Vendor Management
- `GET /api/vendors?eventId=...`: Get vendor directory with payment metrics.
- `POST /api/vendors`: Add a vendor with category-specific checklist.
- `PUT /api/vendors/:id`: Update vendor status (`researching`, `contacted`, `quoted`, `booked`, `completed`) or payments.
- `DELETE /api/vendors/:id`: Remove vendor.

### Generative AI
- `POST /api/ai/generate-plan`: Generate full event blueprint (themes, decor, menu, entertainment, runsheet, savings).
- `POST /api/ai/ideas`: Brainstorm personalized ideas by category, budget, and guest count.
- `POST /api/ai/cost-saving`: Analyze current budget for overages and generate compromise tips.
- `POST /api/ai/apply-idea`: Convert an AI idea directly into a budget expense and timeline task.

---

## 🔒 Security & Best Practices
- **No Hardcoded Secrets**: Secrets are isolated in `.env`.
- **Validation**: Strict boundary checks on dates, numeric budgets, email formats, and guest counts.
- **Relational Integrity**: MongoDB ObjectId cross-references with cascading deletions.
- **Sanitized Outputs**: Strict JSON structure prevents prototype pollution.

