import { NextResponse } from 'next/server';
import { getBackendUrl } from '../../config/api.js';

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    
    console.log("Testing backend connection to:", backendUrl);
    
    // Test with a simple endpoint that should exist
    const response = await fetch(`${backendUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.text();
    
    return NextResponse.json({
      success: true,
      backendUrl,
      result,
      status: response.status,
      message: "Backend connection successful!"
    });
  } catch (error) {
    console.error("Backend test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      backendUrl: getBackendUrl()
    }, { status: 500 });
  }
}