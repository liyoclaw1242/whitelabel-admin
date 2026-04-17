import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { setAccessToken, getAccessToken } from "./api";

describe("auth token memory store", () => {
  afterEach(() => {
    setAccessToken(null);
  });

  it("starts with null token", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("stores and retrieves a token", () => {
    setAccessToken("abc-123");
    expect(getAccessToken()).toBe("abc-123");
  });

  it("clears token to null", () => {
    setAccessToken("abc-123");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it("overwrites a previous token", () => {
    setAccessToken("first");
    setAccessToken("second");
    expect(getAccessToken()).toBe("second");
  });
});
