
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('https://blockcertify.pages.dev'),
  SERVER_URL: z.string().default('https://blockcertify-api.onrender.com'),
  MONGODB_URI: z.string().default(
    process.env.MONGODB_URI ||
    process.env.NEXT_PUBLIC_MONGODB_URI ||
    'mongodb+srv://7973monugoswami_db_user:iA8fi44Kwk3M07W0@cluster0.0txnbgv.mongodb.net/blockcertify'
  ),
  JWT_SECRET: z.string().min(16).default('c08fc58f15616fa54375cb7f909a5a9ffa91e86c8c28c35f23bab082700effcc'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('BlockCertify <no-reply@blockcertify.com>'),
  PINATA_JWT: z.string().default(''),
  PINATA_GATEWAY: z.string().default('https://gateway.pinata.cloud'),
  ETH_RPC_URL: z.string().default('http://127.0.0.1:8545'),
  ETH_PRIVATE_KEY: z.string().default(''),
  ETH_CONTRACT_ADDRESS: z.string().default(''),
  ETH_NETWORK_NAME: z.string().default('hardhat'),
  BLOCKCHAIN_DEMO_MODE: z.string().default('false'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
});

export const env = envSchema.parse(process.env);
