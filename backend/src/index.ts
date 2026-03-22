import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { candidateRoutes } from './routes/candidateRoutes';
import { uploadRoutes } from './routes/uploadRoutes';
import { errorHandler } from './middleware/errorHandler';

const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

export const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello LTI!');
});

app.use(candidateRoutes);
app.use(uploadRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3010);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
