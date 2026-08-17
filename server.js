import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- Add this

// Bulletproof file path mapping for ES Modules on Linux servers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// DEFINE TEST DRIVE SCHEMA
const testDriveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  city: { type: String, required: true },
  car: { type: String, required: true },
  preferredDate: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TestDrive = mongoose.model('TestDrive', testDriveSchema);

// 4. API ROUTES
app.get('/api/cars', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error("❌ Error reading data.json:", error.message);
    res.status(500).json({ error: "Failed to load car data from server." });
  }
});

app.get('/api/cars/:modelCd', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const car = data.find(c => c.modelCd === req.params.modelCd);
    
    if (car) {
      res.json(car);
    } else {
      res.status(404).json({ message: "Car not found" });
    }
  } catch (error) {
    console.error("❌ Error reading specific car:", error.message);
    res.status(500).json({ error: "Failed to load car details from server." });
  }
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

// 6. GET ROUTE TO VIEW ALL LEADS (Admin use)
app.get('/api/leads', async (req, res) => {
  try {
    // .find() fetches everything in the database, .sort() puts the newest ones at the top!
    const leads = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
})

// POST ROUTE FOR BOOKING A TEST DRIVE
app.post('/api/test-drive', async (req, res) => {
  try {
    const { name, mobile, city, car, preferredDate } = req.body;
    
    if (!name || !mobile || !car || !preferredDate) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const newBooking = new TestDrive({
      name,
      mobile,
      city,
      car,
      preferredDate
    });

    await newBooking.save();
    console.log("🚗 NEW TEST DRIVE BOOKED:", newBooking);
    
    res.status(201).json({ success: true, message: "Test Drive Confirmed!" });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Failed to save test drive booking." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});