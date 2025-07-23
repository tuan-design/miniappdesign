const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const targetUrl = decodeURIComponent(event.queryStringParameters.url || '');
  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Thiếu tham số ?url=' }),
    };
  }

  try {
    const method = event.httpMethod;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const options = {
      method,
      headers,
    };

    if (method === 'POST') {
      options.body = event.body;
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fetch error: ' + err.message }),
    };
  }
};
