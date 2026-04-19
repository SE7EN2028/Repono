import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import repoRoutes from './routes/repo.js';
import queryRoutes from './routes/query.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;

const app = express();
const clientDist = path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}
app.use(express.json({ limit: '50mb' }));

app.use('/api/repo', repoRoutes);
app.use('/api/query', queryRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

if (fs.existsSync(clientDist)) {
  const html = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
  app.get('*', (req, res) => res.type('html').send(html));
}

app.listen(PORT, () => {
  console.log(`Repono server running on port ${PORT}`);
});
