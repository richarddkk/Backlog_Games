import { createServer } from 'node:http';
import review from './api/review.mjs';
import card from './api/card.mjs';
try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const port = Number(process.env.PORT || 3001);
createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const route = url.pathname.match(/^\/(r|card)\/([^/]+)\/([^/]+)$/);
  if (!route) { res.statusCode = 404; res.end('Use /r/UID/ID_JOGO ou /card/UID/ID_JOGO.png'); return; }
  req.url = `/?u=${encodeURIComponent(route[2])}&g=${encodeURIComponent(route[3])}`;
  await (route[1] === 'r' ? review : card)(req, res);
}).listen(port, () => console.log(`Compartilhamento local: http://localhost:${port}`));
