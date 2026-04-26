
const API_BASE = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@alpha.com.ni';
const ADMIN_PASS = 'Admin123!';

async function testInvoiceCreate() {
  console.log('🧪 Probando creación de factura con líneas...');

  // 1. Login
  const loginRes = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  const { data: { token, user } } = await loginRes.json() as any;
  const companyId = user.companyId;

  // 2. Get a third party
  const tpRes = await fetch(`${API_BASE}/third-parties?companyId=${companyId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data: tpData } = await tpRes.json() as any;
  const thirdPartyId = tpData.data[0].id;

  // 3. Create Invoice
  const invoiceData = {
    companyId,
    thirdPartyId,
    invoiceType: 'SALE',
    invoiceDate: new Date().toISOString(),
    description: 'Factura de prueba con líneas automatizada',
    lines: [
      { description: 'Producto A', quantity: 2, unitPrice: 100, taxRate: 15 },
      { description: 'Servicio B', quantity: 1, unitPrice: 500, taxRate: 0 }
    ]
  };

  console.log('📤 Enviando factura...');
  const createRes = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(invoiceData)
  });

  const result = await createRes.json() as any;

  if (result.success) {
    console.log('✅ Factura creada exitosamente!');
    console.log('🆔 ID:', result.data.id);
    console.log('🔢 Número:', result.data.number);
    console.log('💰 Total:', result.data.totalAmount);
    console.log('📝 Líneas guardadas:', result.data.lines.length);
    
    if (result.data.lines.length === 2 && result.data.totalAmount === 730) {
      console.log('✨ LOS DATOS SE GUARDARON CORRECTAMENTE (Subtotal 700 + IVA 30)');
    } else {
      console.warn('⚠️ Los totales o líneas no coinciden con lo esperado.');
    }
  } else {
    console.error('❌ Error al crear factura:', result.error);
  }
}

testInvoiceCreate();
