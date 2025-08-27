import { createServer } from 'node:http';
import { promises as fs, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(process.cwd(), 'server', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const server = createServer(async (req, res) => {
  const url = req.url || '';
  if (!url.startsWith('/api/storage/')) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  const key = url.replace('/api/storage/', '');
  const filePath = join(dataDir, `${key}.json`);

  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    } catch {
      res.setHeader('Content-Type', 'application/json');
      res.end('null');
    }
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', async () => {
      await fs.writeFile(filePath, body);
      res.statusCode = 204;
      res.end();
    });
    return;
  }

  res.statusCode = 405;
  res.end();
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Storage server running on port ${PORT}`);
});
