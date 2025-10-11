import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, validateEmail, validatePhone, validatePassword, generateToken } from '@/lib/auth';
import type { UserRegistration } from '@/lib/auth';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body: UserRegistration = await request.json();
    const { email, phone, first_name, last_name, password, currency, utm_source, utm_medium, utm_campaign, campaign_id } = body;

    // Validation
    if (!email || !first_name || !last_name || !password) {
      return NextResponse.json(
        { error: 'Email, first name, last name, and password are required' },
        { status: 400 }
      );
    }

    // Validate currency
    const validCurrencies = ['USD', 'INR'];
    const userCurrency = currency || 'USD';
    if (!validCurrencies.includes(userCurrency)) {
      return NextResponse.json(
        { error: 'Invalid currency. Must be USD or INR' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique username for trading platform
    const tradingUsername = `${email}`;

    let newUser;
    let tradingPlatformResult = null;

    // Use Prisma transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Create new user
      newUser = await prisma.user.create({
        data: {
          email,
          phone: phone || null,
          firstName: first_name,
          lastName: last_name,
          password: hashedPassword,
          isActive: true,
          isAdmin: false,
          isStaff: false,
          currency: userCurrency,
          utmSource: utm_source || null,
          utmMedium: utm_medium || null,
          utmCampaign: utm_campaign || null,
          campaignId: campaign_id || null,
        },
      });
      // Create user on trading platform - this must succeed for signup to complete
      tradingPlatformResult = await tradingPlatformApi.createUser({
        userId: newUser.id,
        firstName: first_name,
        lastName: last_name,
        username: tradingUsername,
        currency: userCurrency,
        mobile: phone || '',
        email: email,
        password: password,
        country: userCurrency === 'INR' ? 'India' : 'United States',
      });
      console.log("Trading platform user creation result:", tradingPlatformResult); 

      if (!tradingPlatformResult.success || !tradingPlatformResult.tradingPlatformUserId) {
        console.error('Trading platform user creation failed:', tradingPlatformResult.message);
        throw new Error(`Trading platform user creation failed: ${tradingPlatformResult.message}`);
      }

      // Update user with trading platform user ID
      await tx.user.update({
        where: { id: newUser.id },
        data: {
          tradingPlatformUserId: tradingPlatformResult.tradingPlatformUserId || null,
          tradingPlatformAccountId: tradingPlatformResult.tradingPlatformAccountId || null,
        },
      });
      newUser.tradingPlatformUserId = tradingPlatformResult.tradingPlatformUserId || null;
      newUser.tradingPlatformAccountId = tradingPlatformResult.tradingPlatformAccountId || null;
    });

    // Generate JWT token
    const token = generateToken(newUser!.id);

    const response = {
      message: 'User registered successfully',
      user: {
        id: newUser!.id,
        email: newUser!.email,
        phone: newUser!.phone,
        first_name: newUser!.firstName,
        last_name: newUser!.lastName,
        is_active: newUser!.isActive,
        is_admin: newUser!.isAdmin,
        is_staff: newUser!.isStaff,
        currency: newUser!.currency,
        created_at: newUser!.createdAt
      },
      token,
      tradingPlatform: {
        success: true,
        userId: tradingPlatformResult!.tradingPlatformUserId,
        accountId: tradingPlatformResult!.tradingPlatformAccountId,
        username: tradingUsername,
        message: 'Trading account created successfully'
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
