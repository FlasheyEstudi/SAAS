
export {};

/**
 * API Diagnostic Script
 * This script authenticates with the backend and tests all major endpoints.
 * Run with: npx tsx scripts/test-endpoints.ts
 */

const API_BASE = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@alpha.com.ni';
const ADMIN_PASS = 'Admin123!';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'CRASH';
  code?: number;
  time?: number;
  error?: string;
}

async function runTests() {
  console.log('🚀 Iniciando Diagnóstico de API...\n');

  // 1. Autenticación
  console.log('🔑 Intentando autenticación...');
  let token = '';
  let companyId = '';
  try {
    const loginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
    });
    const loginData = await loginRes.json() as any;
    
    if (loginData.success) {
      token = loginData.data.token;
      companyId = loginData.data.user.companyId;
      console.log('✅ Autenticación exitosa.');
      console.log(`🏢 Company ID: ${companyId}\n`);
    } else {
      console.error('❌ Error de autenticación:', loginData.error);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ No se pudo conectar con el backend (localhost:3001):', err.message);
    process.exit(1);
  }

  // 2. Definición de Endpoints a probar
  const endpoints = [
    { name: 'Usuarios', url: `/users?companyId=${companyId}` },
    { name: 'Empresas', url: `/companies` },
    { name: 'Cuentas Contables', url: `/accounts?companyId=${companyId}` },
    { name: 'Facturas', url: `/invoices?companyId=${companyId}` },
    { name: 'Facturas - Aging', url: `/invoices/aging?companyId=${companyId}` },
    { name: 'Facturas - Resumen', url: `/invoices/summary?companyId=${companyId}` },
    { name: 'Asientos Contables', url: `/journal-entries?companyId=${companyId}` },
    { name: 'Terceros', url: `/third-parties?companyId=${companyId}` },
    { name: 'Cuentas Bancarias', url: `/bank-accounts?companyId=${companyId}` },
    { name: 'Centros de Costo', url: `/cost-centers?companyId=${companyId}` },
    { name: 'Impuestos', url: `/tax/rates?companyId=${companyId}` },
    { name: 'Periodos', url: `/periods?companyId=${companyId}` },
    { name: 'Activos Fijos', url: `/fixed-assets?companyId=${companyId}` },
    { name: 'Dashboard KPIs', url: `/dashboard/kpis?companyId=${companyId}` },
    { name: 'Notificaciones', url: `/notifications?companyId=${companyId}` },
    { name: 'Auditoría', url: `/audit?companyId=${companyId}` },
  ];

  const results: TestResult[] = [];

  for (const ep of endpoints) {
    process.stdout.write(`Pruebas: ${ep.name.padEnd(25)} `);
    try {
      const start = Date.now();
      const res = await fetch(`${API_BASE}${ep.url}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const duration = Date.now() - start;
      const data = await res.json() as any;
      
      if (res.ok && data.success) {
        console.log(`✅ OK (${duration}ms)`);
        results.push({ name: ep.name, status: 'PASS', code: res.status, time: duration });
      } else {
        console.log(`❌ ERROR ${res.status}`);
        console.log(`   Mensaje: ${data.error || 'Sin mensaje de error'}`);
        results.push({ name: ep.name, status: 'FAIL', code: res.status, error: data.error });
      }
    } catch (err: any) {
      console.log(`💥 CRASH`);
      results.push({ name: ep.name, status: 'CRASH', error: err.message });
    }
  }

  // 3. Resumen Final
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('='?.repeat(30));
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.length - passed;
  
  console.log(`Total: ${results.length}`);
  console.log(`Exitosos: ${passed}`);
  console.log(`Fallidos: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Módulos con ERRORES detectados:');
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`- ${r.name}: ${r.error || 'Error de conexión'}`);
    });
  } else {
    console.log('\n✨ Todos los módulos base están respondiendo correctamente.');
  }
}

runTests();
