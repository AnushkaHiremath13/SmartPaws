
# SmartPaws

SmartPaws is an interactive multi-service project for animal shelter analytics and adoption forecasting. It helps shelter staff and adopters by providing forecasting, hotspot analysis, and dashboards that visualize adoption trends and geographic hotspots.

Key services in this repository:

- Frontend: `code/SmartPaws/apps/adopter-frontend` (React + Tailwind) and `code/SmartPaws/apps/admin-dashboard` (admin UI)
- API Gateway: `code/SmartPaws/apps/api-gateway` (Node + TypeScript)
- ML Service: `code/SmartPaws/ml-service` (Python ML models, forecasting, clustering)
- Data: example and processed datasets live under `data/` and `code/SmartPaws/data/`

Why this project exists

This project demonstrates how to combine a small frontend, a backend API, and an ML microservice to provide actionable analytics for animal shelters: adoption forecasts, location-based hotspot detection, and dashboards for staff and adopters.

Features

- Adoption forecasting (time-series forecasting)
- Hotspot clustering and heatmap generation
- Adopter-facing dashboard with forecasts and search
- Admin dashboard for managing data and prompts
- File upload support for images and datasets (`uploads/`)
- ML scripts and models for training and inference

Prerequisites

- Node.js (16+) and npm or yarn
- Python 3.9+ and virtualenv (for the ML service)
- Git
- Docker & docker-compose (optional, for running services together)

Quick install

Clone the repository and change into it:

```powershell
git clone https://github.com/AnushkaHiremath13/SmartPaws.git
cd SmartPaws
```

Frontend (adopter app example):

```powershell
Set-Location code/SmartPaws/apps/adopter-frontend
npm install
npm run dev
```

API Gateway:

```powershell
Set-Location ../../apps/api-gateway
npm install
# build if project uses a TypeScript build step
npm run build
npm start
```

ML Service (Python):

```powershell
Set-Location ../../../../ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src/main.py
```

Run everything with Docker Compose (optional):

```powershell
docker-compose up --build
```

Environment variables

Create a `.env` in the relevant service directories (API & ML) with values similar to:

```text
# API / gateway
PORT=4000
DATABASE_URL=mongodb://<user>:<pass>@host:port/dbname
JWT_SECRET=your_jwt_secret

# ML service (if used)
ML_MODEL_PATH=./models/prophet_model.pkl
```

How it works (high level)

Backend (API Gateway):

- Express-style routes and controllers handle authentication, data queries, file uploads, and proxying ML requests.
- Mongoose models (or equivalent) represent intake/outcome records and user/admin accounts.
- File uploads are stored under `code/SmartPaws/apps/api-gateway/uploads/`.

Frontend:

- The adopter frontend provides dashboards, forecast visualizations, and search.
- The admin UI provides CRUD for data and content management.

ML Service:

- Python scripts prepare data, train time-series forecasting models, and generate hotspot clusters.
- The ML service exposes a minimal API or script entrypoint to run forecasts and export results to `data/`.


Useful commands

- Run the adopter frontend: `cd code/SmartPaws/apps/adopter-frontend && npm run dev`
- Run the API gateway: `cd code/SmartPaws/apps/api-gateway && npm start`
- Run the ML service: `cd ml-service && .\.venv\Scripts\Activate.ps1 && python src/main.py`
- Create a branch and push:

```powershell
git checkout -b feature/your-feature
git add . && git commit -m "Add feature"
git push -u origin feature/your-feature
```

Repository notes & git hygiene

- A large file was removed from history in this repository to keep it small and pushable to GitHub.
- Add these `.gitignore` entries to avoid committing sensitive or bulky files:

```text
data/mini/
*.zip
uploads/
.env
.venv/
```


Acknowledgments

- Built with Node.js, Express, React, MongoDB, and Python for ML.




