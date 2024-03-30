import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import logger from './logger.utils.js';
import Joi from 'joi';
import { ethers } from 'ethers';
import { provider, productInformationContract, lotInformationContract, escrowContract } from '../services/contract-initializer.service.js';

export const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next();
};

export const TokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.replace('Bearer ', '');

    try {
      const DecodedToken = jwt.verify(token, process.env.SECRET);
      request.token = DecodedToken;
    } catch (err) {
      request.token = null;
    }
  } else {
    request.token = null;
  }

  next();
};

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

export const AddressExtractor = (request, response, next) => {
  const privateKey = request.get('private-key');

  const schema = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{64}$/)
  .length(66)
  .required()
  .messages({
    'string.pattern.base': 'Private key must be a hexadecimal string',
    'string.length': 'Private key must be exactly 64 characters long',
    'any.required': 'Private key is required'
  });

  const { error } = schema.validate(privateKey);
  if (error) {
    return response.status(400).json({ error: error.details.map(detail => detail.message) });
  }

  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    request.ProductInformation = productInformationContract.connect(wallet);
    request.Escrow = escrowContract.connect(wallet);
    request.LotInformation = lotInformationContract.connect(wallet);
    next();
  } catch (error) {
    console.error('Error creating wallet:', error);
    request.contract = null;
    next(); // Proceed to the next middleware
  }
};
