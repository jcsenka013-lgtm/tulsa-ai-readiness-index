import { beforeEach, describe, expect, it, vi } from "vitest";

import { SAMPLE_DENTAL_RESPONSES } from "@/lib/sample-report/dental-practice-fixture";

const create = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { create } };
  },
}));

const { isValidTranscript, runAssistant, MAX_TURNS } = await import("../agent");
const { buildAssistantContext } = await import("../tools");

const ctx = buildAssistantContext({
  status: "completed",
  company_name: "Sample Dental Practice",
  industry: "dental",
  employee_count_range: "6-20",
  responses: SAMPLE_DENTAL_RESPONSES,
});

const ask = [{ role: "user" as const, content: "What should we fix first?" }];

describe("isValidTranscript", () => {
  it("accepts alternating turns that end with the user", () => {
    expect(isValidTranscript(ask)).toBe(true);
    expect(
      isValidTranscript([...ask, { role: "assistant", content: "MFA." }, ...ask]),
    ).toBe(true);
  });

  it("rejects empty, misordered, oversized, or overlong transcripts", () => {
    expect(isValidTranscript([])).toBe(false);
    expect(isValidTranscript([{ role: "assistant", content: "hi" }])).toBe(false);
    expect(isValidTranscript([...ask, { role: "assistant", content: "x" }])).toBe(false);
    expect(isValidTranscript([{ role: "user", content: "x".repeat(2001) }])).toBe(false);
    expect(isValidTranscript([{ role: "user", content: "   " }])).toBe(false);
    const long = Array.from({ length: MAX_TURNS + 1 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: "q",
    }));
    expect(isValidTranscript(long)).toBe(false);
    expect(isValidTranscript("nope")).toBe(false);
  });
});

describe("runAssistant", () => {
  beforeEach(() => create.mockReset());

  it("runs tools, returns their results to Claude, and returns the final text", async () => {
    create
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          { type: "tool_use", id: "t1", name: "get_results_summary", input: {} },
          { type: "tool_use", id: "t2", name: "get_domain_answers", input: { domain: "bogus" } },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "Start with MFA." }],
      });

    const reply = await runAssistant(ctx, ask);

    expect(reply).toEqual({
      text: "Start with MFA.",
      toolsUsed: ["get_results_summary", "get_domain_answers"],
    });
    const second = create.mock.calls[1][0];
    expect(second.model).toBe("claude-opus-5-5");
    expect(second.fallbacks).toBe("default");
    const results = second.messages.at(-1).content;
    expect(results).toHaveLength(2);
    expect(JSON.parse(results[0].content).overall_score).toBe(ctx.result.scores.overall);
    expect(results[1].is_error).toBe(true);
  });

  it("returns a polite message on refusal", async () => {
    create.mockResolvedValueOnce({ stop_reason: "refusal", content: [] });
    const reply = await runAssistant(ctx, ask);
    expect(reply.text).toMatch(/can't help/);
  });

  it("stops after the tool-round cap", async () => {
    create.mockResolvedValue({
      stop_reason: "tool_use",
      content: [{ type: "tool_use", id: "t", name: "get_next_step_details", input: {} }],
    });
    const reply = await runAssistant(ctx, ask);
    expect(create).toHaveBeenCalledTimes(7);
    expect(reply.text).toMatch(/narrow the question/);
  });
});
