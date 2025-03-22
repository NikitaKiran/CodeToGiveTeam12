const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  fileName: String,
  criteria: [
    {
      name: String,
      weight: Number,
      score: Number,
    },
  ],
  score: Number,
  summary: String,
  pros: String,
  cons: String,
  createdAt: { type: Date, default: Date.now } // ✅ Add createdAt field
});



const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = Submission;
