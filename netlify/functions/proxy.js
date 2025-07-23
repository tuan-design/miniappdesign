// Thêm timeout và headers kiểm soát
export async function handler(event) {
  const targetUrl = decodeURIComponent(event.queryStringParameters.url || '');
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return {
      statusCode: 400,
      body: 'URL không hợp lệ'
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MiniApp Finance Tracker'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, max-age=300'
      },
      body: await response.text()
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Lỗi: ${err.message}`
    };
  }
}
