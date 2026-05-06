// Usando fetch nativo de Node 18+
async function testAI() {
  try {
    console.log('Probando conexión con Backend AI...');
    const res = await fetch('http://127.0.0.1:3001/api/ai/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Simulamos un token (esto fallará si no hay usuarios en la DB, pero veremos el error)
        'Authorization': 'Bearer MQ==' // Base64 de '1' (userId: 1)
      },
      body: JSON.stringify({
        message: 'Hola',
        companyId: 'test',
        stream: true
      })
    });

    console.log('Status:', res.status);
    if (!res.ok) {
      const text = await res.text();
      console.error('Error Body:', text);
      return;
    }

    const reader = res.body;
    reader.on('data', (chunk) => {
      console.log('Chunk recibido:', chunk.toString());
    });

    reader.on('end', () => {
      console.log('Stream finalizado');
    });

  } catch (err) {
    console.error('Error FATAL en el test:', err);
  }
}

testAI();
