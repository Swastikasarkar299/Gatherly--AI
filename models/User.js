const mongoose = require('./mongooseHelper');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'planner'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: 'avatar-default.png'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

let User;
try {
  User = mongoose.model('User', userSchema);
} catch (e) {
  User = mongoose.models.User || { name: 'User', schema: userSchema };
}

module.exports = User;
module.exports.schema = userSchema;
