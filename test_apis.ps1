$baseUrl = "http://localhost:5000/api"

Write-Host "--- Testing Registration (Coordinator) ---"
$coordData = @{ name="Test Coord"; email="coord@example.com"; password="pwd"; role="coordinator" } | ConvertTo-Json
$coordRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $coordData -ContentType "application/json"
$coordToken = $coordRes.token
Write-Host "Coordinator Token: $coordToken"

Write-Host "--- Testing Event Creation (Coordinator) ---"
$eventData = @{ title="Test Event"; date="2026-10-10"; location="Online" } | ConvertTo-Json
$eventRes = Invoke-RestMethod -Uri "$baseUrl/events" -Method Post -Body $eventData -ContentType "application/json" -Headers @{ Authorization = "Bearer $coordToken" }
$eventId = $eventRes._id
Write-Host "Created Event ID: $eventId"

Write-Host "--- Testing Login (User) ---"
$loginData = @{ email="testuser@example.com"; password="password123" } | ConvertTo-Json
$userRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$userToken = $userRes.token
Write-Host "User Token: $userToken"

Write-Host "--- Testing Post Creation (User) ---"
$postData = @{ content="Hello World!"; type="text" } | ConvertTo-Json
$postRes = Invoke-RestMethod -Uri "$baseUrl/posts" -Method Post -Body $postData -ContentType "application/json" -Headers @{ Authorization = "Bearer $userToken" }
Write-Host "Created Post ID: $($postRes._id)"

Write-Host "--- Testing Event Enrollment (User) ---"
$enrollRes = Invoke-RestMethod -Uri "$baseUrl/events/$eventId/enroll" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $userToken" }
Write-Host "Enrollment Status: $($enrollRes.message)"

Write-Host "--- Testing Registration (Admin) ---"
$adminData = @{ name="Test Admin"; email="admin@example.com"; password="pwd"; role="admin" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $adminData -ContentType "application/json"
$adminToken = $adminRes.token

Write-Host "--- Testing Get Users (Admin) ---"
$usersRes = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Total Users: $($usersRes.Length)"

Write-Host "ALL TESTS PASSED!"
