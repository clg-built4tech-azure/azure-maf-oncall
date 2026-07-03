const { app } = require("@azure/functions");
const { parseCallAutomationEvent } = require("@azure/communication-call-automation");
const { getCallAutomationClient } = require("../Shared/acsClients.js");

const DEFAULT_MESSAGE = "You have a new on-call notification. Please check your email or SMS for details.";

async function handleCallAutomationEvent(rawEvent, context) {
  const event = parseCallAutomationEvent(rawEvent);
  context.log(`Received call automation event: ${event.kind}`);

  const client = getCallAutomationClient();
  const callConnection = client.getCallConnection(event.callConnectionId);

  if (event.kind === "CallConnected") {
    await callConnection.getCallMedia().playToAll([
      {
        kind: "textSource",
        text: event.operationContext ?? DEFAULT_MESSAGE,
        voiceName: "en-US-JennyNeural",
      },
    ]);
    return;
  }

  if (event.kind === "PlayCompleted" || event.kind === "PlayFailed") {
    await callConnection.hangUp(true);
  }
}

app.http("callEventsWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "call-events",
  handler: async (request, context) => {
    const body = await request.json();
    const rawEvents = Array.isArray(body) ? body : [body];

    for (const rawEvent of rawEvents) {
      await handleCallAutomationEvent(rawEvent, context);
    }

    return { status: 200 };
  },
});
