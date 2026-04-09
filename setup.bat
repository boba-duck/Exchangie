@echo off
REM Setup script for Windows

echo.
echo 🚀 Email Exchange Competitor - Setup Script
echo ===========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is required but not installed.
    exit /b 1
)
echo ✅ Node.js found

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is required but not installed.
    exit /b 1
)
echo ✅ npm found

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔐 Checking SSL certificates...
if not exist "deployment\docker\certs" (
    mkdir deployment\docker\certs
    cd deployment\docker\certs
    echo Generating self-signed certificates...
    REM Use PowerShell for certificate generation
    powershell -Command "New-SelfSignedCertificate -CertStoreLocation cert:\LocalMachine\My -DnsName mail.example.com -FriendlyName 'Email Server' -NotAfter (Get-Date).AddYears(1) | Export-PfxCertificate -FilePath server.pfx -Password (ConvertTo-SecureString -String 'password' -AsPlainText -Force)"
    cd ..\..\..
    echo ✅ Generated self-signed certificates
) else (
    echo ✅ SSL certificates found
)

echo.
echo ⚙️ Setting up environment...
if not exist ".env" (
    copy .env.example .env
    echo ✅ Created .env file ^(update with your settings^)
) else (
    echo ✅ .env file exists
)

echo.
echo 📁 Creating directories...
if not exist "logs" mkdir logs
if not exist "data\postgres" mkdir data\postgres
if not exist "data\redis" mkdir data\redis

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Edit .env with your configuration
echo 2. Run: npm run docker:build
echo 3. Run: npm run docker:up
echo 4. Access:
echo    - Webmail: http://localhost:3100
echo    - Admin: http://localhost:3200
echo.
