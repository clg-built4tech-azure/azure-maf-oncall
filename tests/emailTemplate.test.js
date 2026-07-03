const { escapeHtml, renderEmailHtml } = require("../src/functions/Shared/emailTemplate.js");

describe("escapeHtml", () => {
  test("escapes HTML special characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });
});

describe("renderEmailHtml", () => {
  const interpretation = {
    title: "Database connection pool exhausted",
    summary: "The primary database ran out of connections under load.",
    severity: "high",
    impact: "Checkout API returning 500s for ~8% of requests.",
    actions: ["Scale up connection pool", "Restart affected pods"],
    approvalLink: "https://example.com/approvals/123",
  };

  test("includes severity, title, and actions", () => {
    const html = renderEmailHtml(interpretation);
    expect(html).toContain("HIGH");
    expect(html).toContain("Database connection pool exhausted");
    expect(html).toContain("Scale up connection pool");
    expect(html).toContain("Restart affected pods");
    expect(html).toContain("https://example.com/approvals/123");
  });

  test("omits approval section when no link is provided", () => {
    const html = renderEmailHtml({ ...interpretation, approvalLink: null });
    expect(html).not.toContain("Review and approve remediation");
  });

  test("escapes untrusted content in fields", () => {
    const html = renderEmailHtml({ ...interpretation, title: `<img src=x onerror=alert(1)>` });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});
