import { getBackendUrl } from "../../../config/api";

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    
    const response = await fetch(`${backendUrl}/issues/stats`, {
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
    console.error('Error fetching issue stats:', error);
    
    // Return default stats structure on error
    return Response.json({
      totalIssues: 0,
      incompleteIssues: 0, 
      completedIssues: 0
    });
  }
}