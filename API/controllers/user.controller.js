import { Router } from 'express';
import { ceramic } from '../services/ceramic.service.js';
import { userProfileSchema } from '../schemas/user.schema.js';
import { validateCreateUserProfile } from '../validators/user.validator.js';
import { issueVerifiableCredential } from '../services/credentials.service.js';

const UserProfiles = Router();

// Endpoint to create a user profile
UserProfiles.post('/', validateCreateUserProfile, async (req, res) => {
  try {
    const { walletAddress, password } = req.body;

    const userProfileDoc = await ceramic.createDocument('tile', {
      content: { walletAddress, password },
      metadata: { schema: userProfileSchema }
    });

    const credentialData = { username: walletAddress, password };
    const credentialId = await issueVerifiableCredential(userProfileDoc.id.toString(), credentialData);

    res.status(201).json({
      message: 'User profile created successfully and verifiable credential issued',
      docId: userProfileDoc.id.toString(),
      credentialId
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

export default UserProfiles;
