param name string
param location string = resourceGroup().location

resource ingestTopic 'Microsoft.EventGrid/topics@2022-06-15' = {
  name: name
  location: location
  properties: {
    inputSchema: 'EventGridSchema'
  }
}

output name string = ingestTopic.name
output endpoint string = ingestTopic.properties.endpoint
