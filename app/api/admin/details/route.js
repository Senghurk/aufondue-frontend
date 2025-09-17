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
    
    console.log("Fetching admin details for:", email);
    
    const response = await fetch(`${backendUrl}/admin/details?email=${encodeURIComponent(email)}`, {
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
    
    const adminDetails = await response.json();
    
    console.log("Admin details result for", email, ":", adminDetails);
    
    return NextResponse.json(adminDetails);
  } catch (error) {
    console.error("Fetch admin details failed:", error);
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message }, 
      { status: 500 }
    );
  }
}