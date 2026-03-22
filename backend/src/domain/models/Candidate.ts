import { prisma } from '../../infrastructure/prismaClient';

/**
 * Aggregate root for candidate persistence. Creation is orchestrated via
 * {@link createCandidateService}; this class provides read helpers used by services.
 */
export class Candidate {
  constructor(
    readonly id: number | undefined,
    readonly firstName: string,
    readonly lastName: string,
    readonly email: string
  ) {}

  static async findOneByEmail(email: string): Promise<Candidate | null> {
    const row = await prisma.candidate.findUnique({ where: { email } });
    if (!row) {
      return null;
    }
    return new Candidate(row.id, row.firstName, row.lastName, row.email);
  }
}
