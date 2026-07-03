param name string
param location string = resourceGroup().location
param skuName string = 'S0'

resource aiFoundry 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: name
  location: location
  sku: {
    name: skuName
  }
  kind: 'AIServices'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: name
  }
}

output name string = aiFoundry.name
output endpoint string = aiFoundry.properties.endpoint
