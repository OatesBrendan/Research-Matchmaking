const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');


const indexRouter = require('./routes/indexRoutes');

// Import error middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Initialize express
const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/docs', swaggerUI.serve);
app.get('/docs', swaggerUI.setup(swaggerDocument));


// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

module.exports = app;