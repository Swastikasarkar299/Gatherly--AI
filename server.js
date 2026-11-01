const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const env = require('./config/env');
const { connectDB } = require('./config/db');

// Attempt to use installed Express, or fall back to native Node HTTP engine
let isNativeExpress = false;
try {
  const express = require('express');
  const cors = require('cors');
  isNativeExpress = true;
} catch (e) {
  isNativeExpress = false;
}

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const aiRoutes = require('./routes/aiRoutes');

const authController = require('./controllers/authController');
const eventController = require('./controllers/eventController');
const budgetController = require('./controllers/budgetController');
const vendorController = require('./controllers/vendorController');
const timelineController = require('./controllers/timelineController');
const aiController = require('./controllers/aiController');
const { authenticate, optionalAuth } = require('./middleware/auth');

const PORT = env.PORT || 5000;
const PUBLIC_DIR = path.resolve(__dirname, 'public');

// Connect to MongoDB if available
connectDB();

if (isNativeExpress) {
  const express = require('express');
  const cors = require('cors');
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(PUBLIC_DIR));

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/budget', budgetRoutes);
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/timeline', timelineRoutes);
  app.use('/api/ai', aiRoutes);

  // Fallback to index.html for SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  GATHERLY - GenAI Event Planning Assistant Server`);
    console.log(`  Running with Express.js at: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });

  module.exports = { app, server };
} else {
  // Built-in Express-compatible pure Node.js Server
  console.log(`[Gatherly] Running in zero-dependency Node.js engine (Node ${process.version})`);

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  function parseBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        if (!body) return resolve({});
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({});
        }
      });
    });
  }

  function enhanceResponse(res) {
    res.json = function(data) {
      const payload = JSON.stringify(data);
      res.writeHead(this.statusCode || 200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(payload);
    };

    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
  }

  const server = http.createServer(async (req, res) => {
    enhanceResponse(res);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    req.query = parsedUrl.query;
    req.body = await parseBody(req);

    // Optional auth extraction
    optionalAuth(req, res, () => {});

    // REST API Routing
    try {
      // 1. Auth routes
      if (pathname === '/api/auth/register' && method === 'POST') {
        return authController.register(req, res);
      }
      if (pathname === '/api/auth/login' && method === 'POST') {
        return authController.login(req, res);
      }
      if (pathname === '/api/auth/me' && method === 'GET') {
        return authenticate(req, res, () => authController.getMe(req, res));
      }

      // 2. Events routes
      if (pathname === '/api/events' && method === 'GET') {
        return eventController.getEvents(req, res);
      }
      if (pathname === '/api/events' && method === 'POST') {
        return eventController.createEvent(req, res);
      }
      if (pathname.startsWith('/api/events/') && method === 'GET') {
        const id = pathname.split('/')[3];
        req.params = { id };
        return eventController.getEventById(req, res);
      }
      if (pathname.startsWith('/api/events/') && method === 'PUT') {
        const id = pathname.split('/')[3];
        req.params = { id };
        return eventController.updateEvent(req, res);
      }
      if (pathname.startsWith('/api/events/') && method === 'DELETE') {
        const id = pathname.split('/')[3];
        req.params = { id };
        return eventController.deleteEvent(req, res);
      }

      // 3. AI routes
      if (pathname === '/api/ai/generate-plan' && method === 'POST') {
        return aiController.generatePlan(req, res);
      }
      if (pathname === '/api/ai/ideas' && method === 'POST') {
        return aiController.generateIdeas(req, res);
      }
      if (pathname === '/api/ai/cost-saving' && method === 'POST') {
        return aiController.getCostSavingSuggestions(req, res);
      }
      if (pathname === '/api/ai/apply-idea' && method === 'POST') {
        return aiController.applyIdeaToPlan(req, res);
      }

      // 4. Budget routes
      if (pathname.startsWith('/api/budget/') && pathname.includes('/expenses') && method === 'POST') {
        const parts = pathname.split('/');
        const eventId = parts[3];
        req.params = { eventId };
        return budgetController.addExpense(req, res);
      }
      if (pathname.startsWith('/api/budget/expenses/') && method === 'PUT') {
        const expenseId = pathname.split('/')[4];
        req.params = { expenseId };
        return budgetController.updateExpense(req, res);
      }
      if (pathname.startsWith('/api/budget/expenses/') && method === 'DELETE') {
        const expenseId = pathname.split('/')[4];
        req.params = { expenseId };
        return budgetController.deleteExpense(req, res);
      }
      if (pathname.startsWith('/api/budget/') && method === 'GET') {
        const eventId = pathname.split('/')[3];
        req.params = { eventId };
        return budgetController.getBudgetByEventId(req, res);
      }
      if (pathname.startsWith('/api/budget/') && method === 'PUT') {
        const eventId = pathname.split('/')[3];
        req.params = { eventId };
        return budgetController.updateBudgetSettings(req, res);
      }

      // 5. Vendor routes
      if (pathname === '/api/vendors' && method === 'GET') {
        return vendorController.getVendors(req, res);
      }
      if (pathname.startsWith('/api/vendors/') && method === 'GET') {
        const eventId = pathname.split('/')[3];
        req.params = { eventId };
        return vendorController.getVendors(req, res);
      }
      if (pathname === '/api/vendors' && method === 'POST') {
        return vendorController.createVendor(req, res);
      }
      if (pathname.startsWith('/api/vendors/') && method === 'PUT') {
        const id = pathname.split('/')[3];
        req.params = { id };
        return vendorController.updateVendor(req, res);
      }
      if (pathname.startsWith('/api/vendors/') && method === 'DELETE') {
        const id = pathname.split('/')[3];
        req.params = { id };
        return vendorController.deleteVendor(req, res);
      }

      // 6. Timeline routes
      if (pathname.startsWith('/api/timeline/') && pathname.includes('/tasks') && method === 'POST') {
        const eventId = pathname.split('/')[3];
        req.params = { eventId };
        return timelineController.addTask(req, res);
      }
      if (pathname.startsWith('/api/timeline/tasks/') && method === 'PUT') {
        const taskId = pathname.split('/')[4];
        req.params = { taskId };
        return timelineController.updateTask(req, res);
      }
      if (pathname.startsWith('/api/timeline/tasks/') && method === 'DELETE') {
        const taskId = pathname.split('/')[4];
        req.params = { taskId };
        return timelineController.deleteTask(req, res);
      }
      if (pathname.startsWith('/api/timeline/') && method === 'GET') {
        const eventId = pathname.split('/')[3];
        req.params = { eventId };
        return timelineController.getTimelineByEventId(req, res);
      }

      // Static file serving from public/
      let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

      // Prevent directory traversal
      if (!filePath.startsWith(PUBLIC_DIR)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const fileContent = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(fileContent);
      }

      // SPA fallback
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(indexContent);
      }

      res.status(404).json({ success: false, message: 'Not found' });
    } catch (err) {
      console.error('API Server error:', err);
      res.status(500).json({ success: false, message: 'Server processing error', error: err.message });
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  GATHERLY - GenAI Event Planning Assistant Server`);
    console.log(`  Live at: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });

  module.exports = { server };
}

