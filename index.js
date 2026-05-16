require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Helper: generate unique short code (6 chars alphanumeric)
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

// 1. POST /shorten – create short URL
app.post('/shorten', async (req, res) => {
  try {
    let { longUrl, customCode } = req.body;
    if (!longUrl) return res.status(400).json({ error: 'longUrl is required' });

    // Validate URL format (simple)
    if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
      longUrl = 'https://' + longUrl;
    }

    let shortCode = customCode;
    if (!shortCode) {
      // generate unique code
      let exists = true;
      while (exists) {
        shortCode = generateShortCode();
        const existing = await prisma.shortUrl.findUnique({ where: { shortCode } });
        if (!existing) exists = false;
      }
    } else {
      // check if custom code already taken
      const existing = await prisma.shortUrl.findUnique({ where: { shortCode } });
      if (existing) {
        return res.status(409).json({ error: 'Custom code already taken' });
      }
    }

    const newUrl = await prisma.shortUrl.create({
      data: { shortCode, longUrl },
    });

    res.json({
      shortCode: newUrl.shortCode,
      shortUrl: `http://localhost:5000/${newUrl.shortCode}`, // replace domain in production
      longUrl: newUrl.longUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. GET /:shortCode – redirect
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const record = await prisma.shortUrl.findUnique({ where: { shortCode } });
    if (!record) {
      return res.status(404).send('Short URL not found');
    }

    // increment click count (don't await – fire and forget)
    prisma.shortUrl.update({
      where: { shortCode },
      data: { clicks: { increment: 1 } },
    }).catch(console.error);

    res.redirect(302, record.longUrl);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// 3. GET /stats/:shortCode – get stats
app.get('/stats/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const record = await prisma.shortUrl.findUnique({ where: { shortCode } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json({ shortCode: record.shortCode, longUrl: record.longUrl, clicks: record.clicks });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`URL Shortener running on port ${PORT}`));