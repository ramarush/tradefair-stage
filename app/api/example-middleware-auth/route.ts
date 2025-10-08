import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // ✨ SUPER CLEAN! Just one line for authentication
  const auth = await requireAuth(request, ['admin', 'staff']);
  
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // User is automatically verified! 🎉
  const user = auth.user!; // TypeScript: user is guaranteed to exist after auth.success check

  return NextResponse.json({
    message: 'Authentication successful!',
    user: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      roles: {
        isAdmin: user.isAdmin,
        isStaff: user.isStaff
      }
    },
    timestamp: new Date().toISOString()
  });
}

// Example for user-only endpoint
export async function POST(request: NextRequest) {
  // Any authenticated user can access this
  const auth = await requireAuth(request, ['user']);
  
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const user = auth.user!; // TypeScript: user is guaranteed to exist after auth.success check

  return NextResponse.json({
    message: 'User endpoint accessed successfully!',
    userId: user.id,
    isActive: user.isActive
  });
}
