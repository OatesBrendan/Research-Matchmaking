require('dotenv').config();
const app = require('./app');
const connectToDatabase = require('./config/db');


const PORT = process.env.PORT || 3000;

async function startServer() {
  // Connect to MongoDB before starting the server
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

startServer();