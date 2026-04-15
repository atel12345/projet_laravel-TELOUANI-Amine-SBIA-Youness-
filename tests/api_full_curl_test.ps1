$ErrorActionPreference = 'Continue'
Set-Location "C:\Users\HH\Desktop\ENSAM\s2\Backend\Projet Laravel\Projet_Laravel"

$base = 'http://127.0.0.1:8000/api'
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$reportPath = "tests/api_full_curl_report_$ts.txt"
$sb = New-Object System.Text.StringBuilder
$step = 0
$fails = New-Object System.Collections.Generic.List[string]

function Format-Arg([string]$arg) {
    if ($arg -match '[\s{}":,]') {
        return '"' + ($arg -replace '"', '\"') + '"'
    }
    return $arg
}

function Get-Body([string]$responseText) {
    $parts = $responseText -split "`r?`n`r?`n", 2
    if ($parts.Count -ge 2) { return $parts[1] }
    return ''
}

function Invoke-Step {
    param(
        [string]$Title,
        [string[]]$CurlArgs,
        [int[]]$Expected
    )

    $script:step++
    $cmd = 'curl.exe ' + (($CurlArgs | ForEach-Object { Format-Arg $_ }) -join ' ')
    $response = (cmd /c $cmd 2>&1 | Out-String).TrimEnd()
    $firstLine = ($response -split "`r?`n")[0]
    $status = $null
    if ($firstLine -match 'HTTP/\d\.\d\s+(\d{3})') {
        $status = [int]$Matches[1]
    }

    $ok = $true
    if ($Expected -and $Expected.Count -gt 0) {
        $ok = $Expected -contains $status
    }

    if (-not $ok) {
        $fails.Add("Step $step [$Title] expected $($Expected -join ',') got $status")
    }

    [void]$sb.AppendLine("===== STEP ${step}: $Title =====")
    [void]$sb.AppendLine('COMMAND:')
    [void]$sb.AppendLine($cmd)
    [void]$sb.AppendLine('RESPONSE:')
    [void]$sb.AppendLine($response)
    [void]$sb.AppendLine("RESULT: " + ($(if ($ok) { 'PASS' } else { 'FAIL' })))
    [void]$sb.AppendLine('')

    return [PSCustomObject]@{
        Status = $status
        Response = $response
        Body = (Get-Body $response)
        Ok = $ok
    }
}

$rInvalid = Invoke-Step -Title 'Invalid token /me' -CurlArgs @('-sS','-i','-H','Accept: application/json','-H','Authorization: Bearer invalidtoken',"$base/me") -Expected @(401)

$candEmail = "cand_$ts@example.com"
$recEmail = "rec_$ts@example.com"
$adminEmail = "admin_$ts@example.com"
$pwd = 'password123'

$candRegBody = '{"name":"Candidat Test","email":"' + $candEmail + '","password":"' + $pwd + '","role":"candidat"}'
$recRegBody = '{"name":"Recruteur Test","email":"' + $recEmail + '","password":"' + $pwd + '","role":"recruteur"}'
$adminRegBody = '{"name":"Admin Test","email":"' + $adminEmail + '","password":"' + $pwd + '","role":"admin"}'
$delRegBody = '{"name":"Delete Me","email":"del_' + $ts + '@example.com","password":"' + $pwd + '","role":"candidat"}'

$rCandReg = Invoke-Step -Title 'POST /register candidat' -CurlArgs @('-sS','-i','-X','POST',"$base/register",'-H','Content-Type: application/json','-d',$candRegBody) -Expected @(201)
$rRecReg = Invoke-Step -Title 'POST /register recruteur' -CurlArgs @('-sS','-i','-X','POST',"$base/register",'-H','Content-Type: application/json','-d',$recRegBody) -Expected @(201)
$rAdminReg = Invoke-Step -Title 'POST /register admin' -CurlArgs @('-sS','-i','-X','POST',"$base/register",'-H','Content-Type: application/json','-d',$adminRegBody) -Expected @(201)
$rDelReg = Invoke-Step -Title 'POST /register deletable user' -CurlArgs @('-sS','-i','-X','POST',"$base/register",'-H','Content-Type: application/json','-d',$delRegBody) -Expected @(201)

$delUserId = $null
try { $delUserId = ((ConvertFrom-Json $rDelReg.Body).user.id) } catch {}

$candLoginBody = '{"email":"' + $candEmail + '","password":"' + $pwd + '"}'
$recLoginBody = '{"email":"' + $recEmail + '","password":"' + $pwd + '"}'
$adminLoginBody = '{"email":"' + $adminEmail + '","password":"' + $pwd + '"}'

