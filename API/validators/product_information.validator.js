import Joi from 'joi';

const idSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID must be a number',
  'number.integer': 'ID must be an integer',
  'number.positive': 'ID must be a positive number',
  'any.required': 'ID is required'
});

const objectSchema = Joi.object().required().messages({
  'object.base': 'Metadata must be a JSON object',
  'any.required': 'Metadata is required'
});

export function validateCreateProductBatch(request, response, next) {
  const schema = Joi.object({
    batchSize: Joi.number().integer().positive().required().messages({
      'number.base': 'Batch size must be a number',
      'number.integer': 'Batch size must be an integer',
      'any.required': 'Batch size is required'
    }),
    manufacturingDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'Manufacturing date must be in the format "YYYY-MM-DD"',
      'any.required': 'Manufacturing date is required'
    }),
    componentIds: Joi.array().items(Joi.number().integer()).required().messages({
      'array.base': 'Component IDs must be an array',
      'array.items': 'Component IDs must be integers',
      'any.required': 'Component IDs are required'
    }),
    metadata: objectSchema
  });

  const { error } = schema.validate(request.body);
  if (error) return response.status(400).json({ error: error.details.map(detail => detail.message) });

  next();
}

export const validateCreateLot = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    lotSize: Joi.number().integer().positive().required().messages({
      'number.base': 'Lot size must be a number',
      'number.integer': 'Lot size must be an integer',
      'number.positive': 'Lot size must be a positive number',
      'any.required': 'Lot size is required'
    })
  });

  const { error } = schema.validate(request.body);
  if (error) return response.status(400).json({ error: error.details.map(detail => detail.message) });

  next();
};

export const validateUpdateBatchStatus = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    status: Joi.number().integer().min(0).max(7).required().messages({
      'number.base': 'Status must be a number',
      'number.integer': 'Status must be an integer',
      'number.min': 'Status must be greater than or equal to 0',
      'number.max': 'Status must be less than or equal to 7',
      'any.required': 'Status is required'
    })
  });

  const { error } = schema.validate(request.body);
  if (error) {
    return response.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};

export const validateAddInspector = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    inspector: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required().messages({
      'string.pattern.base': 'Inspector address must be a valid Ethereum address',
      'any.required': 'Inspector address is required'
    })
  });

  const { error } = schema.validate(request.body);
  if (error) {
    return response.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};

export const validateUpdateInspection = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    status: Joi.number().integer().min(0).max(2).required().messages({
      'number.base': 'Status must be a number',
      'number.integer': 'Status must be an integer',
      'number.min': 'Status must be at least 0',
      'number.max': 'Status must be at most 2',
      'any.required': 'Status is required'
    }),
    inspectionDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'Inspection date must be in the format "yyyy-mm-dd"',
      'any.required': 'Inspection date is required'
    }),
    authentication: objectSchema
  });

  const { error } = schema.validate(request.body);
  if (error) {
    return response.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};

export const validateRecallProduct = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    reason: objectSchema
  });

  const { error } = schema.validate(request.body);
  if (error) {
    return response.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};

export const validateReportDefect = (request, response, next) => {
  const schema = Joi.object({
    batchId: idSchema,
    description: objectSchema
  });

  const { error } = schema.validate(request.body);
  if (error) {
    return response.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};

export const validateResolveRecall = (request, response, next) => {
  const schema = Joi.object({
    recallId: idSchema,
  });

  const { error } = schema.validate(request.body);
  if (error) {
    return response.status(400).json({ error: error.details.map(detail => detail.message) });
  }
  next();
};