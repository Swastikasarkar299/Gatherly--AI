const fs = require('fs');
const path = require('path');

// Safe environment loader that loads .env.local (higher priority) then .env
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      // Only set if not already set by higher-priority source or environment
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}

function loadEnv() {
  // 1. .env.local (local overrides have highest priority)
  const envLocalPath = path.resolve(__dirname, '..', '.env.local');
  parseEnvFile(envLocalPath);

  // 2. .env (default project settings)
  const envPath = path.resolve(__dirname, '..', '.env');
  parseEnvFile(envPath);
}

loadEnv();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/gatherly',
  JWT_SECRET: process.env.JWT_SECRET || 'gatherly_super_secure_jwt_secret_key_2026_purple_gold',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
};
