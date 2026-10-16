/**
 * Environment configuration validator
 * Validates required environment variables at startup and fails fast with actionable errors.
 */

const validateEnv = () => {
  const errors = [];

  if (!process.env.MONGO_URI) {
    errors.push('MONGO_URI is required (e.g. mongodb://127.0.0.1:27017/online_polling)');
  } else if (
    !process.env.MONGO_URI.startsWith('mongodb://') &&
    !process.env.MONGO_URI.startsWith('mongodb+srv://')
  ) {
    errors.push('MONGO_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required to sign authentication tokens');
  } else if (process.env.JWT_SECRET.length < 16) {
    errors.push('JWT_SECRET must be at least 16 characters long for cryptographic security');
  }

  if (process.env.PORT) {
    const port = Number(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid number between 1 and 65535');
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ ========================================');
    console.error('❌ FATAL: ENVIRONMENT CONFIGURATION ERROR');
    console.error('❌ ========================================');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('\nPlease copy server/.env.example to server/.env and provide valid configuration.');
    console.error('========================================\n');
    process.exit(1);
  }
};

module.exports = { validateEnv };
