CREATE TABLE "Analysis" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "resumeText" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" JSONB NOT NULL,
    "rewrittenSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageEvent" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" UUID NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Analysis_sessionId_createdAt_idx" ON "Analysis"("sessionId", "createdAt" DESC);

CREATE INDEX "UsageEvent_sessionId_createdAt_idx" ON "UsageEvent"("sessionId", "createdAt");

CREATE INDEX "UsageEvent_ipHash_createdAt_idx" ON "UsageEvent"("ipHash", "createdAt");

CREATE INDEX "UsageEvent_createdAt_idx" ON "UsageEvent"("createdAt");

ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_score_range" CHECK ("score" BETWEEN 0 AND 100);
