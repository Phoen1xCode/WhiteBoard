import { z, type ZodType } from "zod";

export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const bearerSecurity = [{ bearerAuth: [] as string[] }];

export function jsonContent<TSchema extends ZodType>(schema: TSchema, description: string) {
  return {
    content: {
      "application/json": { schema },
    },
    description,
  } as const;
}

export function jsonContentRequired<TSchema extends ZodType>(schema: TSchema, description: string) {
  return {
    ...jsonContent(schema, description),
    required: true,
  } as const;
}
