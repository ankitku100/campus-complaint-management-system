const loginAndMeasure = async (email, password) => {
  const startLogin = Date.now();
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginTime = Date.now() - startLogin;
    console.log(`POST /api/auth/login (${email}) - ${loginRes.status} (${loginTime}ms)`);

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      console.error(`Login failed: ${errText}`);
      return null;
    }

    const data = await loginRes.json();
    return { token: data.token, role: data.user.role };
  } catch (err) {
    console.error(`POST /api/auth/login failed:`, err.message);
    return null;
  }
};

const measureGet = async (url, token) => {
  const start = Date.now();
  try {
    const res = await fetch(`http://localhost:5000${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const duration = Date.now() - start;
    console.log(`GET ${url} - ${res.status} (${duration}ms)`);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error details: ${errText}`);
    }
    return { status: res.status, duration };
  } catch (err) {
    console.error(`GET ${url} failed:`, err.message);
    return { status: 500, duration: Date.now() - start };
  }
};

const run = async () => {
  console.log('Starting endpoint measurement...');
  
  // 1. Admin login & endpoints
  const admin = await loginAndMeasure('campuscare.service@gmail.com', 'admin@123');
  if (admin) {
    await measureGet('/api/admin/stats', admin.token);
    await measureGet('/api/admin/complaints', admin.token);
    await measureGet('/api/admin/staff', admin.token);
    await measureGet('/api/admin/pending-staff', admin.token);
    await measureGet('/api/admin/staff-performance', admin.token);
  }

  // 2. Student login & endpoints
  const student = await loginAndMeasure('student@test.com', 'password');
  if (student) {
    await measureGet('/api/complaints/my', student.token);
    await measureGet('/api/categories', student.token);
    await measureGet('/api/auth/me', student.token);
  }

  // 3. Staff login & endpoints
  const staff = await loginAndMeasure('staff@test.com', 'password');
  if (staff) {
    await measureGet('/api/staff/complaints', staff.token);
    await measureGet('/api/staff/performance', staff.token);
  }

  console.log('Measurement completed.');
  process.exit(0);
};

// Wait 2 seconds for server to be fully ready, then run
setTimeout(run, 2000);
