# SmartPaws

SmartPaws is a multi-service project for animal-shelter analytics and adoption forecasting. It combines a React frontend, a Node/TypeScript API gateway, and a Python ML service to produce forecasts, cluster hotspots, and serve analytics to adopters and administrators.

**Quick Overview**
- **Frontend(s):** `code/SmartPaws/apps/adopter-frontend` and `code/SmartPaws/apps/admin-dashboard` (React + Tailwind)
- **API Gateway:** `code/SmartPaws/apps/api-gateway` (Node + TypeScript)
- **ML Service:** `code/SmartPaws/ml-service` (Python scripts and trained models)
- **Data:** sample and processed datasets live in `data/` and `code/SmartPaws/data/`.

**Prerequisites**
- Git
- Node.js (16+) and npm/yarn
- Python 3.9+ (virtualenv recommended)
- Docker & docker-compose (optional)

**Local setup (summary)**
1. Clone repository:
   ```powershell
   git clone https://github.com/AnushkaHiremath13/SmartPaws.git
   cd SmartPaws
   ```
2. Frontend (adopter frontend example):
   ```powershell
   Set-Location code/SmartPaws/apps/adopter-frontend
   npm install
   npm run dev
   ```
3. API gateway:
   ```powershell
   Set-Location ../../apps/api-gateway
   npm install
   npm run build   # if present
   npm start
   ```
4. ML service (Python):
   ```powershell
   Set-Location ../../../../ml-service
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python src/main.py
   ```

**Run all services with Docker Compose**
From repository root:
```powershell
docker-compose up --build
```


**Contributing**
- Create a topic branch: `git checkout -b feat/your-feature`
- Write focused commits and open a Pull Request against `main`.

**Maintainer / Contact**
- Owner: `AnushkaHiremath13`

If you want, I can expand this README with an environment variables section, run scripts, or add `CONTRIBUTING.md` and CI configuration files.
