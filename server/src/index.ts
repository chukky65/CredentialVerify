import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, generateToken } from './auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// DEMO_MODE toggle
const isDemoMode = process.env.DEMO_MODE === 'true';

// Temporary instance of Prisma
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: isDemoMode ? 'demo' : 'production' });
});

// Authentication Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // In a real application, verify against DB using bcrypt.
  // For now, accept mock login or demo admin.
  if (isDemoMode || (email && password)) {
    const token = generateToken({ email, role: 'VERIFICATION_ANALYST' });
    return res.json({ token, user: { email, role: 'VERIFICATION_ANALYST' } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Protected Document Upload Endpoint
app.post('/api/documents/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // In production, you would create a SubmittedDocument record in DB here.
  res.json({ 
    message: 'File uploaded successfully', 
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Candidate Endpoints
app.get('/api/candidates', authenticateToken, async (req, res) => {
  if (isDemoMode) {
    return res.json({ source: 'demo', data: [] });
  }
  
  try {
    const candidates = await prisma.candidate.findMany();
    res.json({ source: 'postgres', data: candidates });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Cases Endpoints
app.get('/api/cases', authenticateToken, async (req, res) => {
  if (isDemoMode) {
    return res.json({ source: 'demo', data: [] });
  }
  
  try {
    const cases = await prisma.verificationCase.findMany();
    res.json({ source: 'postgres', data: cases });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    if (isDemoMode) {
      console.log(`[server]: DEMO_MODE is ACTIVE. Using mock dataset.`);
    } else {
      console.log(`[server]: PRODUCTION MODE. Using PostgreSQL via Prisma.`);
    }
  });
}

export default app;