$rCandLogin = Invoke-Step -Title 'POST /login candidat' -CurlArgs @('-sS','-i','-X','POST',"$base/login",'-H','Content-Type: application/json','-d',$candLoginBody) -Expected @(200)
$rRecLogin = Invoke-Step -Title 'POST /login recruteur' -CurlArgs @('-sS','-i','-X','POST',"$base/login",'-H','Content-Type: application/json','-d',$recLoginBody) -Expected @(200)
$rAdminLogin = Invoke-Step -Title 'POST /login admin' -CurlArgs @('-sS','-i','-X','POST',"$base/login",'-H','Content-Type: application/json','-d',$adminLoginBody) -Expected @(200)

$candToken = $null
$recToken = $null
$adminToken = $null
try { $candToken = (ConvertFrom-Json $rCandLogin.Body).token } catch {}
try { $recToken = (ConvertFrom-Json $rRecLogin.Body).token } catch {}
try { $adminToken = (ConvertFrom-Json $rAdminLogin.Body).token } catch {}

$rCandMe = Invoke-Step -Title 'GET /me as candidat' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $candToken", "$base/me") -Expected @(200)
$rRecMe = Invoke-Step -Title 'GET /me as recruteur' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $recToken", "$base/me") -Expected @(200)
$rAdminMe = Invoke-Step -Title 'GET /me as admin' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $adminToken", "$base/me") -Expected @(200)

$rOffresList = Invoke-Step -Title 'GET /offres as candidat' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $candToken", "$base/offres") -Expected @(200)
$offreId = $null
try { $offreId = ((ConvertFrom-Json $rOffresList.Body).data[0].id) } catch {}
if (-not $offreId) { $offreId = 1 }

$rOffreShow = Invoke-Step -Title 'GET /offres/{offre} as candidat' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $candToken", "$base/offres/$offreId") -Expected @(200)

$profilCreateBody = '{"titre":"Developpeur Backend","bio":"Bio test","localisation":"Casablanca","disponible":true}'
$rProfilCreate = Invoke-Step -Title 'POST /profil as candidat' -CurlArgs @('-sS','-i','-X','POST',"$base/profil",'-H',"Authorization: Bearer $candToken",'-H','Content-Type: application/json','-d',$profilCreateBody) -Expected @(201,422)
$rProfilGet = Invoke-Step -Title 'GET /profil as candidat' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $candToken", "$base/profil") -Expected @(200)
$profilUpdateBody = '{"bio":"Bio mise a jour","localisation":"Rabat","disponible":false}'
$rProfilUpdate = Invoke-Step -Title 'PUT /profil as candidat' -CurlArgs @('-sS','-i','-X','PUT',"$base/profil",'-H',"Authorization: Bearer $candToken",'-H','Content-Type: application/json','-d',$profilUpdateBody) -Expected @(200)

$addCompBody = '{"competence_id":1,"niveau":"expert"}'
$rCompAdd = Invoke-Step -Title 'POST /profil/competences as candidat' -CurlArgs @('-sS','-i','-X','POST',"$base/profil/competences",'-H',"Authorization: Bearer $candToken",'-H','Content-Type: application/json','-d',$addCompBody) -Expected @(200,422)
$rCompDel = Invoke-Step -Title 'DELETE /profil/competences/{competence} as candidat' -CurlArgs @('-sS','-i','-X','DELETE',"$base/profil/competences/1",'-H',"Authorization: Bearer $candToken") -Expected @(200)

$applyBody = '{"message":"Je postule a cette offre"}'
$rApplySeeded = Invoke-Step -Title 'POST /offres/{offre}/candidater on seeded offer' -CurlArgs @('-sS','-i','-X','POST',"$base/offres/$offreId/candidater",'-H',"Authorization: Bearer $candToken",'-H','Content-Type: application/json','-d',$applyBody) -Expected @(201,422)

$createOffreBody = '{"titre":"Offre API Test","description":"Description API","localisation":"Marrakech","type":"CDI"}'
$rCreateOffre = Invoke-Step -Title 'POST /offres as recruteur' -CurlArgs @('-sS','-i','-X','POST',"$base/offres",'-H',"Authorization: Bearer $recToken",'-H','Content-Type: application/json','-d',$createOffreBody) -Expected @(201)
$recruiterOffreId = $null
try { $recruiterOffreId = (ConvertFrom-Json $rCreateOffre.Body).id } catch {}
if (-not $recruiterOffreId) { $recruiterOffreId = $offreId }

