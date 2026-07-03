const { randomUUID } = require("node:crypto");
const { getOpenAiClient } = require("./openAiClient.js");
const { getConfig } = require("./config.js");

const VALID_SEVERITIES = ["low", "medium", "high", "critical"];

const SYSTEM_PROMPT = `You are an SRE incident interpreter. You receive a raw investigation payload from an Azure SRE Agent (findings, root cause, proposed mitigations) and must translate it for an on-call engineer who may not be familiar with the affected system.

Respond with a JSON object with exactly these fields:
- "title": a short, specific incident title (max 80 chars)
- "summary": 2-4 sentences in plain English explaining what happened and why
- "severity": one of "low", "medium", "high", "critical"
- "impact": 1-2 sentences on business/user impact
- "actions": an array of 1-5 short, concrete recommended next steps

Be concise and avoid restating raw log content verbatim.`;

async function interpretFinding(finding) {
  const client = getOpenAiClient();
  const { azureOpenAiDeployment, approvalBaseUrl } = getConfig();

  const response = await client.chat.completions.create({
    model: azureOpenAiDeployment,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(finding) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Azure OpenAI returned an empty interpretation");
  }

  const parsed = JSON.parse(content);
  const findingId = finding.id ?? randomUUID();

  return {
    findingId,
    title: parsed.title ?? "SRE Agent Alert",
    summary: parsed.summary ?? "",
    severity: VALID_SEVERITIES.includes(parsed.severity) ? parsed.severity : "medium",
    impact: parsed.impact ?? "",
    actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5) : [],
    approvalLink: approvalBaseUrl ? `${approvalBaseUrl}/approvals/${findingId}` : null,
    interpretedAt: new Date().toISOString(),
  };
}

module.exports = { interpretFinding, SYSTEM_PROMPT };
