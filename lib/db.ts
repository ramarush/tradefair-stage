import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';


console.log('process.env.POSTGRES_USER',process.env.POSTGRES_USER )
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'tradefair',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'tradefair',
  password: process.env.POSTGRES_PASSWORD || 'tradefair',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default pool;

