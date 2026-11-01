const mongoose = require('./mongooseHelper');

const taskSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide task title'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  milestonePeriod: {
    type: String,
    required: true,
    enum: [
      '3_months_before',
      '1_month_before',
      '1_week_before',
      '1_day_before',
      'event_day',
      'post_event'
    ],
    default: '1_month_before'
  },
  dueDate: {
    type: Date
  },
  timeSlot: {
    type: String,
    default: ''
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'General'
  },
  assignedTo: {
    type: String,
    default: 'Organizer'
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

let Task;
try {
  Task = mongoose.model('Task', taskSchema);
} catch (e) {
  Task = mongoose.models.Task || { name: 'Task', schema: taskSchema };
}

module.exports = Task;
module.exports.schema = taskSchema;
