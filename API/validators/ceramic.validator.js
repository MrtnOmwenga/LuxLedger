export function validateUploadDocument(req, res, next) {
  const { data } = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  next();
}

export function validateUpdateDocument(req, res, next) {
  const { data } = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  
  next();
}
