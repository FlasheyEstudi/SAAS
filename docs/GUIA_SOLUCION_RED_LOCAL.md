# 🛠️ Guía de Solución: Pantalla Negra en Red Local (Mobile Access)

Esta guía explica por qué el sistema GANESHA se bloqueaba al acceder desde dispositivos móviles y cómo se solucionó.

## 🚨 El Problema: "Pantalla Negra"
Al acceder desde un móvil o tablet a la IP del servidor (ej. `http://172.16.27.128:3000`), la aplicación cargaba el HTML básico pero no podía descargar los archivos de estilos (CSS), animaciones (JS) ni conectarse al socket de desarrollo.

### ¿Por qué sucedía?
1. **Seguridad de Next.js (AllowedDevOrigins)**: Por defecto, Next.js bloquea conexiones de desarrollo que no vengan de `localhost`. Al usar un celular, la conexión viene de una IP externa, y el servidor la rechazaba por seguridad.
2. **Falla de Hidratación**: React intentaba renderizar animaciones complejas antes de que el navegador móvil terminara de descargar los scripts, causando un error que "rompía" la interfaz (crash silencioso).
3. **Bloqueo de Proxy**: El frontend intentaba hablar con el backend usando nombres internos que el celular no sabía resolver.

---

## ✅ La Solución (Aplicada)

### 1. Apertura de la "Puerta de Seguridad"
Se modificó `next.config.ts` para autorizar explícitamente la IP de la red local:
```typescript
allowedDevOrigins: ['*', '172.16.27.128']
```
*Esto permite que el servidor entregue el código y las animaciones al celular sin bloqueos.*

### 2. Arranque Seguro (Mounted Check)
Se implementó un estado de `mounted` en el archivo principal:
- El sistema detecta si el navegador está listo.
- Si no está listo, muestra la **Animación de Ganesha (Loader)**.
- Una vez cargado, muestra la aplicación real.
*Esto evita que la pantalla se quede en negro por intentar renderizar efectos demasiado rápido.*

### 3. Timeouts en la API
Se añadió un tiempo de espera de **15 segundos** a todas las peticiones. Si el WiFi falla, la app te avisará en lugar de quedarse "congelada".

---

## 💡 Cómo evitarlo en el futuro
Si cambias de red o de PC y vuelve a fallar:
1. Revisa tu nueva IP local con el comando `ipconfig`.
2. Asegúrate de que esa IP esté en la lista `allowedDevOrigins` dentro de `next.config.ts`.
3. **REINICIA el servidor** (`npm run dev`) siempre que cambies este archivo.

---
**Soberanía Digital • Ganesha ERP • 2026**
