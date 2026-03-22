import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../infrastructure/prismaClient';

describe('POST /candidates', () => {
  const uniqueEmail = (): string => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a candidate and return 201', async () => {
    const email = uniqueEmail();
    const res = await request(app).post('/candidates').send({
      firstName: 'Jane',
      lastName: 'Smith',
      email,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      firstName: 'Jane',
      lastName: 'Smith',
      email,
    });
    expect(typeof res.body.id).toBe('number');

    await prisma.candidate.delete({ where: { id: res.body.id } });
  });

  it('should return 400 for duplicate email', async () => {
    const email = uniqueEmail();
    const first = await request(app).post('/candidates').send({
      firstName: 'Jane',
      lastName: 'Smith',
      email,
    });
    expect(first.status).toBe(201);

    const second = await request(app).post('/candidates').send({
      firstName: 'Jane',
      lastName: 'Other',
      email,
    });
    expect(second.status).toBe(400);
    expect(second.body.message).toBeDefined();

    await prisma.candidate.delete({ where: { id: first.body.id } });
  });

  it('should return 400 for validation errors', async () => {
    const res = await request(app).post('/candidates').send({
      firstName: 'J',
      lastName: 'Doe',
      email: 'a@b.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should create a candidate with resume metadata after upload', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lti-cv-'));
    const pdfPath = path.join(tmpDir, 'cv.pdf');
    fs.writeFileSync(pdfPath, '%PDF-1.4 test');

    const uploadRes = await request(app)
      .post('/upload')
      .attach('file', pdfPath, { contentType: 'application/pdf' });

    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(uploadRes.status).toBe(200);

    const email = uniqueEmail();
    const createRes = await request(app).post('/candidates').send({
      firstName: 'Resume',
      lastName: 'User',
      email,
      cv: {
        filePath: uploadRes.body.filePath,
        fileType: uploadRes.body.fileType,
      },
    });

    expect(createRes.status).toBe(201);

    const resumes = await prisma.resume.findMany({
      where: { candidateId: createRes.body.id },
    });
    expect(resumes).toHaveLength(1);
    expect(resumes[0].filePath).toBe(uploadRes.body.filePath);

    await prisma.candidate.delete({ where: { id: createRes.body.id } });

    const uploadedFile = path.join(process.cwd(), uploadRes.body.filePath);
    if (fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
  });
});
