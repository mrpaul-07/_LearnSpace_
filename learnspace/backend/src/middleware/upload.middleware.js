// ============================================================
// LearnSpace - Upload Middleware
// ============================================================
// This file simply re-exports the multer instance from
// upload.service so routes can do:  upload.single('content')
// ============================================================
const upload = require('../services/upload.service');
module.exports = upload;
