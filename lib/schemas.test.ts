import { describe, expect, it } from "vitest";
import { format, getDictionary, locales } from "./i18n";
import { analysisResultSchema, analyzeInputSchema, inputErrorCode, parseModelJson, toModelJsonSchema } from "./schemas";

const validResult = {
  jobTitle: "Frontend Developer",
  score: 85,
  summary: "Good fit for the job.",
  missingKeywords: ["Docker"],
  strengths: ["React"],
  improvements: ["Add metrics"],
};

describe("parseModelJson", () => {
  it("accepts JSON that matches the contract", () => {
    expect(parseModelJson(JSON.stringify(validResult), analysisResultSchema)).toEqual(validResult);
  });

  it("rejects text that is not JSON", () => {
    expect(parseModelJson("Sure! Here it is: {", analysisResultSchema)).toBeNull();
    expect(parseModelJson("", analysisResultSchema)).toBeNull();
  });

  it("rejects a score outside 0-100 or not an integer", () => {
    for (const score of [101, -1, 72.5, "80"]) {
      expect(parseModelJson(JSON.stringify({ ...validResult, score }), analysisResultSchema)).toBeNull();
    }
  });

  it("rejects missing fields and oversized lists", () => {
    const withoutSummary: Partial<typeof validResult> = { ...validResult };
    delete withoutSummary.summary;
    expect(parseModelJson(JSON.stringify(withoutSummary), analysisResultSchema)).toBeNull();
    const tooMany = { ...validResult, strengths: Array.from({ length: 11 }, (_, i) => `item ${i}`) };
    expect(parseModelJson(JSON.stringify(tooMany), analysisResultSchema)).toBeNull();
  });
});

describe("analyzeInputSchema", () => {
  const resumeText = "a".repeat(200);
  const jobDescription = "b".repeat(100);

  it("accepts input within the limits", () => {
    expect(analyzeInputSchema.safeParse({ resumeText, jobDescription }).success).toBe(true);
  });

  it("counts length after trimming whitespace", () => {
    const padded = { resumeText: ` ${"a".repeat(199)} `, jobDescription };
    expect(analyzeInputSchema.safeParse(padded).success).toBe(false);
  });

  it("rejects overly long text and wrong types", () => {
    expect(analyzeInputSchema.safeParse({ resumeText: "a".repeat(15_001), jobDescription }).success).toBe(false);
    expect(analyzeInputSchema.safeParse({ resumeText: 123, jobDescription }).success).toBe(false);
    expect(analyzeInputSchema.safeParse(null).success).toBe(false);
  });
});

describe("toModelJsonSchema", () => {
  it("generates a JSON Schema without $schema and with every field required", () => {
    const schema = toModelJsonSchema(analysisResultSchema) as { required: string[]; $schema?: string };
    expect(schema.$schema).toBeUndefined();
    expect(schema.required).toEqual(Object.keys(validResult));
  });
});

describe("inputErrorCode", () => {
  const codeFor = (input: unknown) => {
    const result = analyzeInputSchema.safeParse(input);
    return result.success ? null : inputErrorCode(result.error);
  };

  it("identifies the field and the error type", () => {
    expect(codeFor({ resumeText: "short", jobDescription: "b".repeat(100) })).toBe("resume_too_short");
    expect(codeFor({ resumeText: "a".repeat(200), jobDescription: "b".repeat(10_001) })).toBe("job_too_long");
  });

  it("falls back to invalid_input for unexpected shapes", () => {
    expect(codeFor(null)).toBe("invalid_input");
    expect(codeFor({ resumeText: 1, jobDescription: "b".repeat(100) })).toBe("invalid_input");
  });

  it("limit messages include the placeholder in both languages", () => {
    for (const locale of locales) {
      expect(getDictionary(locale).errors.resume_too_short).toContain("{min}");
    }
  });
});

describe("format", () => {
  it("replaces only known keys", () => {
    expect(format("min {min}, max {max}, {x}", { min: 200, max: 15_000 })).toBe("min 200, max 15000, {x}");
  });
});
