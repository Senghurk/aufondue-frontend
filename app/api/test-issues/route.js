import { getBackendUrl } from "../../config/api";

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    console.log("Testing backend connection to:", backendUrl);
    
    // Test basic connectivity to backend
    const response = await fetch(`${backendUrl}/issues`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Backend response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.log("Backend error response:", errorText);
      throw new Error(`Backend responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Backend data sample:", Array.isArray(data) ? `Array with ${data.length} items` : typeof data);
    
    return Response.json({
      status: "success",
      backendUrl: backendUrl,
      responseStatus: response.status,
      dataType: Array.isArray(data) ? `Array with ${data.length} items` : typeof data,
      sampleData: Array.isArray(data) ? data.slice(0, 2) : data
    });
  } catch (error) {
    console.error('Backend connection test failed:', error);
    
    return Response.json({
      status: "error",
      error: error.message,
      backendUrl: getBackendUrl()
    }, { status: 500 });
  }
}