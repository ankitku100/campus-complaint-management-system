const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const isComplaintRoute = req.originalUrl.includes('/complaints');
    if (isComplaintRoute) {
      const isCreateComplaint = req.method === 'POST' && (req.originalUrl === '/api/complaints' || req.originalUrl === '/api/complaints/');
      if (isCreateComplaint) {
        const { title, description, category, location } = req.body;
        if (!title || !title.trim() || !description || !description.trim() || !category || !category.trim() || !location || !location.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Please fill all required fields'
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

const errorHandler = (error, req, res, next) => {
  console.error(error);
  const isComplaintRoute = req.originalUrl.includes('/complaints');

  if (error.code === 11000) {
    const isUserError = error.message?.includes('users') || error.errmsg?.includes('users') || req.originalUrl.includes('/auth');
    if (isUserError) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to create complaint'
      });
    }
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid resource ID.' });
  }

  res.status(error.status || 500).json({
    success: false,
    message: isComplaintRoute ? 'Failed to create complaint' : (error.message || 'An unexpected server error occurred.')
  });
};

module.exports = { validateRequest, notFound, errorHandler };
