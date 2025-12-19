const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    default: 'Anonymous'
  },
  interests: [{
    type: String
  }],
  language: {
    type: String,
    default: 'English'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isSearching: {
    type: Boolean,
    default: false
  },
  currentPartner: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);