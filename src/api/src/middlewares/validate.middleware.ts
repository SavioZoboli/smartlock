import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

/**
 * Middleware genérico de validação de body com Zod.
 * Retorna 400 com a primeira mensagem de erro amigável e lista de issues.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      res.status(400).json({
        message: firstIssue?.message || "Dados inválidos",
        errors: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
