# 🚀 Coffee Hub - Startup Guide

## 📋 Available Scripts

### 1️⃣ **start-backend-only.ps1** - Backend Only
Starts backend with x64 Node.js for ARM64 compatibility

```powershell
.\start-backend-only.ps1
```

**Features:**
- ✅ Stops old backend processes
- ✅ Checks x64 Node.js installation
- ✅ Fixes .env conflicts
- ✅ Regenerates Prisma Client
- ✅ Starts Backend on port 3001
- ✅ Tests API endpoints

**Startup time:** ~30 seconds

---

### 2️⃣ **start-frontend-only.ps1** - Frontend Only
Starts frontend with backend validation

```powershell
.\start-frontend-only.ps1
```

**Features:**
- ✅ Checks if backend is running
- ✅ Stops old frontend processes
- ✅ Starts Frontend on port 3000
- ⏱️ Waits 40 seconds for compilation

**Important:** Backend must be running first!

**Startup time:** ~40-60 seconds

---

### 3️⃣ **start-all.ps1** - Start Everything
Starts both backend and frontend simultaneously

```powershell
.\start-all.ps1
```

**Recommendation:** For stable operation, use separate scripts (1️⃣ + 2️⃣)

---

## 🎯 Recommended Startup Method

### Option A: Two Separate Scripts (Most Reliable)

```powershell
# Terminal 1 (PowerShell): Backend
.\start-backend-only.ps1

# Wait for "Backend started successfully!"

# Terminal 2 (PowerShell): Frontend  
.\start-frontend-only.ps1
```

### Option B: Backend Script + Manual Frontend

```powershell
# Terminal 1: Backend
.\start-backend-only.ps1

# Terminal 2: Frontend manually
cd frontend
npm run dev
```

---

## 📊 Status Check

### Check what's running:

```powershell
# Backend (should return True)
Test-NetConnection localhost -Port 3001 -InformationLevel Quiet

# Frontend (should return True)
Test-NetConnection localhost -Port 3000 -InformationLevel Quiet

# Test API
Invoke-RestMethod http://localhost:3001/locations
```

### Open in browser:

```
Backend API:  http://localhost:3001
Frontend App: http://localhost:3000
```

---

## 🛑 Stop Services

### Stop all Node.js processes:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Stop Backend only:

```powershell
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force
}
```

### Stop Frontend only:

```powershell
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force
}
```

---

## 🐛 Troubleshooting

### Backend won't start

1. Check x64 Node.js:
   ```powershell
   Test-Path "$env:USERPROFILE\nodejs-x64\node.exe"
   ```

2. Install x64 Node.js:
   ```powershell
   cd backend
   .\install-node-x64.ps1
   ```

3. Check `.env`:
   ```powershell
   Test-Path backend\.env
   ```

### Frontend won't start

1. Make sure backend is running:
   ```powershell
   Test-NetConnection localhost -Port 3001 -InformationLevel Quiet
   ```

2. Start frontend manually:
   ```powershell
   cd frontend
   npm run dev
   ```

3. Wait 1-2 minutes for Vite compilation

### "Port already in use" error

```powershell
# Find process on port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Stop process (replace PID)
Stop-Process -Id <PID> -Force
```

---

## 📚 Documentation

- **[docs/QUICKSTART.md](docs/QUICKSTART.md)** - Full installation guide
- **[docs/BUGS_HISTORY.md](docs/BUGS_HISTORY.md)** - Bug history and solutions
- **[README.md](README.md)** - General project information

---

## ⚡ Quick Cheat Sheet

```powershell
# ✅ START EVERYTHING (two terminals)
# Terminal 1:
.\start-backend-only.ps1

# Terminal 2:
.\start-frontend-only.ps1

# ✅ STOP EVERYTHING
Get-Process node | Stop-Process -Force

# ✅ CHECK STATUS
Test-NetConnection localhost -Port 3001 -InformationLevel Quiet
Test-NetConnection localhost -Port 3000 -InformationLevel Quiet

# ✅ OPEN IN BROWSER
start http://localhost:3000
```

---

**Version:** 1.0  
**Date:** December 8, 2025  
**Platform:** Windows ARM64 + x64 Node.js

