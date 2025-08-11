const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// PostgreSQL connection
const pool = new Pool({
  user: 'wang',
  host: 'localhost',
  database: 'school_inventory',
  password: 'your_password_here',
  port: 5432,
});

// Image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Upload camera with image and QR
app.post('/add-camera', upload.single('image'), async (req, res) => {
  try {
    const { camera_name, location } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;

    // Generate QR Code
    const qrPath = `uploads/qr_${Date.now()}.png`;
    await QRCode.toFile(qrPath, `Camera: ${camera_name} | Location: ${location}`);

    // Insert into DB
    await pool.query(
      'INSERT INTO cameras (camera_name, location, image_url, qr_code_url) VALUES ($1, $2, $3, $4)',
      [camera_name, location, imagePath, `/${qrPath}`]
    );

    res.json({ message: 'Camera added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding camera.');
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
