import { Prisma } from '@prisma/client';
import { DuplicateEmailError } from '../../domain/errors';
import { Candidate } from '../../domain/models/Candidate';
import { prisma } from '../../infrastructure/prismaClient';
import { Logger } from '../../infrastructure/logger';
import { validateCreateCandidateRequest } from '../validator';
import type { CreateCandidateResponseDto } from '../types/createCandidate.types';

const logger = new Logger();

export async function createCandidateService(rawBody: unknown): Promise<CreateCandidateResponseDto> {
  const data = validateCreateCandidateRequest(rawBody);

  const existing = await Candidate.findOneByEmail(data.email);
  if (existing) {
    throw new DuplicateEmailError();
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      return tx.candidate.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? null,
          address: data.address ?? null,
          educations:
            data.educations.length > 0
              ? {
                  create: data.educations.map((e) => ({
                    institution: e.institution,
                    title: e.title,
                    startDate: e.startDate,
                    endDate: e.endDate ?? null,
                  })),
                }
              : undefined,
          workExperiences:
            data.workExperiences.length > 0
              ? {
                  create: data.workExperiences.map((w) => ({
                    company: w.company,
                    position: w.position,
                    description: w.description ?? null,
                    startDate: w.startDate,
                    endDate: w.endDate ?? null,
                  })),
                }
              : undefined,
          resumes:
            data.cv !== undefined
              ? {
                  create: [
                    {
                      filePath: data.cv.filePath,
                      fileType: data.cv.fileType,
                    },
                  ],
                }
              : undefined,
        },
      });
    });

    return {
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
      phone: created.phone,
      address: created.address,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new DuplicateEmailError();
    }
    logger.error('Failed to create candidate', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
