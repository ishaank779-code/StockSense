# StockSense — ML Market Analyzer

Educational research tool for historical stock analysis, trend detection and time-series price forecasting.

> **Disclaimer:** All forecasts are uncertain statistical estimates based on past data.  
> They are **not financial advice** and must never be used as buy/sell recommendations.  
> Past performance does not guarantee future results.

---

## Features

- **Historical price visualization** with SMA / RSI indicators  
- **ML forecasts** (XGBoost, ARIMA, Ensemble) with uncertainty bands  
- **Stock comparison** + correlation matrix  
- **Watchlists** (authenticated)  
- **Model performance dashboard** (MAE, RMSE, MAPE, direction accuracy)  
- Dark trading-style UI  

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Python 3.10+, FastAPI, SQLAlchemy               |
| Database  | MySQL (production) / SQLite (local demo)        |
| ML        | Pandas, Scikit-learn, XGBoost, Statsmodels      |
| Data      | yfinance                                        |
| Frontend  | React 18, Vite, Chart.js, React Router          |

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: copy .env.example → .env and set USE_SQLITE=false + MySQL URL
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 3. MySQL (optional)

```bash
# Using Docker
docker run -d --name stocksense-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=stocksense \
  -e MYSQL_USER=stocksense \
  -e MYSQL_PASSWORD=stocksense123 \
  -p 3306:3306 mysql:8

# Then in backend/.env:
USE_SQLITE=false
DATABASE_URL=mysql+pymysql://stocksense:stocksense123@localhost:3306/stocksense
```

## Project Structure

```
stocksense/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # config, db, security
│   │   ├── ml/           # XGBoost / ARIMA forecaster
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # stock data + forecast orchestration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── README.md
```

## Learn Machine Learning

Want to understand the models used here?

- [Machine Learning Training Course in Delhi](https://uncodemy.com/course/machine-learning-training-course-in-delhi)
- [Machine Learning Training Course in Noida](https://uncodemy.com/course/machine-learning-training-course-in-noida)

## License

MIT — for educational and research purposes.
