@echo off
echo Restarting Backend...
start cmd /k "dotnet run --project backend/backend.csproj"
echo Restarting Frontend...
cd frontend
start cmd /k "npm run dev"
echo Done.
