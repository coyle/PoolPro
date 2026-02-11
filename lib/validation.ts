import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from './http';

export type ParseBodyResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

function formatIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema,
): Promise<ParseBodyResult<z.infer<TSchema>>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      success: false,
      response: apiError(400, 'invalid JSON body', 'invalid_json'),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: apiError(400, 'invalid request body', 'validation_error', formatIssues(parsed.error.issues)),
    };
  }

  return { success: true, data: parsed.data };
}

export function parseRouteParams<TSchema extends z.ZodTypeAny>(
  params: unknown,
  schema: TSchema,
): ParseBodyResult<z.infer<TSchema>> {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      response: apiError(400, 'invalid route params', 'validation_error', formatIssues(parsed.error.issues)),
    };
  }
  return { success: true, data: parsed.data };
}

export function parseQuery<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema,
): ParseBodyResult<z.infer<TSchema>> {
  const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(rawQuery);
  if (!parsed.success) {
    return {
      success: false,
      response: apiError(400, 'invalid query params', 'validation_error', formatIssues(parsed.error.issues)),
    };
  }
  return { success: true, data: parsed.data };
}
