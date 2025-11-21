import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings
import os
import numpy as np

warnings.filterwarnings("ignore")

# --- 1. Define File Paths and Load Data ---
DATA_DIR = '../data'
try:
    # Load the necessary raw data file (Austin_Animal_Center_Outcomes.csv)
    outcomes_df = pd.read_csv(os.path.join(DATA_DIR, r'D:\5sem\mini\data\Austin_Animal_Center_Outcomes.csv'))
    
    # Load the forecast and hotspot data
    forecast_df = pd.read_csv(os.path.join(DATA_DIR, r'D:\5sem\mini\data\forecast_results.csv'))
    hotspot_clusters_df = pd.read_csv(os.path.join(DATA_DIR, r'D:\5sem\mini\data\hotspot_clusters.csv'))
except FileNotFoundError as e:
    print(f"Error loading data: {e}. Please ensure all result files are in the 'data/' directory.")
    exit()

# --- 2. Feature Engineering for Heatmap (Fix for the error) ---
# Create the 'Season' column
outcomes_df['DateTime'] = pd.to_datetime(outcomes_df['DateTime'])
outcomes_df['Month'] = outcomes_df['DateTime'].dt.month
def get_season(month):
    if month in [3, 4, 5]: return 'Spring'
    if month in [6, 7, 8]: return 'Summer'
    if month in [9, 10, 11]: return 'Fall'
    return 'Winter'
outcomes_df['predicted_season'] = outcomes_df['Month'].apply(get_season) # Changed column name to predicted_season

# Create the 'Reduced_Breed' column
TOP_N_BREEDS = 50 
common_breeds = outcomes_df['Breed'].value_counts().nlargest(TOP_N_BREEDS).index
outcomes_df['reduced_breed'] = np.where(
    outcomes_df['Breed'].isin(common_breeds),
    outcomes_df['Breed'],
    'Rare_Breed'
)


# --- 3. Interactive Pie Chart: Overall Adoption Outcome ---
if 'Outcome Type' in outcomes_df.columns:
    outcome_counts = outcomes_df['Outcome Type'].value_counts().reset_index()
    outcome_counts.columns = ['Outcome', 'Count']
    fig_outcome_pie = px.pie(outcome_counts, names='Outcome', values='Count',
                             title='<span style="font-size: 24px; color: #4c4c4c;"><b>Overall Animal Outcomes</b></span>',
                             color_discrete_sequence=px.colors.qualitative.Set3)
    fig_outcome_pie.update_traces(textinfo='percent+label', pull=[0.1, 0, 0, 0, 0])
    fig_outcome_pie.update_layout(uniformtext_minsize=12, uniformtext_mode='hide')
    fig_outcome_pie.write_html(os.path.join(DATA_DIR, 'overall_outcomes_pie.html'))
    print("Interactive Pie Chart (Overall Outcomes) saved to ../data/overall_outcomes_pie.html")
else:
    print("Error: 'Outcome Type' column not found in processed_outcomes.csv.")


# --- 4. Interactive Heat Map: Adoption Rate by Reduced Breed and Season ---
if 'reduced_breed' in outcomes_df.columns and 'predicted_season' in outcomes_df.columns:
    outcomes_df['is_adopted'] = outcomes_df['Outcome Type'].apply(
        lambda x: 1 if x == 'Adoption' else 0)
    
    heatmap_data = outcomes_df.groupby(['reduced_breed', 'predicted_season'])['is_adopted'].mean().unstack(fill_value=0)
    
    fig_adoption_heatmap = px.imshow(heatmap_data,
                                     color_continuous_scale=px.colors.sequential.Viridis,
                                     title='<span style="font-size: 24px; color: #4c4c4c;"><b>Adoption Rate (%) by Breed Group & Season</b></span>',
                                     labels=dict(x="Season", y="Breed Group", color="Adoption Rate (%)"))
    fig_adoption_heatmap.update_layout(height=600)
    fig_adoption_heatmap.write_html(os.path.join(DATA_DIR, 'adoption_rate_heatmap.html'))
    print("Interactive Heat Map (Adoption Rate by Breed & Season) saved to ../data/adoption_rate_heatmap.html")
else:
    print("Error: Required columns for Heatmap visualization not found in data.")


# --- 5. Plot Prophet Forecast ---
if 'ds' in forecast_df.columns and 'yhat' in forecast_df.columns:
    fig_forecast = go.Figure()
    fig_forecast.add_trace(go.Scatter(x=forecast_df['ds'], y=forecast_df['yhat'], mode='lines', name='Forecast'))
    fig_forecast.add_trace(go.Scatter(x=forecast_df['ds'], y=forecast_df['yhat_upper'], mode='lines', line=dict(color='rgba(0,0,0,0)'), name='Upper Bound', showlegend=False))
    fig_forecast.add_trace(go.Scatter(x=forecast_df['ds'], y=forecast_df['yhat_lower'], mode='lines', line=dict(color='rgba(0,0,0,0)'), name='Lower Bound', fill='tonexty', fillcolor='rgba(0,0,0,0.2)', showlegend=False))
    if 'y' in forecast_df.columns:
        fig_forecast.add_trace(go.Scatter(x=forecast_df['ds'], y=forecast_df['y'], mode='markers', name='Actual Adoptions'))
    
    fig_forecast.update_layout(title='<span style="font-size: 24px; color: #4c4c4c;"><b>Future Adoption Trend Forecast</b></span>',
                               xaxis_title='Date',
                               yaxis_title='Number of Adoptions')
    fig_forecast.write_html(os.path.join(DATA_DIR, 'adoption_forecast.html'))
    print("Interactive Forecast Plot saved to ../data/adoption_forecast.html")
else:
    print("Error: Required columns for Forecast Plot visualization not found in forecast_results.csv.")


# --- 6. Display Hotspot Cluster Analysis ---
if not hotspot_clusters_df.empty:
    fig_hotspots_table = go.Figure(data=[go.Table(
        header=dict(values=hotspot_clusters_df.columns,
                    fill_color='#D2E4FC',
                    align='left'),
        cells=dict(values=[hotspot_clusters_df['Cluster_ID'], hotspot_clusters_df['Count'], hotspot_clusters_df['Avg_Age'],
                           hotspot_clusters_df['Most_Common_Type'], hotspot_clusters_df['Most_Common_Breed'],
                           hotspot_clusters_df['Most_Common_Season'], hotspot_clusters_df['Percentage'].round(1)],
                    fill_color='#F0F8FF',
                    align='left'))
    ])
    fig_hotspots_table.update_layout(title='<span style="font-size: 24px; color: #4c4c4c;"><b>Key Hotspots of Low-Adoption Animals</b></span>')
    fig_hotspots_table.write_html(os.path.join(DATA_DIR, 'hotspot_analysis_table.html'))
    print("Interactive Hotspot Analysis Table saved to ../data/hotspot_analysis_table.html")
else:
    print("Error: Hotspot clusters data not available or empty.")


print("\nInteractive Visualizations Generated Successfully!")
print(f"You can find the HTML files in the '{DATA_DIR}' directory.")