$updateOffreBody = '{"titre":"Offre API Modifiee","type":"CDD"}'
$rUpdateOffre = Invoke-Step -Title 'PUT /offres/{offre} as owner recruteur' -CurlArgs @('-sS','-i','-X','PUT',"$base/offres/$recruiterOffreId",'-H',"Authorization: Bearer $recToken",'-H','Content-Type: application/json','-d',$updateOffreBody) -Expected @(200)

$rCandidateOnRecruiterOffre = Invoke-Step -Title 'POST /offres/{offre}/candidater on recruiter test offer' -CurlArgs @('-sS','-i','-X','POST',"$base/offres/$recruiterOffreId/candidater",'-H',"Authorization: Bearer $candToken",'-H','Content-Type: application/json','-d',$applyBody) -Expected @(201,422)
$rMesCands = Invoke-Step -Title 'GET /mes-candidatures as candidat' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $candToken", "$base/mes-candidatures") -Expected @(200)

$rRecCands = Invoke-Step -Title 'GET /offres/{offre}/candidatures as recruteur owner' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $recToken", "$base/offres/$recruiterOffreId/candidatures") -Expected @(200)
$candidatureId = $null
try { $candidatureId = (ConvertFrom-Json $rRecCands.Body)[0].id } catch {}
if (-not $candidatureId) {
    try { $candidatureId = (ConvertFrom-Json $rMesCands.Body)[0].id } catch {}
}
if (-not $candidatureId) { $candidatureId = 1 }

$statutBody = '{"statut":"acceptee"}'
$rUpdateStatut = Invoke-Step -Title 'PATCH /candidatures/{candidature}/statut as recruteur' -CurlArgs @('-sS','-i','-X','PATCH',"$base/candidatures/$candidatureId/statut",'-H',"Authorization: Bearer $recToken",'-H','Content-Type: application/json','-d',$statutBody) -Expected @(200,403)

$rDeleteOffre = Invoke-Step -Title 'DELETE /offres/{offre} as recruteur owner' -CurlArgs @('-sS','-i','-X','DELETE',"$base/offres/$recruiterOffreId",'-H',"Authorization: Bearer $recToken") -Expected @(200)

$rAdminUsers = Invoke-Step -Title 'GET /admin/users as admin' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $adminToken", "$base/admin/users") -Expected @(200)
$rToggleOffre = Invoke-Step -Title 'PATCH /admin/offres/{offre} as admin' -CurlArgs @('-sS','-i','-X','PATCH',"$base/admin/offres/$offreId",'-H',"Authorization: Bearer $adminToken") -Expected @(200)
$rDeleteUser = Invoke-Step -Title 'DELETE /admin/users/{user} as admin' -CurlArgs @('-sS','-i','-X','DELETE',"$base/admin/users/$delUserId",'-H',"Authorization: Bearer $adminToken") -Expected @(200)

$rForbiddenAdminByCand = Invoke-Step -Title 'GET /admin/users as candidat (forbidden)' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $candToken", "$base/admin/users") -Expected @(403)
$rForbiddenRecruiterByCand = Invoke-Step -Title 'POST /offres as candidat (forbidden)' -CurlArgs @('-sS','-i','-X','POST',"$base/offres",'-H',"Authorization: Bearer $candToken",'-H','Content-Type: application/json','-d',$createOffreBody) -Expected @(403)

$rLogoutCand = Invoke-Step -Title 'POST /logout as candidat' -CurlArgs @('-sS','-i','-X','POST',"$base/logout",'-H',"Authorization: Bearer $candToken") -Expected @(200)
$rLogoutRec = Invoke-Step -Title 'POST /logout as recruteur' -CurlArgs @('-sS','-i','-X','POST',"$base/logout",'-H',"Authorization: Bearer $recToken") -Expected @(200)
$rLogoutAdmin = Invoke-Step -Title 'POST /logout as admin' -CurlArgs @('-sS','-i','-X','POST',"$base/logout",'-H',"Authorization: Bearer $adminToken") -Expected @(200)

$rMeAfterLogout = Invoke-Step -Title 'GET /me with old candidat token after logout' -CurlArgs @('-sS','-i','-H',"Authorization: Bearer $candToken", "$base/me") -Expected @(401)

[void]$sb.AppendLine('===== SUMMARY =====')
[void]$sb.AppendLine("Total steps: $step")
[void]$sb.AppendLine("Failed steps: $($fails.Count)")
if ($fails.Count -gt 0) {
    [void]$sb.AppendLine('Failure details:')
    foreach ($f in $fails) { [void]$sb.AppendLine("- $f") }
}

$sb.ToString() | Set-Content -Path $reportPath -Encoding UTF8
Write-Output $reportPath

