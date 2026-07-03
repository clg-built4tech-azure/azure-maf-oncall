param name string
param location string = 'global'
param dataLocation string = 'United States'

resource acs 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: name
  location: location
  properties: {
    dataLocation: dataLocation
  }
}

output name string = acs.name
output connectionString string = acs.listKeys().primaryConnectionString
