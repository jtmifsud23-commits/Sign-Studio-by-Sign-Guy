$ErrorActionPreference = 'Stop'
$previewRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://127.0.0.1:8780/?product=locker'
$listener = Get-NetTCPConnection -LocalPort 8780 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing
    if ($response.Content -notmatch 'assets/locker-sign/locker-sign-product') { throw 'Port 8780 is already used by another application.' }
    Write-Output $previewUrl
    exit
}
$pythonExecutable = (Get-Command python).Source
$previewArguments = @('-u', '-m', 'http.server', '8780', '--bind', '127.0.0.1', '--directory', ('"' + $previewRoot + '"'))
$process = Start-Process -FilePath $pythonExecutable -ArgumentList $previewArguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $previewRoot 'verification/local-preview-server.log') -RedirectStandardError (Join-Path $previewRoot 'verification/local-preview-server-errors.log')
Write-Output ('Local preview process: ' + $process.Id)
Write-Output $previewUrl
