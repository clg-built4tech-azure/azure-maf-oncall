const { getEmailClient, getSmsClient, getCallAutomationClient } = require("./acsClients.js");
const { renderEmailHtml } = require("./emailTemplate.js");
const { getConfig } = require("./config.js");

async function sendEmailNotification(interpretation, context) {
  const { acsSenderEmail, onCallEmail } = getConfig();
  if (!acsSenderEmail || !onCallEmail) {
    context.warn("Skipping email notification: ACS_SENDER_EMAIL or ONCALL_EMAIL not configured");
    return { sent: false, reason: "not configured" };
  }

  const client = getEmailClient();
  const plainText = [
    interpretation.summary,
    `Impact: ${interpretation.impact}`,
    "Actions:",
    ...(interpretation.actions ?? []).map((action) => `- ${action}`),
  ].join("\n");

  const poller = await client.beginSend({
    senderAddress: acsSenderEmail,
    content: {
      subject: `[${interpretation.severity.toUpperCase()}] ${interpretation.title}`,
      html: renderEmailHtml(interpretation),
      plainText,
    },
    recipients: { to: [{ address: onCallEmail }] },
  });

  await poller.pollUntilDone();
  return { sent: true };
}

async function sendSmsNotification(interpretation, context) {
  const { acsSenderPhoneNumber, onCallPhoneNumber } = getConfig();
  if (!acsSenderPhoneNumber || !onCallPhoneNumber) {
    context.warn("Skipping SMS notification: ACS_SENDER_PHONE_NUMBER or ONCALL_PHONE_NUMBER not configured");
    return { sent: false, reason: "not configured" };
  }

  const client = getSmsClient();
  const message = `[${interpretation.severity.toUpperCase()}] ${interpretation.title}: ${interpretation.summary}`.slice(0, 320);

  await client.send({
    from: acsSenderPhoneNumber,
    to: [onCallPhoneNumber],
    message,
  });
  return { sent: true };
}

async function sendVoiceNotification(interpretation, context) {
  const { acsSenderPhoneNumber, onCallPhoneNumber, callEventsCallbackUrl } = getConfig();
  if (!acsSenderPhoneNumber || !onCallPhoneNumber || !callEventsCallbackUrl) {
    context.warn("Skipping voice notification: ACS phone numbers or CALL_EVENTS_CALLBACK_URL not configured");
    return { sent: false, reason: "not configured" };
  }

  const message =
    `${interpretation.severity} severity incident. ${interpretation.title}. ${interpretation.summary}`.slice(0, 2000);

  const client = getCallAutomationClient();
  await client.createCall(
    { targetParticipant: { phoneNumber: onCallPhoneNumber } },
    callEventsCallbackUrl,
    {
      sourceCallIdNumber: { phoneNumber: acsSenderPhoneNumber },
      operationContext: message,
    },
  );
  return { sent: true };
}

const CHANNELS = [
  ["email", sendEmailNotification],
  ["sms", sendSmsNotification],
  ["voice", sendVoiceNotification],
];

async function notifyOnCall(interpretation, context) {
  const settled = await Promise.allSettled(CHANNELS.map(([, send]) => send(interpretation, context)));

  const outcomes = settled.map((result, index) => {
    const [channelName] = CHANNELS[index];
    if (result.status === "rejected") {
      context.error(`Notification channel "${channelName}" failed`, result.reason);
      return { channel: channelName, sent: false, reason: result.reason };
    }
    return { channel: channelName, ...result.value };
  });

  if (!outcomes.some((outcome) => outcome.sent)) {
    throw new Error(`All notification channels failed for finding ${interpretation.findingId}`);
  }

  return outcomes;
}

module.exports = { sendEmailNotification, sendSmsNotification, sendVoiceNotification, notifyOnCall };
