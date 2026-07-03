param location string = resourceGroup().location
param environment string

module acs 'modules/acs.bicep' = {
  name: 'acs-deploy'
  params: {
    name: 'acs-sre-notifier-${environment}'
  }
}

module ai 'modules/ai-foundry.bicep' = {
  name: 'ai-deploy'
  params: {
    name: 'aif-sre-interpreter-${environment}'
    location: location
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage-deploy'
  params: {
    name: 'stsreoncall${environment}'
    location: location
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-deploy'
  params: {
    name: 'appi-sre-oncall-${environment}'
    location: location
  }
}

module sreAgent 'modules/sre-agent.bicep' = {
  name: 'sre-agent-deploy'
  params: {
    name: 'egt-sre-agent-${environment}'
    location: location
  }
}

module functions 'modules/functions.bicep' = {
  name: 'functions-deploy'
  params: {
    appName: 'func-sre-interpreter-${environment}'
    location: location
    storageAccountName: storage.outputs.name
    acsConnectionString: acs.outputs.connectionString
    openAiEndpoint: ai.outputs.endpoint
    appInsightsConnectionString: monitoring.outputs.connectionString
  }
}

output functionAppName string = functions.outputs.appName
output sreAgentEventGridEndpoint string = sreAgent.outputs.endpoint
