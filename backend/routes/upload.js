const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data'); // <-- Import from form-data
const Submission = require('../models/Submission');

const router = express.Router();

router.post('/process/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the submission by ID
    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Read the file from the uploads directory
    const filePath = path.join(__dirname, '../uploads', submission.fileName);
    const fileBuffer = fs.readFileSync(filePath);

    // Create FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, submission.fileName);
    formData.append('criteria', JSON.stringify(submission.criteria));

    // Send data to Flask
    const response = await axios.post('http://localhost:5001/process', formData, {
      headers: formData.getHeaders(),
    });

    const { score, summary, pros, cons } = response.data;

    // ✅ Use mongoose.set() to update nested objects correctly(Currently random)
    submission.criteria.forEach((c, index) => {
      submission.set(`criteria.${index}.score`, Math.floor(Math.random() * 10) + 1); // Mock score
    });

    console.log('Updated Criteria:', submission.criteria); // ✅ Debug log

    // ✅ Save the updated submission
    submission.score = score;
    submission.summary = summary;
    submission.pros = pros;
    submission.cons = cons;

    await submission.save();

    return res.status(200).json({ message: 'Processing complete', data: submission });
  } catch (err) {
    console.error('Error processing submission:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// Get all submissions
router.get('/', async (req, res) => {
  try {
    const submissions = await Submission.find();
    res.status(200).json(submissions); // Send the data as JSON
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  const { criteria } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File not provided' });
    }

    const newSubmission = new Submission({
      fileName: req.file.filename,
      criteria: JSON.parse(criteria), // Convert JSON string to object
      score: null,
      summary: null,
      pros: null,
      cons: null,
    });

    await newSubmission.save();

    return res.status(201).json({ message: 'File uploaded', data: newSubmission });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;
