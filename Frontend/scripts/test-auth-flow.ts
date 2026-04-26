
const API_BASE = 'http://localhost:3001/api';

async function testFullAuthFlow() {
  const email = `test_user_${Date.now()}@example.com`;
  const password = 'Password123!';
  const company = 'Test Company';

  console.log(`🧪 Iniciando prueba de flujo completo para: ${email}`);

  // 1. Registro
  console.log('📝 Registrando usuario...');
  const regRes = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email,
      password,
      company,
      phone: '12345678'
    })
  });
  const regData = await regRes.json() as any;

  if (!regData.success) {
    console.error('❌ Fallo en el registro:', regData.error);
    return;
  }
  console.log('✅ Registro exitoso.');

  // 2. Login
  console.log('🔑 Intentando iniciar sesión...');
  const loginRes = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json() as any;

  if (loginData.success) {
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', loginData.data.user.name);
    console.log('🏢 Empresa IDs:', loginData.data.user.availableCompanies.map((c: any) => c.id).join(', '));
    console.log('🪙 Token:', loginData.data.token.substring(0, 10) + '...');
  } else {
    console.error('❌ Error en el login:', loginData.error);
  }
}

testFullAuthFlow();
