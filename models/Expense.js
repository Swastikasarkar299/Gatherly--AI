const mongoose = require('./mongooseHelper');

const expenseSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
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
  title: {
    type: String,
    required: [true, 'Please provide an expense title'],
    trim: true
  },
  estimatedAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  actualAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  dueDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

let Expense;
try {
  Expense = mongoose.model('Expense', expenseSchema);
} catch (e) {
  Expense = mongoose.models.Expense || { name: 'Expense', schema: expenseSchema };
}

module.exports = Expense;
module.exports.schema = expenseSchema;
