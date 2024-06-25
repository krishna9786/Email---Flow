// backend/server.js
require('dotenv').config(); // Add this line at the top

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Agenda = require('agenda');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection setup using environment variable
mongoose.connect(process.env.MONGODB_URI);

// Agenda setup for scheduling tasks
const agenda = new Agenda({ db: { address: process.env.AGENDA_DB } });

agenda.define('send-email', async (job) => {
  const { to, subject, text } = job.attrs.data;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
});

agenda.start();

// API endpoint to schedule an email
app.post('/api/schedule-email', async (req, res) => {
  const { email, subject, body, scheduleTime } = req.body;

  try {
    await agenda.schedule(scheduleTime, 'send-email', {
      to: email,
      subject: subject,
      text: body,
    });
    res.status(200).send({ message: 'Email scheduled successfully!' });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).send({ message: 'Failed to schedule email', error });
  }
});

// Start the Express server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
