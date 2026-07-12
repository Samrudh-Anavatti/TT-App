param(
    [string]$ResourceGroup,
    [string]$Location,
    [string]$AppName,
    [string]$Environment
)

$ErrorActionPreference = "Stop"

Write-Host "=== Yes4Fashion - Static Website Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Load configuration from config.env
$configFile = Join-Path $PSScriptRoot "config.env"
if (!(Test-Path $configFile)) {
    Write-Error "Config file not found: $configFile`nPlease create config.env from config.env.template"
    exit 1
}

Write-Host "Loading configuration from config.env..." -ForegroundColor Yellow
$config = @{}
Get-Content $configFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        $config[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Override with script parameters if provided
if ($PSBoundParameters.ContainsKey('ResourceGroup')) { $config['RESOURCE_GROUP'] = $ResourceGroup }
if ($PSBoundParameters.ContainsKey('Location')) { $config['LOCATION'] = $Location }
if ($PSBoundParameters.ContainsKey('AppName')) { $config['APP_NAME'] = $AppName }
if ($PSBoundParameters.ContainsKey('Environment')) { $config['ENVIRONMENT'] = $Environment }

$ResourceGroup = $config['RESOURCE_GROUP']
$Location = $config['LOCATION']
$AppName = $config['APP_NAME']
$Environment = $config['ENVIRONMENT']

Write-Host "Configuration loaded:" -ForegroundColor Green
Write-Host "  Resource Group: $ResourceGroup"
Write-Host "  Location: $Location"
Write-Host "  App Name: $AppName"
Write-Host "  Environment: $Environment"
Write-Host ""

# Step 1: Create Resource Group
Write-Host "=== STEP 1: Create Resource Group ===" -ForegroundColor Green
az group create --name $ResourceGroup --location $Location

# Step 2: Deploy Infrastructure
Write-Host ""
Write-Host "=== STEP 2: Deploy Infrastructure ===" -ForegroundColor Green
$deploymentName = "yes4fashion-deploy-$(Get-Date -Format 'yyyyMMdd-HHmm')"
$infraDeployment = az deployment group create `
    --name $deploymentName `
    --resource-group $ResourceGroup `
    --template-file (Join-Path $PSScriptRoot "../infra/main.bicep") `
    --parameters `
        appName=$AppName `
        environment=$Environment `
        location=$Location `
    --mode Incremental `
    --output json | ConvertFrom-Json

if (!$infraDeployment -or $infraDeployment.properties.provisioningState -ne "Succeeded") {
    Write-Error "Infrastructure deployment failed. Please check the errors above."
    exit 1
}

$staticWebAppName = $infraDeployment.properties.outputs.staticWebAppName.value
$defaultHostname = $infraDeployment.properties.outputs.defaultHostname.value

Write-Host ""
Write-Host "Infrastructure Deployed:" -ForegroundColor Green
Write-Host "  Static Web App: $staticWebAppName"
Write-Host "  Hostname: $defaultHostname"

# Step 3: Build Frontend
Write-Host ""
Write-Host "=== STEP 3: Build Frontend ===" -ForegroundColor Green
Push-Location (Join-Path $PSScriptRoot "../frontend")

npm install
npm run build

Pop-Location

# Step 4: Deploy to Azure Static Web Apps
Write-Host ""
Write-Host "=== STEP 4: Deploy to Azure Static Web Apps ===" -ForegroundColor Green
$deployToken = (az staticwebapp secrets list --name $staticWebAppName --resource-group $ResourceGroup --query "properties.apiKey" --output tsv)
$distPath = Join-Path $PSScriptRoot "../frontend/dist"
npx --yes @azure/static-web-apps-cli deploy $distPath --deployment-token $deployToken --env production

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your website at: https://$defaultHostname" -ForegroundColor Cyan
Write-Host ""
Write-Host "Custom domain tip:" -ForegroundColor Yellow
Write-Host "  In Namecheap, add a CNAME record pointing your domain to: $defaultHostname"
Write-Host "  Then run: az staticwebapp hostname set --name $staticWebAppName --resource-group $ResourceGroup --hostname <your-domain>"
