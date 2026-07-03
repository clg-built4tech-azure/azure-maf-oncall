jest.mock("../src/functions/Shared/acsClients.js");
jest.mock("../src/functions/Shared/config.js");

const { getConfig } = require("../src/functions/Shared/config.js");
const { getEmailClient, getSmsClient, getCallAutomationClient } = require("../src/functions/Shared/acsClients.js");
const {
  sendEmailNotification,
  sendSmsNotification,
  sendVoiceNotification,
  notifyOnCall,
} = require("../src/functions/Shared/notify.js");

const interpretation = {
  findingId: "finding-1",
  title: "Test incident",
  summary: "Something broke.",
  severity: "medium",
  impact: "Minor.",
  actions: ["Check logs"],
  approvalLink: null,
};

function fakeContext() {
  return { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("sendEmailNotification", () => {
  test("skips when sender/recipient not configured", async () => {
    getConfig.mockReturnValue({});
    const context = fakeContext();

    await sendEmailNotification(interpretation, context);

    expect(context.warn).toHaveBeenCalled();
    expect(getEmailClient).not.toHaveBeenCalled();
  });

  test("sends via EmailClient when configured", async () => {
    getConfig.mockReturnValue({ acsSenderEmail: "sre@example.com", onCallEmail: "oncall@example.com" });
    const beginSend = jest.fn().mockResolvedValue({ pollUntilDone: jest.fn().mockResolvedValue(undefined) });
    getEmailClient.mockReturnValue({ beginSend });

    await sendEmailNotification(interpretation, fakeContext());

    expect(beginSend).toHaveBeenCalledWith(
      expect.objectContaining({
        senderAddress: "sre@example.com",
        recipients: { to: [{ address: "oncall@example.com" }] },
      }),
    );
  });
});

describe("sendSmsNotification", () => {
  test("skips when phone numbers not configured", async () => {
    getConfig.mockReturnValue({});
    await sendSmsNotification(interpretation, fakeContext());
    expect(getSmsClient).not.toHaveBeenCalled();
  });

  test("sends via SmsClient when configured", async () => {
    getConfig.mockReturnValue({ acsSenderPhoneNumber: "+15550000000", onCallPhoneNumber: "+15550000001" });
    const send = jest.fn().mockResolvedValue([{ successful: true }]);
    getSmsClient.mockReturnValue({ send });

    await sendSmsNotification(interpretation, fakeContext());

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "+15550000000", to: ["+15550000001"] }),
    );
  });
});

describe("sendVoiceNotification", () => {
  test("skips when callback URL not configured", async () => {
    getConfig.mockReturnValue({ acsSenderPhoneNumber: "+15550000000", onCallPhoneNumber: "+15550000001" });
    await sendVoiceNotification(interpretation, fakeContext());
    expect(getCallAutomationClient).not.toHaveBeenCalled();
  });

  test("creates outbound call when fully configured", async () => {
    getConfig.mockReturnValue({
      acsSenderPhoneNumber: "+15550000000",
      onCallPhoneNumber: "+15550000001",
      callEventsCallbackUrl: "https://example.com/api/call-events",
    });
    const createCall = jest.fn().mockResolvedValue({});
    getCallAutomationClient.mockReturnValue({ createCall });

    await sendVoiceNotification(interpretation, fakeContext());

    expect(createCall).toHaveBeenCalledWith(
      { targetParticipant: { phoneNumber: "+15550000001" } },
      "https://example.com/api/call-events",
      expect.objectContaining({ sourceCallIdNumber: { phoneNumber: "+15550000000" } }),
    );
  });
});

describe("notifyOnCall", () => {
  test("does not throw when at least one channel succeeds", async () => {
    getConfig.mockReturnValue({ acsSenderEmail: "sre@example.com", onCallEmail: "oncall@example.com" });
    getEmailClient.mockReturnValue({
      beginSend: jest.fn().mockResolvedValue({ pollUntilDone: jest.fn().mockResolvedValue(undefined) }),
    });

    await expect(notifyOnCall(interpretation, fakeContext())).resolves.toBeDefined();
  });

  test("throws when every channel fails or is unconfigured", async () => {
    getConfig.mockReturnValue({});

    await expect(notifyOnCall(interpretation, fakeContext())).rejects.toThrow(/All notification channels failed/);
  });
});
