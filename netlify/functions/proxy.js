export async function handler(event) {
  const targetUrl = decodeURIComponent(event.queryStringParameters.url || '');
  if (!targetUrl) {
    return {
      statusCode: 400,
      body: 'Missing URL parameter',
    };
  }

  try {
    const response = await fetch(targetUrl);
    const body = await response.text();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Fetch error: ${err.message}`,
    };
  }
}
