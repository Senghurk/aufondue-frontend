import { getBackendUrl } from "../../../config/api";

export async function GET(request) {
  try {
    const backendUrl = getBackendUrl();
    const { searchParams } = new URL(request.url);
    
    // Forward query parameters (page, size, etc.)
    const queryString = searchParams.toString();
    const url = queryString ? `${backendUrl}/issues?${queryString}` : `${backendUrl}/issues`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching reports:', error);
    
    // Return empty array on error
    return Response.json([]);
  }
}