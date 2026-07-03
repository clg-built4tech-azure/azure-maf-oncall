const { AzureOpenAI } = require("openai");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");
const { getConfig } = require("./config.js");

const API_VERSION = "2024-10-21";
const COGNITIVE_SERVICES_SCOPE = "https://cognitiveservices.azure.com/.default";

let client;

function getOpenAiClient() {
  if (client) {
    return client;
  }

  const { azureOpenAiEndpoint, azureOpenAiApiKey, azureOpenAiDeployment } = getConfig();
  if (!azureOpenAiEndpoint || !azureOpenAiDeployment) {
    throw new Error("AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT must be set");
  }

  client = azureOpenAiApiKey
    ? new AzureOpenAI({
        endpoint: azureOpenAiEndpoint,
        apiKey: azureOpenAiApiKey,
        apiVersion: API_VERSION,
        deployment: azureOpenAiDeployment,
      })
    : new AzureOpenAI({
        endpoint: azureOpenAiEndpoint,
        azureADTokenProvider: getBearerTokenProvider(new DefaultAzureCredential(), COGNITIVE_SERVICES_SCOPE),
        apiVersion: API_VERSION,
        deployment: azureOpenAiDeployment,
      });

  return client;
}

module.exports = { getOpenAiClient };
