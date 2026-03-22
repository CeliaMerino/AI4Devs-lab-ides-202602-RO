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
