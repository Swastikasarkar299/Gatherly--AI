const mongoose = require('./mongooseHelper');

const budgetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: [
      'Venue',
      'Catering',
      'Photography',
      'Decoration',
      'Entertainment',
      'Transportation',
      'Invitations',
      'Lighting & Sound',
      'Contingency',
      'Other'
    ]
  },
  allocatedAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  percentage: {
    type: Number,
    default: 0
  }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  categories: [budgetCategorySchema],
  contingencyRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 50
  },
  currency: {
    type: String,
    default: 'USD'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

let Budget;
try {
  Budget = mongoose.model('Budget', budgetSchema);
} catch (e) {
  Budget = mongoose.models.Budget || { name: 'Budget', schema: budgetSchema };
}

module.exports = Budget;
module.exports.schema = budgetSchema;
