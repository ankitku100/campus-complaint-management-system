const http = require('http');

const testLogin = (email, password) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email, password });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(body)
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(data);
    req.end();
  });
};

const run = async () => {
  console.log('Testing Unified Live HTTP Login Endpoint on Port 5000...');

  // 1. Admin
  console.log('\n--- 1. Admin Login (campuscare.service@gmail.com) ---');
  const resAdmin = await testLogin('campuscare.service@gmail.com', 'admin@123');
  console.log('Result:', resAdmin);

  // 2. Student
  console.log('\n--- 2. Student Login (student@test.com) ---');
  const resStudent = await testLogin('student@test.com', 'Ankit@100');
  console.log('Result:', resStudent);

  // 3. Staff
  console.log('\n--- 3. Staff Login (security.staff1@gmail.com) ---');
  const resStaff = await testLogin('security.staff1@gmail.com', 'Ankit@100');
  console.log('Result:', resStaff);

  // 4. Staff Demo
  console.log('\n--- 4. Staff Demo Login (staff@test.com) ---');
  const resStaffDemo = await testLogin('staff@test.com', 'Ankit@100');
  console.log('Result:', resStaffDemo);
};

run();
