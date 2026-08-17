import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to get cars
const getCars = () => {
  try {
    const rawData = fs.readFileSync(path.join(__dirname, 'data.json'));
    return JSON.parse(rawData); 
  } catch (err) {
    return [];
  }
};

// 1. GET ALL CARS
app.get('/api/cars', (req, res) => {
  res.json(getCars());
});

// 2. GET SINGLE CAR
app.get('/api/cars/:modelCd', (req, res) => {
  const cars = getCars();
  const car = cars.find(c => c.modelCd.toLowerCase() === req.params.modelCd.toLowerCase());
  if (!car) return res.status(404).json({ message: "Car not found" });
  res.json(car);
});

// 3. POST CONTACT US INQUIRY (NEW API!)
const inquiries = []; // Temporary memory storage
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const newInquiry = { id: Date.now(), name, email, message, date: new Date() };
  inquiries.push(newInquiry);
  
  console.log("📩 New Message Received:", newInquiry);
  res.status(201).json({ success: true, message: "We have received your message!" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});