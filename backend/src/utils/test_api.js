const run = async () => {
  console.log('Logging in...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'campuscare.service@gmail.com', password: 'admin@123' })
  });
  const data = await loginRes.json();
  const token = data.token;
  console.log('Logged in successfully!');

  console.log('Fetching stats...');
  const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Stats status:', statsRes.status);
  console.log('Stats body:', await statsRes.json());

  console.log('Fetching complaints...');
  const complaintsRes = await fetch('http://localhost:5000/api/admin/complaints', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Complaints status:', complaintsRes.status);
  const compData = await complaintsRes.json();
  console.log('Complaints body:', compData);
};

run().catch(console.error);
