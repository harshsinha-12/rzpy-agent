import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AppError } from "./errors.js";

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: `Route ${request.method} ${request.url} was not found.`,
        requestId: request.id,
      },
    }),
  );

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: error.issues.map((issue) => ({
            code: issue.code,
            message: issue.message,
            path: issue.path.join("."),
          })),
          message: "The request contains invalid parameters.",
          requestId: request.id,
        },
      });
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          ...(error.details ? { details: error.details } : {}),
          message: error.message,
          requestId: request.id,
        },
      });
    }

    request.log.error({ err: error }, "Unhandled API error");

    return reply.code(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
        requestId: request.id,
      },
    });
  });
}
