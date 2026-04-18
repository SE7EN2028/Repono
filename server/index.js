import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import repoRoutes from './routes/repo.js';
import queryRoutes from './routes/query.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/repo', repoRoutes);
app.use('/api/query', queryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Repono server running on port ${PORT}`);
});
