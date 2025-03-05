import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { token } = data;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Get the IP address from Cloudflare or the request
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for') || 
               request.ip;

    // Environment variable for the secret key (either using TURNSTILE_SECRET_KEY or a fallback for development)
    const secretKey = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAA_nlG7R4LGuHqzKDw0vQthRPxA';

    // Make the verification request to Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const result = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Parse the response and return the result
    const outcome = await result.json();
    
    if (outcome.success) {
      return NextResponse.json({ success: true, data: outcome });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Turnstile verification failed', 
          details: outcome['error-codes'] 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return NextResponse.json(
      { success: false, error: 'Server error during verification' },
      { status: 500 }
    );
  }
}