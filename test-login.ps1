$body = @{
    email = "admin@rbac.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
    Write-Host "SUCCESS:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host "`nCookie Set:" -ForegroundColor Cyan
    $response.Headers['Set-Cookie']
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" ($_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 3)
    }
}
