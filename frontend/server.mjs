// Servidor estático mínimo para el frontend (los ES modules no corren en file://).
//   node frontend/server.mjs   ->  http://localhost:8081/
// Sirve la carpeta frontend/ y mapea "/" a /public/index.html.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url)); // frontend/
const PORT = Number(process.env.PORT_FRONT || 8081);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    let ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (ruta === '/') ruta = '/public/index.html';
    const archivo = path.normalize(path.join(ROOT, ruta));
    if (!archivo.startsWith(ROOT)) {
      res.writeHead(403).end('403');
      return;
    }
    const body = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(archivo)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404: no encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`Frontend en http://localhost:${PORT}/  (backend esperado en http://localhost:3000)`);
});
