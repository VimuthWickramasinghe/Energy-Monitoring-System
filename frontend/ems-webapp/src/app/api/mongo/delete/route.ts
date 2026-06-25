import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // The backend service URL should be configured in environment variables.
  // Default to localhost for local development.
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';

  try {
    const authorization = request.headers.get('Authorization');
    
    if (!authorization) {
      return NextResponse.json({ success: false, error: 'Authorization header is missing' }, { status: 401 });
    }

    // Forward the DELETE request to the backend service
    const backendResponse = await fetch(`${backendUrl}/data/all`, {
      method: 'DELETE',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
    });

    // Check if the backend responded successfully
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend error: ${backendResponse.status}`, errorText);
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          { success: false, error: errorData.error || `Backend request failed with status ${backendResponse.status}` },
          { status: backendResponse.status }
        );
      } catch (e) {
        return NextResponse.json(
          { success: false, error: errorText || `Backend request failed with status ${backendResponse.status}` },
          { status: backendResponse.status }
        );
      }
    }

    const responseData = await backendResponse.json();
    
    // Return a successful response to the client
    return NextResponse.json({ success: true, data: responseData });

  } catch (error: any) {
    console.error('Error proxying delete request:', error);
    // It's likely the backend server is not running.
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
        return NextResponse.json({ success: false, error: `Connection refused. Is the backend server running at ${backendUrl}?` }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}
