import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

// 1. LOAD ENVIRONMENT VARIABLES
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 2. CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// 3. DEFINE THE DATABASE SCHEMA (The structure of your leads)
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String }, // Optional, for contact page
  mobile: { type: String }, // Optional, for detail page
  city: { type: String },
  car: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create the model
const Contact = mongoose.model('Contact', contactSchema);

// 4. API ROUTES
app.get('/api/cars', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./data/cars.json', 'utf8'));
  res.json(data);
});

app.get('/api/cars/:modelCd', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./data/cars.json', 'utf8'));
  const car = data.find(c => c.modelCd === req.params.modelCd);
  if (car) res.json(car);
  else res.status(404).json({ message: "Car not found" });
});

// 5. POST ROUTE TO SAVE TO DATABASE
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, mobile, city, car, message } = req.body;
    
    if (!name || !message) {
      return res.status(400).json({ error: "Name and message are required" });
    }

    // Create a new record in the database
    const newLead = new Contact({
      name,
      email: email || "N/A",
      mobile: mobile || "N/A",
      city: city || "N/A",
      car: car || "N/A",
      message
    });

    // Save it permanently to MongoDB!
    await newLead.save();

    console.log("📩 NEW LEAD SAVED TO DATABASE:", newLead);
    res.status(201).json({ success: true, message: "We have received your message!" });

  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Failed to save inquiry to database" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});