# Bloom project completeness check
# Run from the project root:
#   powershell -ExecutionPolicy Bypass -File .\check_all.ps1
# Add -Full to also run npm lint and npm build (takes about a minute):
#   powershell -ExecutionPolicy Bypass -File .\check_all.ps1 -Full

param([switch]$Full)

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
Set-Location $root

$script:pass = 0
$script:fail = 0
$script:warn = 0

function Check($name, $ok, $detail) {
    if ($ok) {
        Write-Host ("[PASS] " + $name) -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host ("[FAIL] " + $name + "  -> " + $detail) -ForegroundColor Red
        $script:fail++
    }
}

function Warn($name, $detail) {
    Write-Host ("[WARN] " + $name + "  -> " + $detail) -ForegroundColor Yellow
    $script:warn++
}

$ml = Join-Path $root "backend\ml"
$fe = Join-Path $root "wellness-app\frontend"

Write-Host ""
Write-Host "== 1. Project files ==" -ForegroundColor Cyan
Check "README.md has content" ((Test-Path "$root\README.md") -and ((Get-Content "$root\README.md").Count -gt 30)) "README.md missing or empty"
Check "backend\requirements.txt has 8 packages" ((Test-Path "$root\backend\requirements.txt") -and ((Get-Content "$root\backend\requirements.txt").Count -eq 8)) "should list exactly 8 package names"
Check "backend\ml\requirements.txt has 7 pinned lines" ((Test-Path "$ml\requirements.txt") -and ((Get-Content "$ml\requirements.txt").Count -eq 7)) "should have 7 lines"
if (Test-Path "$ml\requirements.txt") {
    Check "scikit-learn pinned to 1.8.0" ([bool](Select-String -Path "$ml\requirements.txt" -Pattern "scikit-learn==1.8.0" -Quiet)) "add scikit-learn==1.8.0"
}

Write-Host ""
Write-Host "== 2. Dataset ==" -ForegroundColor Cyan
Check "data folder exists" (Test-Path "$ml\data") "backend\ml\data not found"
$cleanCsv = "$ml\data\sleep_clean.csv"
Check "sleep_clean.csv exists" (Test-Path $cleanCsv) "run clean_data.py"
if (Test-Path $cleanCsv) {
    $rows = @(Import-Csv $cleanCsv)
    Check "sleep_clean.csv has 132 rows" ($rows.Count -eq 132) ("found " + $rows.Count + " rows")
    $cols = $rows[0].PSObject.Properties.Name
    foreach ($c in @("Age","Sleep Duration","Physical Activity Level","Stress Level","Quality of Sleep")) {
        Check ("column present: " + $c) ($cols -contains $c) "column missing from sleep_clean.csv"
    }
}
Write-Host "Files in data folder:"
if (Test-Path "$ml\data") { Get-ChildItem "$ml\data" | ForEach-Object { Write-Host ("   " + $_.Name + "  (" + $_.Length + " bytes)") } }

Write-Host ""
Write-Host "== 3. ML scripts and saved model ==" -ForegroundColor Cyan
foreach ($f in @("inspect_data.py","clean_data.py","prepare_data.py","train_model.py","save_model.py","predict_test.py","predict_api.py")) {
    Check ("script exists: " + $f) (Test-Path "$ml\$f") "missing"
}
Check "sleep_model.joblib exists" (Test-Path "$ml\models\sleep_model.joblib") "run save_model.py"
Check "model_info.json exists" (Test-Path "$ml\models\model_info.json") "run save_model.py"
if (Test-Path "$ml\models\model_info.json") {
    try {
        $info = Get-Content "$ml\models\model_info.json" -Raw | ConvertFrom-Json
        Check "model_info.json is valid JSON" $true ""
    } catch {
        Check "model_info.json is valid JSON" $false "file is not valid JSON"
    }
}

Write-Host ""
Write-Host "== 4. Model reload test (predict_test.py) ==" -ForegroundColor Cyan
if (Test-Path "$ml\predict_test.py") {
    $out = & python "$ml\predict_test.py" 2>&1
    $code = $LASTEXITCODE
    Check "predict_test.py runs without error" ($code -eq 0) "exit code $code - see output below"
    if ($code -ne 0) { $out | Select-Object -Last 10 | ForEach-Object { Write-Host ("   " + $_) } }
}

