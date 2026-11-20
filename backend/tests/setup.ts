process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27017/lost-and-found-test';
process.env.MONGODB_TEST_URI = process.env.MONGODB_URI;
process.env.JWT_SECRET = 'test-secret-do-not-use-outside-tests';
process.env.JWT_EXPIRES_IN = '30m';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.IMAGE_STORAGE = 'local';
process.env.UPLOAD_DIR = 'uploads';
