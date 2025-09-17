import { NextResponse } from 'next/server';
import { getBackendUrl } from '../../../config/api';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    const backendUrl = getBackendUrl();
    
    console.log("Proxying admin check for:", email);
    
    const response = await fetch(`${backendUrl}/admin/check?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error("Backend response error:", response.status, response.statusText);
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }
    
    const isAdmin = await response.json();
    
    console.log("Admin check result for", email, ":", isAdmin);
    
    return NextResponse.json(isAdmin);
  } catch (error) {
    console.error("Proxy admin check failed:", error);
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message }, 
      { status: 500 }
    );
  }
}