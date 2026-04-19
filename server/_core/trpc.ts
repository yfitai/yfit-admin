/**
 * tRPC setup for yfit-admin.
 * Simple context with req/res — no Manus OAuth (admin uses PIN auth instead).
 */

import { initTRPC } from "@trpc/server";
import type { Request, Response } from "express";

export type TrpcContext = {
  req: Request;
  res: Response;
};

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export function createContext({ req, res }: { req: Request; res: Response }): TrpcContext {
  return { req, res };
}
