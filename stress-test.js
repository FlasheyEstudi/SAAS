import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba para CARGA MEDIA (300 usuarios)
export const options = {
  stages: [
    { duration: '30s', target: 150 }, // Rampa a 150
    { duration: '1m', target: 300 },  // Pico de 300 usuarios
    { duration: '30s', target: 0 },   // Bajada
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% de peticiones bajo 3s
    http_req_failed: ['rate<0.02'],    // Menos del 2% de errores
  },
};

const BASE_URL = 'http://localhost:3001'; 

export default function () {
  const loginPayload = JSON.stringify({
    email: 'admin@alpha.com.ni',
    password: 'Admin123!',
  });

  const loginHeaders = { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  const loginRes = http.post(`${BASE_URL}/api/users/login`, loginPayload, { headers: loginHeaders });

  const isLoginOk = check(loginRes, {
    'login exitoso': (r) => r.status === 200,
    'token recibido': (r) => {
      try {
        const body = r.json();
        return body.success === true && body.data && body.data.token !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (isLoginOk) {
    const body = loginRes.json();
    const token = body.data.token;
    const user = body.data.user;
    const companyId = user.companyId || (user.availableCompanies && user.availableCompanies[0]?.id);

    const authHeaders = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    if (companyId) {
      const dashboardRes = http.get(`${BASE_URL}/api/dashboard/kpis?companyId=${companyId}`, { headers: authHeaders });
      check(dashboardRes, {
        'dashboard 200': (r) => r.status === 200,
        'datos de dashboard': (r) => {
          try {
            return r.json().success === true;
          } catch (e) {
            return false;
          }
        }
      });
    }
  }

  sleep(1); 
}
