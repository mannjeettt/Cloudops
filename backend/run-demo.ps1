$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "dev-jwt-secret" }
$env:DEMO_MODE = "true"
$env:PORT = if ($env:PORT) { $env:PORT } else { "3001" }

node dist/server.js
