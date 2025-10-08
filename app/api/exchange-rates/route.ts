import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch exchange rates (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const exchangeRates = settings?.settings?.exchangeRates || {};

    return NextResponse.json({
      exchangeRates: {
        usdDepositRate: exchangeRates.usdDepositRate || null,
        usdWithdrawalRate: exchangeRates.usdWithdrawalRate || null
      }
    });

  } catch (error: any) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
