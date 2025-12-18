# PowerShell script to remove dark mode classes from all TSX files

$files = @(
    "app\page.tsx",
    "app\dashboard\page.tsx",
    "app\dashboard\layout.tsx",
    "app\dashboard\permissions\page.tsx",
    "app\dashboard\roles\page.tsx",
    "app\dashboard\users\page.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Remove dark: prefixed classes
        $content = $content -replace ' dark:[a-z0-9\-\/\[\]\:\(\)]+', ''
        
        Set-Content $fullPath $content -NoNewline
        Write-Host "Processed: $file"
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nDark mode classes removed successfully!" -ForegroundColor Green
