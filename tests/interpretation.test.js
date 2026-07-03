jest.mock("../src/functions/Shared/openAiClient.js");
jest.mock("../src/functions/Shared/config.js");

const { getConfig } = require("../src/functions/Shared/config.js");
const { getOpenAiClient } = require("../src/functions/Shared/openAiClient.js");
const { interpretFinding } = require("../src/functions/Shared/interpretation.js");

function mockCompletion(content) {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(content) } }],
        }),
      },
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getConfig.mockReturnValue({ azureOpenAiDeployment: "gpt-4o", approvalBaseUrl: "" });
});

test("returns structured interpretation with valid severity", async () => {
  getOpenAiClient.mockReturnValue(
    mockCompletion({
      title: "Checkout API degraded",
      summary: "Connection pool exhaustion caused elevated error rates.",
      severity: "high",
      impact: "8% of checkout requests failing.",
      actions: ["Scale pool", "Restart pods"],
    }),
  );

  const result = await interpretFinding({ id: "finding-42" });

  expect(result.findingId).toBe("finding-42");
  expect(result.severity).toBe("high");
  expect(result.actions).toEqual(["Scale pool", "Restart pods"]);
  expect(result.approvalLink).toBeNull();
  expect(typeof result.interpretedAt).toBe("string");
});

test("falls back to medium severity for invalid values", async () => {
  getOpenAiClient.mockReturnValue(
    mockCompletion({ title: "x", summary: "y", severity: "apocalyptic", impact: "z", actions: [] }),
  );

  const result = await interpretFinding({});

  expect(result.severity).toBe("medium");
});

test("caps actions at 5 and generates a finding id when missing", async () => {
  getOpenAiClient.mockReturnValue(
    mockCompletion({
      title: "x",
      summary: "y",
      severity: "low",
      impact: "z",
      actions: ["a", "b", "c", "d", "e", "f", "g"],
    }),
  );

  const result = await interpretFinding({});

  expect(result.actions).toHaveLength(5);
  expect(typeof result.findingId).toBe("string");
  expect(result.findingId.length).toBeGreaterThan(0);
});

test("builds approval link when APPROVAL_BASE_URL is configured", async () => {
  getConfig.mockReturnValue({ azureOpenAiDeployment: "gpt-4o", approvalBaseUrl: "https://approvals.example.com" });
  getOpenAiClient.mockReturnValue(
    mockCompletion({ title: "x", summary: "y", severity: "low", impact: "z", actions: [] }),
  );

  const result = await interpretFinding({ id: "finding-7" });

  expect(result.approvalLink).toBe("https://approvals.example.com/approvals/finding-7");
});

test("throws when Azure OpenAI returns empty content", async () => {
  getOpenAiClient.mockReturnValue({
    chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: {} }] }) } },
  });

  await expect(interpretFinding({})).rejects.toThrow(/empty interpretation/);
});
