function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmailHtml(interpretation) {
  const actions = (interpretation.actions ?? []).map((action) => `<li>${escapeHtml(action)}</li>`).join("");

  const approvalSection = interpretation.approvalLink
    ? `<p><a href="${escapeHtml(interpretation.approvalLink)}">Review and approve remediation</a></p>`
    : "";

  return `<!DOCTYPE html>
<html>
  <body style="font-family: Segoe UI, Arial, sans-serif; color: #1a1a1a;">
    <h2 style="color:#b91c1c;">[${escapeHtml((interpretation.severity ?? "unknown").toUpperCase())}] ${escapeHtml(interpretation.title ?? "SRE Agent Alert")}</h2>
    <p>${escapeHtml(interpretation.summary ?? "")}</p>
    <p><strong>Impact:</strong> ${escapeHtml(interpretation.impact ?? "")}</p>
    <p><strong>Recommended actions:</strong></p>
    <ul>${actions}</ul>
    ${approvalSection}
  </body>
</html>`;
}

module.exports = { renderEmailHtml, escapeHtml };
