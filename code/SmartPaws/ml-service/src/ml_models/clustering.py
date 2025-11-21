import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
import os
import sys

# Add the parent directory to the path to import database module
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from database import get_uploaded_data

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def process_uploaded_data_for_clustering():
    """
    Load and process uploaded data from MongoDB for clustering analysis
    """
    print("Loading uploaded data from MongoDB...")
    
    # Get uploaded data from database
    intake_df, outcome_df, has_data = get_uploaded_data()
    
    if not has_data or outcome_df.empty:
        print("No outcome data found in database. Cannot perform clustering analysis.")
        return None
    
    print(f"Processing {len(outcome_df)} outcome records for clustering")
    
    # Prepare the outcome data for clustering (similar to original logic)
    df = outcome_df.copy()
    
    # Ensure required columns exist with fallback mapping
    column_mapping = {
        'datetime': ['DateTime', 'datetime', 'date'],
        'outcomeType': ['Outcome Type', 'outcomeType', 'outcome_type'],
        'animalType': ['Animal Type', 'animalType', 'animal_type'],
        'breed': ['Breed', 'breed'],
        'sexUponOutcome': ['Sex upon Outcome', 'sexUponOutcome', 'sex_upon_outcome'],
        'ageUponOutcome': ['Age upon Outcome', 'ageUponOutcome', 'age_upon_outcome']
    }
    
    # Standardize column names
    for standard_name, possible_names in column_mapping.items():
        for possible_name in possible_names:
            if possible_name in df.columns:
                df[standard_name] = df[possible_name]
                break
        
        # Set default if column not found
        if standard_name not in df.columns:
            if standard_name == 'datetime':
                df[standard_name] = pd.Timestamp.now()
            else:
                df[standard_name] = 'Unknown'
    
    return df

# --- 1. Load and Prepare Data ---
df = process_uploaded_data_for_clustering()

if df is None:
    print("No data available for clustering. Exiting...")
    exit()

# --- 2. Feature Engineering (Re-create necessary features) ---
# 2a. Season Creation
df['datetime'] = pd.to_datetime(df['datetime'])
df['Month'] = df['datetime'].dt.month

def get_season(month):
    if month in [3, 4, 5]: return 'Spring'
    if month in [6, 7, 8]: return 'Summer'
    if month in [9, 10, 11]: return 'Fall'
    return 'Winter'

df['Season'] = df['Month'].apply(get_season)

# 2b. Breed Reduction
TOP_N_BREEDS = 50 
common_breeds = df['breed'].value_counts().nlargest(TOP_N_BREEDS).index

df['Reduced_Breed'] = np.where(
    df['breed'].isin(common_breeds),
    df['breed'],
    'Rare_Breed'
)

# 2c. Age Conversion (Convert 'Age upon Outcome' to a numeric value in days)
# For simplicity, we'll skip the full conversion here, as it requires a lot of code,
# and instead use one-hot encoding on 'Animal Type', 'Reduced_Breed', and 'Season'. 
# In a full project, Age would be a critical numeric feature to scale.

# --- 3. Filter for Hotspots (Non-Adopted Animals) ---
# We focus ONLY on non-adopted outcomes to find 'hotspots' that are hard to place.
hotspot_df = df[df['outcomeType'] != 'Adoption'].copy()
print(f"Total non-adopted animals for clustering: {len(hotspot_df)}")

# Define features for clustering (using only categorical ones for now)
clustering_features = ['animalType', 'Reduced_Breed', 'Season', 'sexUponOutcome']

# One-Hot Encode the categorical features
X_clustered = pd.get_dummies(hotspot_df[clustering_features], drop_first=True)

# Scale the data (essential for K-Means distance calculations)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_clustered)

# --- 4. Determine Optimal Number of Clusters (Elbow Method) ---
# We look for the "elbow" point in the inertia plot.
inertia = []
K_range = range(2, 11)

print("Running Elbow Method (may take a moment)...")
for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    inertia.append(kmeans.inertia_)

# Based on typical shelter data, 4 or 5 clusters is often a reasonable starting point.
# You would visualize the plot to confirm K. Let's select K=5 as a reasonable default.
K_OPTIMAL = 5 
print(f"Selected K={K_OPTIMAL} clusters for analysis.")

# --- 5. Run K-Means Clustering ---
kmeans_final = KMeans(n_clusters=K_OPTIMAL, random_state=42, n_init=10)
hotspot_df['Cluster_ID'] = kmeans_final.fit_predict(X_scaled)

# --- 6. Hotspot Analysis and Saving Results ---

# Analyze the composition of each cluster:
print("\n--- Hotspot Cluster Analysis ---")

# Use available columns for aggregation
id_column = 'animalId' if 'animalId' in hotspot_df.columns else '_id'
age_column = 'ageUponOutcome' if 'ageUponOutcome' in hotspot_df.columns else 'ageUponOutcome'

cluster_analysis = hotspot_df.groupby('Cluster_ID').agg(
    Count=(id_column, 'count'),
    Avg_Age=(age_column, lambda x: x.mode().iloc[0] if not x.mode().empty else 'N/A'),
    Most_Common_Type=('animalType', lambda x: x.mode().iloc[0] if not x.mode().empty else 'Unknown'),
    Most_Common_Breed=('Reduced_Breed', lambda x: x.mode().iloc[0] if not x.mode().empty else 'Unknown'),
    Most_Common_Season=('Season', lambda x: x.mode().iloc[0] if not x.mode().empty else 'Unknown'),
).reset_index()

# Calculate the percentage of the non-adopted population each cluster represents
cluster_analysis['Percentage'] = (cluster_analysis['Count'] / len(hotspot_df)) * 100

# Get the directory of the output file
output_path = '../data/hotspot_clusters.csv'
output_dir = os.path.dirname(output_path)

# --- THE FIX ---
# Check if the directory exists, if not, create it
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Save the cluster analysis to CSV
cluster_analysis.to_csv(output_path, index=False)

print(f"\nHotspot Clustering Complete. Cluster details saved to: {output_path}")

print("\n--- Cluster Breakdown (Hotspots) ---")
try:
    print(cluster_analysis.to_markdown(index=False, floatfmt=".1f"))
except ImportError:
    print("Tabulate not available, showing basic table:")
    print(cluster_analysis.to_string(index=False))