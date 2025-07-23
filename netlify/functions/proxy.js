exports.handler = async function(event, context) {
  const url = decodeURIComponent(event.queryStringParameters.url || '');

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Thiếu tham số ?url=' }),
    };
  }

  try {
    const options = {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: event.httpMethod === 'POST' ? event.body : undefined
    };

    const res = await fetch(url, options);
    const data = await res.text();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: data
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Lỗi fetch: ' + err.message })
    };
  }
};
