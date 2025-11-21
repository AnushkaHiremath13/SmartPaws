@echo off
echo Starting SmartPaws Services...

echo Starting ML Service...
start "ML Service" cmd /k "cd ml-service && python src/main.py"

timeout /t 3 /nobreak > nul

echo Starting API Gateway...
start "API Gateway" cmd /k "cd apps\api-gateway && npm run dev"

timeout /t 5 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "cd apps\adopter-frontend && npm start"

echo All services started! Check the opened windows for any errors.
pause
