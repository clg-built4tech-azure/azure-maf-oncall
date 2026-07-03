const { EmailClient } = require("@azure/communication-email");
const { SmsClient } = require("@azure/communication-sms");
const { CallAutomationClient } = require("@azure/communication-call-automation");
const { getConfig } = require("./config.js");

let emailClient;
let smsClient;
let callAutomationClient;

function requireConnectionString() {
  const { acsConnectionString } = getConfig();
  if (!acsConnectionString) {
    throw new Error("ACS_CONNECTION_STRING must be set");
  }
  return acsConnectionString;
}

function getEmailClient() {
  if (!emailClient) {
    emailClient = new EmailClient(requireConnectionString());
  }
  return emailClient;
}

function getSmsClient() {
  if (!smsClient) {
    smsClient = new SmsClient(requireConnectionString());
  }
  return smsClient;
}

function getCallAutomationClient() {
  if (!callAutomationClient) {
    callAutomationClient = new CallAutomationClient(requireConnectionString());
  }
  return callAutomationClient;
}

module.exports = { getEmailClient, getSmsClient, getCallAutomationClient };
