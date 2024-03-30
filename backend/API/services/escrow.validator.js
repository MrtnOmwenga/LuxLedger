import Joi from 'joi';

const idSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID must be a number',
  'number.integer': 'ID must be an integer',
  'number.positive': 'ID must be a positive number',
  'any.required': 'ID is required'
});

const priceSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'Price must be a number',
  'number.integer': 'Price must be an integer',
  'number.positive': 'Price must be a positive number',
  'any.required': 'Price is required'
});

export const validateLotListing = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    lotId: idSchema,
    pricePerUnit: priceSchema,
  });

  const { error } = schema.validate(request.body);
  if (error) return response.status(400).json({ error: error.details.map(detail => detail.message) });

  next();
}

export const validateBatchListing = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    pricePerUnit: priceSchema,
  });

  const { error } = schema.validate(request.body);
  if (error) return response.status(400).json({ error: error.details.map(detail => detail.message) });

  next();
}

export const validatePurchase = (request, response, next) => {
  const schema = Joi.object({
    listingId: Joi.number().integer().positive().required(),
    amount: Joi.string().required().pattern(/^\d+(\.\d+)?$/), // Amount should be a positive number
  });

  const { error } = schema.validate(request.body);
  if (error) {
    return response.status(400).json({ error: error.details[0].message });
  }

  next();
};