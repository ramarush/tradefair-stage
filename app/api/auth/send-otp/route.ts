import { NextRequest, NextResponse } from 'next/server';
import { validateEmail } from '@/lib/auth';
import { otpService } from '@/lib/otpService';
import { emailService } from '@/lib/emailService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName } = body;

    // Validation
    if (!email || !firstName) {
      return NextResponse.json(
        { error: 'Email and first name are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // For signup verification, we need to create a temporary user record or handle differently
    // Since we're sending OTP before user creation, we need to create a temporary record
    // Let's create a user record with minimal info that will be completed during signup
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, totpSecret: true }
      });

      if (!existingUser) {
        // Create a temporary user record with just email and TOTP secret (UUID4 auto-generated)
        await prisma.user.create({
          data: {
            email,
            firstName: firstName, // We have this from the request
            lastName: 'Temp', // Temporary, will be updated during signup
            password: 'temp', // Temporary, will be updated during signup
            isActive: false, // Mark as inactive until signup is complete
          }
        });
      }

      // Now generate TOTP for the user
      const otpResult = await otpService.generateTOTP(email);
      if (!otpResult.success || !otpResult.otp) {
        return NextResponse.json(
          { error: 'Failed to generate OTP. Please try again.' },
          { status: 500 }
        );
      }

      // Send OTP email
      const emailResult = await emailService.sendSignupVerificationEmail(email, firstName, otpResult.otp);
      if (!emailResult.success) {
        console.error('Failed to send OTP email:', emailResult.error);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'OTP sent successfully to your email address',
        success: true
      });

    } catch (error) {
      console.error('Error in send-otp:', error);
      return NextResponse.json(
        { error: 'Failed to process OTP request. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
