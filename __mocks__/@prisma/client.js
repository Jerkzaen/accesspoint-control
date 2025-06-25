export class PrismaClientKnownRequestError extends Error {
  constructor(message, options) {
    super(message);
    this.code = options.code;
    this.clientVersion = options.clientVersion;
    this.meta = options.meta;
    this.batchRequestIdx = options.batchRequestIdx;
  }
}

export const Prisma = {
  PrismaClientKnownRequestError,
};