Write-Host ""
Write-Host "== 5. ML API (port 8001) ==" -ForegroundColor Cyan
$apiUp = $false
try {
    $h = Invoke-RestMethod -Uri "http://127.0.0.1:8001/health" -TimeoutSec 5
    $apiUp = ($h.status -eq "ok")
} catch { }
if ($apiUp) {
    Check "/health returns ok" $true ""
    try {
        $body = '{"age":35,"sleep_duration":7,"physical_activity":60,"stress_level":4}'
        $p = Invoke-RestMethod -Uri "http://127.0.0.1:8001/predict" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10
        Check "/predict gives likely_good for sample input" ($p.prediction -eq "likely_good") ("got " + $p.prediction)
    } catch {
        Check "/predict accepts a valid request" $false "request failed"
    }
    try {
        $bad = '{"age":10,"sleep_duration":7,"physical_activity":60,"stress_level":4}'
        Invoke-RestMethod -Uri "http://127.0.0.1:8001/predict" -Method Post -ContentType "application/json" -Body $bad -TimeoutSec 10 | Out-Null
        Check "/predict rejects age 10 with 422" $false "it accepted an out-of-range value"
    } catch {
        $status = $null
        if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
        Check "/predict rejects age 10 with 422" ($status -eq 422) ("status was " + $status)
    }
} else {
    Warn "ML API not running" "start it in another terminal: python -m uvicorn predict_api:app --app-dir backend\ml --port 8001, then run this check again"
}

Write-Host ""
Write-Host "== 6. Frontend edits ==" -ForegroundColor Cyan
$track = "$fe\src\pages\Track.jsx"
$store = "$fe\src\lib\storage.js"
Check "Track.jsx exists" (Test-Path $track) "missing"
if (Test-Path $track) {
    Check "PredictCard present" ([bool](Select-String -Path $track -Pattern "function PredictCard" -Quiet)) "missing"
    Check "API address reads VITE_SLEEP_API" ([bool](Select-String -Path $track -Pattern "VITE_SLEEP_API" -Quiet)) "missing"
    Check "'what you logged' messages present" ([bool](Select-String -Path $track -Pattern "this needs" -Quiet)) "missing"
    Check "old typo 'Theestimate' gone" (-not (Select-String -Path $track -Pattern "Theestimate" -Quiet)) "still present"
    Check "old typo 'Makesure' gone" (-not (Select-String -Path $track -Pattern "Makesure" -Quiet)) "still present"
    Check "old typo 'items-endgap' gone" (-not (Select-String -Path $track -Pattern "items-endgap" -Quiet)) "still present"
}
if (Test-Path $store) {
    Check "storage.js has stress field" ([bool](Select-String -Path $store -Pattern "stress" -Quiet)) "emptyLog needs stress: null"
}
Check ".env exists with VITE_SLEEP_API" ((Test-Path "$fe\.env") -and [bool](Select-String -Path "$fe\.env" -Pattern "VITE_SLEEP_API=" -Quiet)) "create wellness-app\frontend\.env"

if ($Full) {
    Write-Host ""
    Write-Host "== 7. Lint and build (this takes a minute) ==" -ForegroundColor Cyan
    Push-Location $fe
    & npm run lint 2>&1 | Out-Null
    Check "npm run lint passes" ($LASTEXITCODE -eq 0) "run npm run lint to see the problems"
    & npm run build 2>&1 | Out-Null
    Check "npm run build passes" ($LASTEXITCODE -eq 0) "run npm run build to see the errors"
    Pop-Location
} else {
    Write-Host ""
    Write-Host "(Skipped lint and build. Add -Full to include them.)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "== Result ==" -ForegroundColor Cyan
Write-Host ("Passed: " + $script:pass + "   Failed: " + $script:fail + "   Warnings: " + $script:warn)
if ($script:fail -eq 0 -and $script:warn -eq 0) {
    Write-Host "Everything automatic is complete. Remaining by hand: phone-layout check and report wording." -ForegroundColor Green
} elseif ($script:fail -eq 0) {
    Write-Host "No failures. Clear the warnings above and run it again." -ForegroundColor Yellow
} else {
    Write-Host "Fix the FAIL lines above, then run it again." -ForegroundColor Red
}