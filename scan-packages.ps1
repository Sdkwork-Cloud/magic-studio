# Scan all sdkwork-react-* packages for self-imports and circular exports
$packagesDir = "packages"
$results = @()

Get-ChildItem -Path $packagesDir -Directory | Where-Object { $_.Name -like "sdkwork-react-*" } | ForEach-Object {
    $packageName = $_.Name
    $packagePath = $_.FullName
    $moduleName = $packageName -replace "sdkwork-react-", ""
    
    Write-Host "Scanning $packageName..." -ForegroundColor Yellow
    
    # Check src directory
    $srcPath = Join-Path $packagePath "src"
    if (Test-Path $srcPath) {
        # Search for self-imports in .ts and .tsx files
        $selfImports = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts","*.tsx" | 
            Select-String -Pattern "from\s+['""]$packageName" -AllMatches
        
        if ($selfImports) {
            $results += [PSCustomObject]@{
                Package = $packageName
                Issue = "Self-import detected"
                Files = ($selfImports | ForEach-Object { $_.Path.Replace($packagePath, "") }) -join "; "
                Count = $selfImports.Count
            }
            Write-Host "  Found $($selfImports.Count) self-import(s)" -ForegroundColor Red
        }
        
        # Also check for imports using the module name pattern
        $moduleImports = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts","*.tsx" | 
            Select-String -Pattern "from\s+['""]\.*/$moduleName" -AllMatches
            
        if ($moduleImports) {
            $results += [PSCustomObject]@{
                Package = $packageName
                Issue = "Potential circular import (module pattern)"
                Files = ($moduleImports | ForEach-Object { $_.Path.Replace($packagePath, "") }) -join "; "
                Count = $moduleImports.Count
            }
            Write-Host "  Found $($moduleImports.Count) potential circular import(s)" -ForegroundColor Yellow
        }
    }
}

if ($results.Count -eq 0) {
    Write-Host "No self-import or circular export issues found!" -ForegroundColor Green
} else {
    Write-Host "`nSummary of issues found:" -ForegroundColor Red
    $results | Format-Table -AutoSize
}