$ErrorActionPreference = 'Stop'
$previewRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://127.0.0.1:8782/?product=coaster'
$listener = Get-NetTCPConnection -LocalPort 8782 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $response = Invoke-WebRequest -Uri ($previewUrl + '&check=coaster') -UseBasicParsing
    if ($response.Content -notmatch 'coaster-local-1') { throw 'Port 8782 is already used by another application.' }
    Write-Output $previewUrl
    exit
}
$pythonExecutable = (Get-Command python).Source
$previewArguments = @('-u', '-m', 'http.server', '8782', '--bind', '127.0.0.1', '--directory', ('"' + $previewRoot + '"'))
$process = Start-Process -FilePath $pythonExecutable -ArgumentList $previewArguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $previewRoot 'verification/coaster-server.log') -RedirectStandardError (Join-Path $previewRoot 'verification/coaster-server-errors.log')
Write-Output ('Local preview process: ' + $process.Id)
Write-Output $previewUrl
