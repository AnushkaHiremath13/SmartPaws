import pandas as pd
from prophet import Prophet
import joblib 
import os

# --- 1. Define File Paths ---
# The correct relative path to go up one directory and into the data folder
DATA_PATH = r'D:\5sem\mini\ml_scripts\data\prophet_training_data.csv'
MODEL_PATH = '../models/prophet_model.pkl'
FORECAST_PATH = '../data/forecast_results.csv'
FORECAST_PERIODS = 180 # Forecast 6 months

print("Starting SmartPaws Prophet Model Training...")

# --- 2. Load and Prepare Clean Data ---
try:
    df_prophet = pd.read_csv(DATA_PATH)
    df_prophet['ds'] = pd.to_datetime(df_prophet['ds'])
    print(f"Data loaded successfully. Total data points: {df_prophet.shape[0]}")
except FileNotFoundError:
    print(f"ERROR: Data file not found at {DATA_PATH}. Please ensure the data preparation step was run successfully.")
    exit()


# --- 3. Train the Prophet Model ---
print("Training model...")
model = Prophet(
    weekly_seasonality=True,
    yearly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode='multiplicative' # Use multiplicative for seasonal growth
)
model.fit(df_prophet)
print("Model training complete.")


# --- 4. Save the Trained Model ---
try:
    os.makedirs('../models', exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Trained Prophet model saved to {MODEL_PATH}")
except Exception as e:
    print(f"ERROR: Could not save model. Error: {e}")


# --- 5. Generate and Save Forecast for Dashboard ---
print(f"Generating {FORECAST_PERIODS} day forecast...")

# Create future dates and predict
future = model.make_future_dataframe(periods=FORECAST_PERIODS, include_history=False) 
forecast = model.predict(future)

# Save the necessary forecast results for the dashboard
forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_csv(
    FORECAST_PATH, index=False)
print(f"Forecast results saved to {FORECAST_PATH}")

print("\nAdoption Trend Forecasting feature complete.")