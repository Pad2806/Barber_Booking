const http = require('http');

const data = JSON.stringify({
  email: 'admin@example.com',
  password: 'password123' // Or whatever
});

const req = http.request('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', console.error);
req.write(data);
req.end();
