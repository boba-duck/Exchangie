import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const app: Express = express();
const port = process.env.GATEWAY_PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Inbound email endpoint
app.post('/api/inbound', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Process through security checks
    const scanResult = await scanEmail(email);

    res.json({
      status: scanResult.isClean ? 'pass' : 'block',
      threats: scanResult.threats,
      score: scanResult.score,
    });
  } catch (err) {
    logger.error('Error processing inbound email', err);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Email classification endpoint
app.post('/api/classify', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const classification = await classifyEmail(email);
    res.json(classification);
  } catch (err) {
    logger.error('Error classifying email', err);
    res.status(500).json({ error: 'Classification failed' });
  }
});

async function scanEmail(email: any) {
  const threats: string[] = [];
  let score = 0;

  // Check for malware signatures
  if (email.attachments) {
    for (const attachment of email.attachments) {
      if (isSuspiciousFile(attachment.filename)) {
        threats.push('Suspicious file extension');
        score += 5;
      }
    }
  }

  // Check for phishing indicators
  if (email.subject?.toLowerCase().includes('urgent')) {
    score += 1;
  }

  // Check URLs
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = email.body?.match(urlPattern) || [];
  if (urls.length > 5) {
    threats.push('Excessive number of links');
    score += 2;
  }

  return {
    isClean: score < 5,
    threats,
    score,
  };
}

async function classifyEmail(email: any) {
  // Simple email classification
  return {
    isSpam: false,
    confidence: 0.95,
    category: 'legitimate',
  };
}

function isSuspiciousFile(filename: string): boolean {
  const suspiciousExtensions = ['.exe', '.bat', '.scr', '.vbs', '.js'];
  return suspiciousExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

export default app;
