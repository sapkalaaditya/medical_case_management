const mongoose = require('mongoose');

const apiTokenSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically remove expired tokens
apiTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ApiToken = mongoose.model('ApiToken', apiTokenSchema);

module.exports = ApiToken;
