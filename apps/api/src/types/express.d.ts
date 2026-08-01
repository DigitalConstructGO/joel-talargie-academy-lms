declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      authenticatedUserId?: string;
    }
  }
}
export {};
