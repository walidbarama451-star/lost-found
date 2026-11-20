import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  },
  get isProduction(): boolean {
    return (process.env.NODE_ENV ?? 'development') === 'production';
  },
  get isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  },
  get port(): number {
    return Number(process.env.PORT ?? 5000);
  },
  get mongodbUri(): string {
    return required('MONGODB_URI', 'mongodb://127.0.0.1:27017/lost-and-found');
  },
  get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (this.isProduction) throw new Error('JWT_SECRET must be set in production');
      return 'development-only-secret-do-not-use-in-production';
    }
    return secret;
  },
  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN ?? '30m';
  },
  get clientUrl(): string {
    return process.env.CLIENT_URL ?? 'http://localhost:5173';
  },
  get imageStorage(): 'cloudinary' | 'local' {
    const explicit = process.env.IMAGE_STORAGE;
    if (explicit === 'cloudinary' || explicit === 'local') return explicit;
    return process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local';
  },
  get uploadDir(): string {
    return process.env.UPLOAD_DIR ?? 'uploads';
  },
  get cloudinary(): { cloudName: string; apiKey: string; apiSecret: string } {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
      apiKey: process.env.CLOUDINARY_API_KEY ?? '',
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    };
  },
  get hfToken(): string {
    return process.env.HF_TOKEN ?? '';
  },
  get hfEmbeddingModel(): string {
    return process.env.HF_EMBEDDING_MODEL ?? 'openai/clip-vit-base-patch32';
  },
  get embeddingConfigured(): boolean {
    return this.hfToken.length > 0;
  },
  get similarityThreshold(): number {
    const value = Number(process.env.SIMILARITY_THRESHOLD ?? '0.8');
    return Number.isFinite(value) && value > 0 && value < 1 ? value : 0.8;
  },
  get textMatchThreshold(): number {
    const value = Number(process.env.TEXT_MATCH_THRESHOLD ?? '0.45');
    return Number.isFinite(value) && value > 0 && value < 1 ? value : 0.45;
  },
};
