# Hangar Net · portal de acceso

Página estática (React + Vite) servida por Nginx. Muestra los servicios de la red del hangar y comprueba cada 60 s si responden.

## Roles

Nginx inyecta la IP del cliente (SSI). IP `192.168.11.x` → docente (4 servicios). Cualquier otra IP, o ninguna → alumno (2 servicios).

**Esto solo ordena el menú, no protege nada:** cada servicio debe controlar su propio acceso.
La IP real solo llega si el contenedor ve al cliente directamente (no detrás de otro proxy/NAT).

## Uso

- Desarrollo: `npm install && npm run dev`
- Pruebas: `npm test`
- Producción: `docker compose up -d --build`

Servirlo solo por HTTP: bajo HTTPS el navegador bloquea las comprobaciones `http://`.
