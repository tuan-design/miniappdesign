const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Lấy tham số 'url' từ query string
    const targetUrl = event.queryStringParameters.url;
    if (!targetUrl) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ error: 'Thiếu tham số url' })
      };
    }

    // Lấy method và body từ yêu cầu
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : null;

    // Gửi yêu cầu đến URL đích (Google Apps Script)
    const response = await fetch(targetUrl, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify(body) : undefined
    });

    // Lấy dữ liệu phản hồi
    const data = await response.json();

    // Trả về phản hồi với CORS headers
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Lỗi proxy:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: 'Lỗi proxy: ' + error.message })
    };
  }
};
