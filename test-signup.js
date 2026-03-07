const http = require('http');

const options = {
  hostname: 'localhost',
  port: 54112,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing signup API...');

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
  process.exit(1);
});

req.write(JSON.stringify({
  email: 'test@example.com',
  password: 'testpass123',
  username: 'testuser'
}));

req.end();

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Timeout: No response received');
  process.exit(1);
}, 10000);
