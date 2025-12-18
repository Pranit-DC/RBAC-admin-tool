$body = @{
    email = "admin@rbac.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/signup' -Method Post -ContentType 'application/json' -Body $body
    Write-Host "SUCCESS:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" $_.ErrorDetails.Message
    }
}
