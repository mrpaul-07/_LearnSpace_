const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateCertificate, verifyCertificate, getMyCertificates } = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/generate/:courseId', protect, generateCertificate);
router.get('/my', protect, getMyCertificates);

// Verify by Certificate Number (public — no login needed)
router.get('/verify/:certNumber', verifyCertificate);

// Serve PDF inline in browser (public — filename is unguessable)
router.get('/view/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.resolve(__dirname, '../../uploads/certificates', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }
    const stat = fs.statSync(filePath);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Length':      stat.size,
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to serve certificate.' });
  }
});

module.exports = router;