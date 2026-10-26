import { z } from "zod";
import { locales, type ErrorCode } from "./i18n";

export const INPUT_LIMITS = {
  resumeText: { min: 200, max: 15_000 },
  jobDescription: { min: 100, max: 10_000 },
} as const;

export const analyzeInputSchema = z.object({
  resumeText: z.string().trim().min(INPUT_LIMITS.resumeText.min).max(INPUT_LIMITS.resumeText.max),
  jobDescription: z.string().trim().min(INPUT_LIMITS.jobDescription.min).max(INPUT_LIMITS.jobDescription.max),
});
export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;

export const analysisIdSchema = z.uuid();
export const localeSchema = z.enum(locales);

const FIELD_PREFIX = { resumeText: "resume", jobDescription: "job" } as const;

export function inputErrorCode(error: z.ZodError): ErrorCode {
  const issue = error.issues[0];
  const prefix = FIELD_PREFIX[issue?.path[0] as keyof typeof FIELD_PREFIX];
  if (prefix && issue?.code === "too_small") return `${prefix}_too_short`;
  if (prefix && issue?.code === "too_big") return `${prefix}_too_long`;
  return "invalid_input";
}

const item = (max: number) => z.string().trim().min(1).max(max);

export const analysisResultSchema = z.object({
  jobTitle: item(120).describe("Short title of the analyzed job"),
  score: z.number().int().min(0).max(100).describe("How well the resume matches the job, from 0 to 100"),
  summary: item(800).describe("Assessment summary in 1 to 3 sentences"),
  missingKeywords: z.array(item(60)).max(20).describe("Job keywords missing from the resume"),
  strengths: z.array(item(300)).max(10).describe("Resume strengths for this job"),
  improvements: z.array(item(300)).max(10).describe("Concrete, actionable improvements"),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const feedbackSchema = analysisResultSchema.omit({ jobTitle: true, score: true });
export type Feedback = z.infer<typeof feedbackSchema>;

export const rewriteResultSchema = z.object({
  summary: z.string().trim().min(50).max(1_500).describe("New professional summary, in a single paragraph"),
});

export function parseModelJson<T>(text: string, schema: z.ZodType<T>): T | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function toModelJsonSchema(schema: z.ZodType) {
  const jsonSchema: Record<string, unknown> = z.toJSONSchema(schema);
  delete jsonSchema.$schema;
  return jsonSchema;
}
