const mongoose = require('./mongooseHelper');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide an event name'],
    trim: true,
    maxlength: [150, 'Event name cannot exceed 150 characters']
  },
  type: {
    type: String,
    required: [true, 'Please select event type'],
    enum: ['wedding', 'birthday', 'community', 'other'],
    default: 'wedding'
  },
  date: {
    type: Date,
    required: [true, 'Please specify the event date']
  },
  location: {
    type: String,
    required: [true, 'Please provide a location or venue'],
    trim: true
  },
  guestCount: {
    type: Number,
    required: [true, 'Please specify expected guest count'],
    min: [1, 'Guest count must be at least 1']
  },
  estimatedBudget: {
    type: Number,
    required: [true, 'Please provide an estimated budget'],
    min: [0, 'Budget cannot be negative']
  },
  theme: {
    type: String,
    trim: true,
    default: 'Classic Elegance'
  },
  preferences: {
    colorPalette: { type: [String], default: ['#6C5CE7', '#FDCB6E', '#FFFFFF'] },
    dietaryOptions: { type: [String], default: ['Vegetarian', 'Gluten-Free'] },
    entertainmentStyle: { type: String, default: 'Live Music & DJ' },
    atmosphere: { type: String, default: 'Festive & Elegant' },
    notes: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'completed', 'cancelled'],
    default: 'planning'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

let Event;
try {
  Event = mongoose.model('Event', eventSchema);
} catch (e) {
  Event = mongoose.models.Event || { name: 'Event', schema: eventSchema };
}

module.exports = Event;
module.exports.schema = eventSchema;
