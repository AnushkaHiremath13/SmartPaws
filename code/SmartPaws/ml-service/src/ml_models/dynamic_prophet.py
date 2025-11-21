import pandas as pd
from prophet import Prophet
import joblib 
import os
import sys
from datetime import datetime

# Add the parent directory to the path to import database module
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from database import get_uploaded_data

def prepare_prophet_data(intake_df, outcome_df):
    """
    Prepare uploaded data for Prophet model training
    """
    print("🔄 Preparing data for Prophet model...")
    
    # Combine intake and outcome data for adoption trends
    all_data = []
    
    # Process outcome data for adoptions
    if not outcome_df.empty:
        # Standardize column names
        outcome_df_clean = outcome_df.copy()
        
        # Map various column name formats
        date_columns = ['datetime', 'DateTime', 'date', 'Date']
        outcome_columns = ['outcomeType', 'Outcome Type', 'outcome_type']
        
        date_col = None
        outcome_col = None
        
        for col in date_columns:
            if col in outcome_df_clean.columns:
                date_col = col
                break
        
        for col in outcome_columns:
            if col in outcome_df_clean.columns:
                outcome_col = col
                break
        
        if date_col and outcome_col:
            # Filter for adoptions
            adoptions = outcome_df_clean[outcome_df_clean[outcome_col].str.contains('Adopt', case=False, na=False)]
            
            if not adoptions.empty:
                adoptions['ds'] = pd.to_datetime(adoptions[date_col])
                adoptions['y'] = 1  # Each adoption counts as 1
                
                # Group by date and count adoptions
                adoption_counts = adoptions.groupby(adoptions['ds'].dt.date)['y'].sum().reset_index()
                adoption_counts['ds'] = pd.to_datetime(adoption_counts['ds'])
                all_data.append(adoption_counts)
    
    # Process intake data if available
    if not intake_df.empty:
        intake_df_clean = intake_df.copy()
        
        date_col = None
        for col in date_columns:
            if col in intake_df_clean.columns:
                date_col = col
                break
        
        if date_col:
            intake_df_clean['ds'] = pd.to_datetime(intake_df_clean[date_col])
            intake_df_clean['y'] = 1  # Each intake counts as 1
            
            # Group by date and count intakes
            intake_counts = intake_df_clean.groupby(intake_df_clean['ds'].dt.date)['y'].sum().reset_index()
            intake_counts['ds'] = pd.to_datetime(intake_counts['ds'])
            all_data.append(intake_counts)
    
    if not all_data:
        print("❌ No valid data found for Prophet training")
        return None
    
    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Group by date and sum all activities (adoptions + intakes)
    prophet_data = combined_df.groupby('ds')['y'].sum().reset_index()
    prophet_data = prophet_data.sort_values('ds')
    
    print(f"✅ Prepared {len(prophet_data)} data points for Prophet training")
    print(f"📅 Date range: {prophet_data['ds'].min()} to {prophet_data['ds'].max()}")
    
    return prophet_data

def train_dynamic_prophet_model():
    """
    Train Prophet model on uploaded data
    """
    print("🚀 Starting dynamic Prophet model training...")
    
    # Get uploaded data from database
    intake_df, outcome_df, has_data = get_uploaded_data()
    
    if not has_data:
        print("❌ No data found in database. Cannot train Prophet model.")
        return None, None
    
    # Prepare data for Prophet
    prophet_data = prepare_prophet_data(intake_df, outcome_df)
    
    if prophet_data is None or len(prophet_data) < 10:
        print("❌ Insufficient data for Prophet training (need at least 10 data points)")
        return None, None
    
    # Train Prophet model
    print("🔄 Training Prophet model...")
    model = Prophet(
        weekly_seasonality=True,
        yearly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode='multiplicative'
    )
    
    try:
        model.fit(prophet_data)
        print("✅ Prophet model training complete!")
        
        # Generate forecast
        future = model.make_future_dataframe(periods=180, include_history=False)
        forecast = model.predict(future)
        
        # Save model
        model_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(model_dir, 'prophet_model.pkl')
        
        joblib.dump(model, model_path)
        print(f"💾 Model saved to {model_path}")
        
        # Save forecast results
        data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
        os.makedirs(data_dir, exist_ok=True)
        forecast_path = os.path.join(data_dir, 'forecast_results.csv')
        
        forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_csv(forecast_path, index=False)
        print(f"📊 Forecast saved to {forecast_path}")
        
        return model, forecast
        
    except Exception as e:
        print(f"❌ Error training Prophet model: {e}")
        return None, None

def generate_fresh_forecast(model):
    """
    Generate fresh forecast using trained model
    """
    if model is None:
        return None
    
    try:
        future = model.make_future_dataframe(periods=180, include_history=False)
        forecast = model.predict(future)
        return forecast
    except Exception as e:
        print(f"❌ Error generating forecast: {e}")
        return None

if __name__ == "__main__":
    # Train model with uploaded data
    model, forecast = train_dynamic_prophet_model()
    
    if model and forecast is not None:
        print("🎉 Dynamic Prophet training completed successfully!")
        print(f"📈 Generated {len(forecast)} forecast points")
    else:
        print("❌ Dynamic Prophet training failed")
