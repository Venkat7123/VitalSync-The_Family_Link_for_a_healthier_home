# Azure App Service Kudu ZIP Deploy Script
# Deploys the JAR directly without the Maven plugin

$AppName     = "vitalsync-backend-h3d4h6c3acf2hdeu"
$ResourceGroup = "vitalsync"
$JarFile     = "target\vitalsync-0.0.1-SNAPSHOT.jar"
$ZipFile     = "target\deploy.zip"

Write-Host "`n=== VitalSync Azure Deploy ===" -ForegroundColor Cyan

# Step 1 – Pack the JAR into a ZIP expected by Kudu
Write-Host "`n[1/3] Creating deployment ZIP..." -ForegroundColor Yellow
if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }

# Kudu /api/zipdeploy expects the artifact at the root of the zip
Compress-Archive -Path $JarFile -DestinationPath $ZipFile -Force
Write-Host "      ZIP created: $ZipFile" -ForegroundColor Green

# Step 2 – Get publishing credentials via Azure CLI
Write-Host "`n[2/3] Fetching publish credentials from Azure..." -ForegroundColor Yellow
$creds = az webapp deployment list-publishing-credentials `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query "{user:publishingUserName, pass:publishingPassword}" `
    --output json | ConvertFrom-Json

if (-not $creds) {
    Write-Host "ERROR: Could not fetch publishing credentials." -ForegroundColor Red
    Write-Host "Make sure 'az' CLI is installed and you are logged in." -ForegroundColor Red
    exit 1
}

$user = $creds.user
$pass = $creds.pass
Write-Host "      Credentials fetched for user: $user" -ForegroundColor Green

# Step 3 – Deploy via Kudu REST API
Write-Host "`n[3/3] Uploading JAR to App Service via Kudu ZIP deploy..." -ForegroundColor Yellow
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$deployUrl  = "https://$AppName.scm.azurewebsites.net/api/zipdeploy"

$response = Invoke-RestMethod `
    -Uri $deployUrl `
    -Method Post `
    -Headers @{ Authorization = "Basic $base64Auth" } `
    -ContentType "application/zip" `
    -InFile (Resolve-Path $ZipFile).Path

Write-Host "`n=== DEPLOY COMPLETE ===" -ForegroundColor Green
Write-Host "App URL: https://$AppName.southeastasia-01.azurewebsites.net" -ForegroundColor Cyan
