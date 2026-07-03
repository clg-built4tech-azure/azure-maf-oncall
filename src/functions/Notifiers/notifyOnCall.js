const { app } = require("@azure/functions");
const { notifyOnCall } = require("../Shared/notify.js");

app.storageQueue("notifyOnCall", {
  queueName: "interpreted-findings",
  connection: "AzureWebJobsStorage",
  handler: async (queueEntry, context) => {
    const interpretation = typeof queueEntry === "string" ? JSON.parse(queueEntry) : queueEntry;

    context.log(`Notifying on-call for finding ${interpretation.findingId} (severity: ${interpretation.severity})`);

    await notifyOnCall(interpretation, context);
  },
});
