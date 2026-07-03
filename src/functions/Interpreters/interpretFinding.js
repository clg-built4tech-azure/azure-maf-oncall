const { app, output } = require("@azure/functions");
const { interpretFinding } = require("../Shared/interpretation.js");

const interpretedFindingsQueue = output.storageQueue({
  queueName: "interpreted-findings",
  connection: "AzureWebJobsStorage",
});

app.eventGrid("interpretFinding", {
  return: interpretedFindingsQueue,
  handler: async (event, context) => {
    context.log(`Interpreting SRE Agent finding: ${event.subject ?? event.id}`);

    const interpretation = await interpretFinding(event.data ?? {});

    context.log(`Interpretation complete for finding ${interpretation.findingId} (severity: ${interpretation.severity})`);

    return interpretation;
  },
});
