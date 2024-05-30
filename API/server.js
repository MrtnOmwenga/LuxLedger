import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import bodyParser from 'body-parser';
import xss from 'xss-clean';
import helmet from 'helmet';
import session from 'express-session';
import ProductInformation from './controllers/product_information.controller.js';
import Escrow from './controllers/escrow.controller.js';
import UserProfiles from './controllers/user.controller.js';
import CeramicController from './controllers/ceramic.controller.js';
import { limiter, requestLogger, TokenExtractor, auth } from './utils/middleware.utils.js';
import swaggerUi from 'swagger-ui-express';
import config from './utils/config.utils.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(xss());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
    styleSrc: ["'self'", 'fonts.googleapis.com'],
    fontSrc: ["'self'", 'fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

// Session middleware configuration
app.use(session({
  secret: config.SECRET,
  resave: false, // explicitly set resave option to false
  saveUninitialized: true, // explicitly set saveUninitialized option to true or false based on your use case
  cookie: {
    sameSite: 'lax', // or 'strict'
  },
}));

app.use('/api-docs', express.static('\./swagger.yml'));

// CSRF middleware configuration
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.use(limiter);

// CSRF token endpoint
app.get('/services/csrf', function (req, res) {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

app.use(requestLogger);
app.use(TokenExtractor);

app.use('/credentials', UserProfiles);

app.use(auth);

app.use('/ceramic', CeramicController);
app.use('/api/product-information', ProductInformation);
app.use('/api/escrow', Escrow);

// Custom CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Handle CSRF token errors here
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(err);
});

// module.exports = app;
export default app;