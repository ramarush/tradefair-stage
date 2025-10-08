import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { tradingPlatformApi } from '@/lib/tradingPlatformApi';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    // Get user from database to check if they have trading platform user ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        tradingPlatformUserId: true,
        tradingPlatformAccountId: true,
        currency: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user doesn't have trading platform user ID, return local balance as fallback
    if (!user.tradingPlatformUserId) {
      // Get local balance as fallback
      const localUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          balance: true,
          bonusBalance: true
        }
      });

      return NextResponse.json({
        success: true,
        balance: localUser?.balance || 0,
        bonusBalance: localUser?.bonusBalance || 0,
        source: 'local',
        message: 'User not linked to trading platform, showing local balance'
      });
    }

    // Fetch balance from trading platform
    const financialsResult = await tradingPlatformApi.getUserFinancials(user.tradingPlatformUserId);

    if (!financialsResult.success) {
      console.error('Failed to fetch trading platform balance:', financialsResult.message);
      
      // Fallback to local balance if trading platform fails
      const localUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          balance: true,
          bonusBalance: true
        }
      });

      return NextResponse.json({
        success: true,
        balance: localUser?.balance || 0,
        bonusBalance: localUser?.bonusBalance || 0,
        source: 'local_fallback',
        message: 'Trading platform unavailable, showing local balance',
        error: financialsResult.message
      });
    }

    // Get local bonus balance (not available from trading platform)
    const localUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        bonusBalance: true
      }
    });

    return NextResponse.json({
      success: true,
      balance: financialsResult.balance || 0,
      bonusBalance: localUser?.bonusBalance || 0,
      source: 'trading_platform',
      message: 'Balance fetched from trading platform',
      tradingPlatformData: financialsResult.data
    });

  } catch (error) {
    console.error('Error fetching trading balance:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
