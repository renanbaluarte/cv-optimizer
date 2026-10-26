import { describe, expect, it } from "vitest";
import { hashIp, newSessionId, signSessionId, verifySessionToken } from "./session-token";

const secret = "s".repeat(32);

describe("session token", () => {
  it("accepts a token signed with the same secret", () => {
    const id = newSessionId();
    expect(verifySessionToken(signSessionId(id, secret), secret)).toBe(id);
  });

  it("rejects a token signed with another secret", () => {
    const id = newSessionId();
    expect(verifySessionToken(signSessionId(id, "x".repeat(32)), secret)).toBeNull();
  });

  it("rejects a swapped id with a reused signature (attempt to access another session)", () => {
    const signature = signSessionId(newSessionId(), secret).split(".")[1];
    expect(verifySessionToken(`${newSessionId()}.${signature}`, secret)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    const valid = signSessionId(newSessionId(), secret);
    for (const token of ["", "abc", `${valid}.extra`, `not-a-uuid.${valid.split(".")[1]}`, `${valid.slice(0, -1)}`]) {
      expect(verifySessionToken(token, secret)).toBeNull();
    }
  });

  it("does not expose the original IP in the hash", () => {
    const hash = hashIp("203.0.113.7", secret);
    expect(hash).not.toContain("203.0.113.7");
    expect(hash).toBe(hashIp("203.0.113.7", secret));
  });
});
