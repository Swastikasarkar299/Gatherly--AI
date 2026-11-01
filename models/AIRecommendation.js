const mongoose = require('./mongooseHelper');

const aiRecommendationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'overall_plan',
      'theme_decor',
      'menu_catering',
      'entertainment_activities',
      'schedule_runsheet',
      'cost_saving',
      'personalized_ideas'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  suggestedBudgetImpact: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isApplied: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

let AIRecommendation;
try {
  AIRecommendation = mongoose.model('AIRecommendation', aiRecommendationSchema);
} catch (e) {
  AIRecommendation = mongoose.models.AIRecommendation || { name: 'AIRecommendation', schema: aiRecommendationSchema };
}

module.exports = AIRecommendation;
module.exports.schema = aiRecommendationSchema;
