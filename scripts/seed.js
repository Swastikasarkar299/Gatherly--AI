const { db } = require('../services/dbEngine');

console.log('--- Gatherly Database Seeder ---');
db.seedInitialData();
console.log('Seeding complete! 3 sample events, users, budgets, milestones, and vendors ready.');
process.exit(0);

