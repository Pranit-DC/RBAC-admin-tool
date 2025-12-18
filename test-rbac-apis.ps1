# RBAC API Test Suite
Write-Host "=== RBAC API Testing ===" -ForegroundColor Cyan

# 1. Create Permissions
Write-Host ""
Write-Host "1. Creating Permissions..." -ForegroundColor Yellow
$perms = @(
    @{name="users.read"; description="View users"},
    @{name="users.write"; description="Create/update users"},
    @{name="users.delete"; description="Delete users"},
    @{name="roles.manage"; description="Manage roles"}
)

$permIds = @()
foreach ($perm in $perms) {
    $body = $perm | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/permissions' -Method Post -ContentType 'application/json' -Body $body
        Write-Host "  OK Created: $($result.name)" -ForegroundColor Green
        $permIds += $result.id
    } catch {
        Write-Host "  FAIL: $($perm.name)" -ForegroundColor Red
    }
}

# 2. Get All Permissions
Write-Host ""
Write-Host "2. Getting All Permissions..." -ForegroundColor Yellow
$allPerms = Invoke-RestMethod -Uri 'http://localhost:3000/api/permissions' -Method Get
Write-Host "  OK Found $($allPerms.Count) permissions" -ForegroundColor Green

# 3. Create Roles
Write-Host ""
Write-Host "3. Creating Roles..." -ForegroundColor Yellow
$roles = @("Admin", "Editor", "Viewer")
$roleIds = @{}

foreach ($roleName in $roles) {
    $body = @{name=$roleName} | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/roles' -Method Post -ContentType 'application/json' -Body $body
        Write-Host "  OK Created: $($result.name)" -ForegroundColor Green
        $roleIds[$roleName] = $result.id
    } catch {
        Write-Host "  FAIL: $roleName" -ForegroundColor Red
    }
}

# 4. Get All Roles
Write-Host ""
Write-Host "4. Getting All Roles..." -ForegroundColor Yellow
$allRoles = Invoke-RestMethod -Uri 'http://localhost:3000/api/roles' -Method Get
Write-Host "  OK Found $($allRoles.Count) roles" -ForegroundColor Green

# 5. Assign Permissions to Admin Role
Write-Host ""
Write-Host "5. Assigning All Permissions to Admin Role..." -ForegroundColor Yellow
$body = @{permissionIds=$permIds} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/roles/$($roleIds['Admin'])/permissions" -Method Post -ContentType 'application/json' -Body $body
    Write-Host "  OK Assigned $($result.count) permissions to Admin" -ForegroundColor Green
} catch {
    Write-Host "  FAIL" -ForegroundColor Red
}

# 6. Assign Permissions to Editor Role (read + write only)
Write-Host ""
Write-Host "6. Assigning Read/Write Permissions to Editor Role..." -ForegroundColor Yellow
$editorPerms = $permIds[0..1]
$body = @{permissionIds=$editorPerms} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/roles/$($roleIds['Editor'])/permissions" -Method Post -ContentType 'application/json' -Body $body
    Write-Host "  OK Assigned $($result.count) permissions to Editor" -ForegroundColor Green
} catch {
    Write-Host "  FAIL" -ForegroundColor Red
}

# 7. Get All Users
Write-Host ""
Write-Host "7. Getting All Users..." -ForegroundColor Yellow
$allUsers = Invoke-RestMethod -Uri 'http://localhost:3000/api/users' -Method Get
Write-Host "  OK Found $($allUsers.Count) users" -ForegroundColor Green

# 8. Assign Admin Role to First User
if ($allUsers.Count -gt 0) {
    Write-Host ""
    Write-Host "8. Assigning Admin Role to User: $($allUsers[0].email)..." -ForegroundColor Yellow
    $body = @{roleIds=@($roleIds['Admin'])} | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/users/$($allUsers[0].id)/roles" -Method Post -ContentType 'application/json' -Body $body
        Write-Host "  OK Assigned $($result.count) roles" -ForegroundColor Green
    } catch {
        Write-Host "  FAIL" -ForegroundColor Red
    }

    # 9. Get User's Roles
    Write-Host ""
    Write-Host "9. Getting User's Roles..." -ForegroundColor Yellow
    $userRoles = Invoke-RestMethod -Uri "http://localhost:3000/api/users/$($allUsers[0].id)/roles" -Method Get
    Write-Host "  OK User has $($userRoles.Count) role(s)" -ForegroundColor Green
    foreach ($ur in $userRoles) {
        Write-Host "    - $($ur.role.name)" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
