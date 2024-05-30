import Joi from 'joi';

const userProfileSchema = Joi.object({
  walletAddress: Joi.string().required().messages({
    'any.required': 'Wallet address is required',
    'string.empty': 'Wallet address cannot be empty',
    'string.base': 'Wallet address must be a string',
  }),
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
    'string.min': 'Password must be at least 6 characters long',
    'string.base': 'Password must be a string',
  }),
});

export const validateCreateUserProfile = (req, res, next) => {
  const { error } = userProfileSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => ({ message: detail.message }));
    return res.status(400).json({ errors });
  }

  next();
};
