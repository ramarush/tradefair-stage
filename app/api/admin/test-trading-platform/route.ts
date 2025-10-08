import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

// GET - Test trading platform connection
export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Test connection to trading platform
    const result = await tradingPlatformApi.testConnection();

    return NextResponse.json({
      message: 'Trading platform test completed',
      result: result
    });

  } catch (error) {
    console.error('Error testing trading platform:', error);
    return NextResponse.json(
      { error: 'Failed to test trading platform connection' },
      { status: 500 }
    );
  }
}

// POST - Test user creation or deposit request on trading platform
export async function POST(request: NextRequest) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { testType, firstName, lastName, currency, amount, bankId, comment, tradingPlatformUserId } = await request.json();

    if (testType === 'user-creation') {
      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: 'firstName and lastName are required' },
          { status: 400 }
        );
      }

      // Generate test username
      const testUsername = `test${Date.now()}`;

      // Test user creation
      const result = await tradingPlatformApi.createUser({
        firstName,
        lastName,
        username: testUsername,
        currency: currency || 'USD',
        mobile: '+1234567890',
        country: currency === 'INR' ? 'India' : 'United States',
      });

      return NextResponse.json({
        message: 'Trading platform user creation test completed',
        testUsername,
        result: result
      });

    } else if (testType === 'deposit-request') {
      if (!amount || !bankId || !tradingPlatformUserId) {
        return NextResponse.json(
          { error: 'amount, bankId, and tradingPlatformUserId are required for deposit test' },
          { status: 400 }
        );
      }

      // Test deposit request creation
      const result = await tradingPlatformApi.createDepositRequest({
        amount: parseFloat(amount),
        bankId: parseInt(bankId),
        comment: comment || `Test deposit request for $${amount}`,
        tradingPlatformUserId: parseInt(tradingPlatformUserId),
      });

      return NextResponse.json({
        message: 'Trading platform deposit request test completed',
        result: result
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid testType. Must be "user-creation" or "deposit-request"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error testing trading platform:', error);
    return NextResponse.json(
      { error: 'Failed to test trading platform' },
      { status: 500 }
    );
  }
}
