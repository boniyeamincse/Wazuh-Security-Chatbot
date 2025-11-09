import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

// Simple authentication for demo purposes
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create a simple JWT token (in production, use proper auth library)
    const token = sign(
      { role: 'admin', loggedIn: true },
      process.env.SESSION_SECRET || 'changeme',
      { expiresIn: '24h' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple auth check - in production, verify JWT token from headers
  return NextResponse.json({ authenticated: true });
}