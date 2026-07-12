param location string = resourceGroup().location
param appName string = 'yes4fashion'
param environment string = 'prod'

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: '${appName}-${environment}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

output staticWebAppName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
