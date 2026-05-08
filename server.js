import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// Test Route
app.get('/', (req, res) => {
  res.send('Secure Chat Backend Running');
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
