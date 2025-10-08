import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { comparePassword, validateEmail, generateToken } from '@/lib/auth';
import type { UserLogin } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body: UserLogin = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    try {
      // Find user by email using Prisma
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          password: true,
          isActive: true,
          isAdmin: true,
          isStaff: true,
          currency: true
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Account is deactivated. Please contact support.' },
          { status: 401 }
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = generateToken(user.id);

      // Update last login timestamp using Prisma
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });

      return NextResponse.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          first_name: user.firstName,
          last_name: user.lastName,
          is_active: user.isActive,
          is_admin: user.isAdmin,
          is_staff: user.isStaff,
          currency: user.currency,
        },
        token
      }, { status: 200 });

    } catch (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
