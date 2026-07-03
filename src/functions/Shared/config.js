function getConfig() {
  return {
    azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    acsConnectionString: process.env.ACS_CONNECTION_STRING,
    acsSenderEmail: process.env.ACS_SENDER_EMAIL,
    acsSenderPhoneNumber: process.env.ACS_SENDER_PHONE_NUMBER,
    onCallEmail: process.env.ONCALL_EMAIL,
    onCallPhoneNumber: process.env.ONCALL_PHONE_NUMBER,
    callEventsCallbackUrl: process.env.CALL_EVENTS_CALLBACK_URL,
    approvalBaseUrl: process.env.APPROVAL_BASE_URL,
  };
}

module.exports = { getConfig };
