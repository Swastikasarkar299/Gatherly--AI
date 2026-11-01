const mongoose = require('./mongooseHelper');

const vendorChecklistItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
}, { _id: false });

const vendorSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide vendor name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a vendor category'],
    enum: [
      'Venue',
      'Catering',
      'Photography',
      'Decoration',
      'Entertainment',
      'Transportation',
      'Invitations',
      'Lighting & Sound',
      'Other'
    ]
  },
  contactPerson: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['researching', 'contacted', 'quoted', 'booked', 'completed', 'declined'],
    default: 'researching'
  },
  quotedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  agreedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  depositPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'deposit_paid', 'fully_paid'],
    default: 'pending'
  },
  contractNotes: {
    type: String,
    default: ''
  },
  checklistItems: [vendorChecklistItemSchema]
}, { timestamps: true });

vendorSchema.virtual('remainingBalance').get(function() {
  return Math.max(0, (this.agreedAmount || 0) - (this.depositPaid || 0));
});

let Vendor;
try {
  Vendor = mongoose.model('Vendor', vendorSchema);
} catch (e) {
  Vendor = mongoose.models.Vendor || { name: 'Vendor', schema: vendorSchema };
}

module.exports = Vendor;
module.exports.schema = vendorSchema;
