import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
import os # Import the os module

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# --- 1. Load and Prepare Data ---
try:
    # Use the same path as factor_analysis.py
    df = pd.read_csv(r'data/Austin_Animal_Center_Outcomes.csv')
except FileNotFoundError:
    print("FATAL ERROR: Data file not found.")
    exit()

# --- 2. Feature Engineering (Re-create necessary features) ---
# 2a. Season Creation
df['DateTime'] = pd.to_datetime(df['DateTime'])
df['Month'] = df['DateTime'].dt.month

def get_season(month):
    if month in [3, 4, 5]: return 'Spring'
    if month in [6, 7, 8]: return 'Summer'
    if month in [9, 10, 11]: return 'Fall'
    return 'Winter'

df['Season'] = df['Month'].apply(get_season)

# 2b. Breed Reduction
TOP_N_BREEDS = 50 
common_breeds = df['Breed'].value_counts().nlargest(TOP_N_BREEDS).index

df['Reduced_Breed'] = np.where(
    df['Breed'].isin(common_breeds),
    df['Breed'],
    'Rare_Breed'
)

# 2c. Age Conversion (Convert 'Age upon Outcome' to a numeric value in days)
# For simplicity, we'll skip the full conversion here, as it requires a lot of code,
# and instead use one-hot encoding on 'Animal Type', 'Reduced_Breed', and 'Season'. 
# In a full project, Age would be a critical numeric feature to scale.

# --- 3. Filter for Hotspots (Non-Adopted Animals) ---
# We focus ONLY on non-adopted outcomes to find 'hotspots' that are hard to place.
hotspot_df = df[df['Outcome Type'] != 'Adoption'].copy()
print(f"Total non-adopted animals for clustering: {len(hotspot_df)}")

# Define features for clustering (using only categorical ones for now)
clustering_features = ['Animal Type', 'Reduced_Breed', 'Season', 'Sex upon Outcome']

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
cluster_analysis = hotspot_df.groupby('Cluster_ID').agg(
    Count=('Animal ID', 'count'),
    Avg_Age=('Age upon Outcome', lambda x: x.mode().iloc[0] if not x.mode().empty else 'N/A'),
    Most_Common_Type=('Animal Type', lambda x: x.mode().iloc[0]),
    Most_Common_Breed=('Reduced_Breed', lambda x: x.mode().iloc[0]),
    Most_Common_Season=('Season', lambda x: x.mode().iloc[0]),
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
print(cluster_analysis.to_markdown(index=False, floatfmt=".1f"))