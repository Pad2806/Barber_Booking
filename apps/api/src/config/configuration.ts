export default () => ({
  port: parseInt(process.env.PORT || process.env.API_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
    },
    zalo: {
      appId: process.env.ZALO_APP_ID,
      appSecret: process.env.ZALO_APP_SECRET,
      callbackUrl: process.env.ZALO_CALLBACK_URL,
    },
  },

  payment: {
    vietqr: {
      clientId: process.env.VIETQR_CLIENT_ID,
      apiKey: process.env.VIETQR_API_KEY,
    },
    sepay: {
      apiKey: process.env.SEPAY_API_KEY,
      webhookSecret: process.env.SEPAY_WEBHOOK_SECRET,
    },
    bank: {
      code: process.env.BANK_CODE,
      account: process.env.BANK_ACCOUNT,
      name: process.env.BANK_NAME,
    },
  },

  urls: {
    api: process.env.API_URL || 'http://localhost:3001',
    web: process.env.WEB_URL || 'http://localhost:3000',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
});
