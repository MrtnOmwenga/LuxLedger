import { Router } from 'express';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { ceramic } from '../services/ceramic.service.js'; 
import { validateUploadDocument, validateUpdateDocument } from '../validators/ceramic.validator.js';
import 'express-async-errors';

const CeramicController = Router();

// POST /ceramic/upload
CeramicController.post('/upload', validateUploadDocument, async (request, response) => {
  try {
    const { data } = request.body;

    const document = await TileDocument.create(ceramic, { data });

    response.status(201).json({ cid: document.id.toString() });
  } catch (error) {
    console.error('Failed to upload Ceramic document:', error);
    response.status(500).json({ error: 'Failed to upload Ceramic document' });
  }
});

// GET /ceramic/:cid
CeramicController.get('/:cid', validateUpdateDocument, async (request, response) => {
  try {
    const { cid } = request.params;

    const document = await TileDocument.load(ceramic, cid);

    response.json({ data: document.content });
  } catch (error) {
    console.error('Failed to retrieve Ceramic document:', error);
    response.status(404).json({ error: 'Ceramic document not found' });
  }
});

// PUT /ceramic/:cid
CeramicController.put('/:cid', async (request, response) => {
  try {
    const { cid } = request.params;
    const { data } = request.body;

    const document = await TileDocument.load(ceramic, cid);

    await document.update({ data });

    response.json({ message: 'Ceramic document updated successfully' });
  } catch (error) {
    console.error('Failed to update Ceramic document:', error);
    response.status(500).json({ error: 'Failed to update Ceramic document' });
  }
});

// DELETE /ceramic/:cid
CeramicController.delete('/:cid', async (request, response) => {
  try {
    const { cid } = request.params;

    const document = await TileDocument.load(ceramic, cid);

    await document.revoke();

    response.json({ message: 'Ceramic document deleted successfully' });
  } catch (error) {
    console.error('Failed to delete Ceramic document:', error);
    response.status(500).json({ error: 'Failed to delete Ceramic document' });
  }
});

export default CeramicController;
