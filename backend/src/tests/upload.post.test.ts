import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { app } from '../index';

describe('POST /upload', () => {
  it('should reject request without file', async () => {
    const res = await request(app).post('/upload');
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should accept a small PDF upload', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lti-upload-'));
    const filePath = path.join(tmpDir, 'sample.pdf');
    fs.writeFileSync(filePath, '%PDF-1.4 minimal');

    const res = await request(app)
      .post('/upload')
      .attach('file', filePath, { contentType: 'application/pdf' });

    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(res.status).toBe(200);
    expect(res.body.filePath).toBeDefined();
    expect(res.body.fileType).toBe('application/pdf');

    const uploaded = path.join(process.cwd(), res.body.filePath);
    if (fs.existsSync(uploaded)) {
      fs.unlinkSync(uploaded);
    }
  });
});
