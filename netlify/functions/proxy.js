const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const url = event.queryStringParameters.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Thiếu tham số ?url=' })
    };
  }

  try {
    const method = event.httpMethod;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const options = {
      method,
      headers,
    };

    // Nếu là POST → thêm body
    if (method === "POST") {
      options.body = event.body;
    }

    const response = await fetch(url, options);
    const data = await response.text(); // Có thể là JSON hoặc text

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Cho phép CORS
        'Content-Type': 'application/json'
      },
      body: data
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Lỗi proxy: ' + error.message })
    };
  }
};
