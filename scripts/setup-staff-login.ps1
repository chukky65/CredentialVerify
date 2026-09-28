param(
  [Parameter(Mandatory = $true)][string]$Email,
  [Parameter(Mandatory = $true)][string]$DisplayName,
  [Parameter(Mandatory = $true)][string]$StaffId
)
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$serverDirectory = Join-Path $projectDirectory 'server'
$tsxCommand = Join-Path $projectDirectory 'node_modules\.bin\tsx.cmd'
Write-Host "Create staff login for $DisplayName ($Email)"
Write-Host 'Choose a password with at least 12 characters. It will not be shown or saved in this script.'
$securePassword = Read-Host 'New password' -AsSecureString
$secureConfirmation = Read-Host 'Repeat password' -AsSecureString
$passwordPointer = [IntPtr]::Zero
$confirmationPointer = [IntPtr]::Zero
try {
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $confirmationPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConfirmation)
  $chosenPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $confirmedPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmationPointer)
  if ($chosenPassword.Length -lt 12) { throw 'Password must contain at least 12 characters. Run this command again.' }
  if ($chosenPassword -cne $confirmedPassword) { throw 'Passwords did not match. Run this command again.' }
  $env:STAFF_INITIAL_PASSWORD = $chosenPassword
  Push-Location -LiteralPath $serverDirectory
  try {
    & $tsxCommand 'src/provisionStaff.ts' $Email $DisplayName $StaffId 'VERIFICATION_ANALYST'
    if ($LASTEXITCODE -ne 0) { throw 'Account setup did not complete. Tell the assistant the error message, without your password.' }
    Write-Host "Setup complete. Sign in with $Email and your chosen password."
  } finally { Pop-Location }
} finally {
  Remove-Item Env:STAFF_INITIAL_PASSWORD -ErrorAction SilentlyContinue
  if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
  if ($confirmationPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmationPointer) }
  $chosenPassword = $null
  $confirmedPassword = $null
  $securePassword.Dispose()
  $secureConfirmation.Dispose()
}
