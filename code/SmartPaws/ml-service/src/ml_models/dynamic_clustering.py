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

def run_dynamic_clustering():
    """
    Main function to run clustering analysis on uploaded data
    Returns: (success: bool, hotspot_df: DataFrame, message: str)
    """
    try:
        print("🔄 Starting dynamic clustering analysis...")
        
        # Get uploaded data from database
        intake_df, outcome_df, has_data = get_uploaded_data()
        
        if not has_data or outcome_df.empty:
            return False, pd.DataFrame(), "No outcome data found in database"
        
        print(f"✅ Processing {len(outcome_df)} outcome records for clustering")
        
        # Prepare the outcome data for clustering
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
        
        # Feature Engineering
        # Season Creation
        df['datetime'] = pd.to_datetime(df['datetime'])
        df['Month'] = df['datetime'].dt.month
        
        def get_season(month):
            if month in [3, 4, 5]: return 'Spring'
            if month in [6, 7, 8]: return 'Summer'
            if month in [9, 10, 11]: return 'Fall'
            return 'Winter'
        
        df['Season'] = df['Month'].apply(get_season)
        
        # Breed Reduction
        TOP_N_BREEDS = 50 
        common_breeds = df['breed'].value_counts().nlargest(TOP_N_BREEDS).index
        
        df['Reduced_Breed'] = np.where(
            df['breed'].isin(common_breeds),
            df['breed'],
            'Rare_Breed'
        )
        
        # Filter for Hotspots (Non-Adopted Animals)
        # Check for adoption patterns (case-insensitive)
        adoption_patterns = ['adopt', 'Adopt', 'ADOPT', 'Adoption', 'ADOPTION']
        is_adoption = df['outcomeType'].str.contains('|'.join(adoption_patterns), case=False, na=False)
        hotspot_df = df[~is_adoption].copy()
        
        print(f"📊 Found {len(hotspot_df)} non-adopted animals for clustering")
        
        if len(hotspot_df) < 10:
            return False, pd.DataFrame(), "Insufficient non-adopted animals for clustering (need at least 10)"
        
        # Define features for clustering
        clustering_features = ['animalType', 'Reduced_Breed', 'Season', 'sexUponOutcome']
        
        # Check if we have the required features
        missing_features = [f for f in clustering_features if f not in hotspot_df.columns]
        if missing_features:
            print(f"⚠️ Missing features: {missing_features}")
            # Use available features only
            clustering_features = [f for f in clustering_features if f in hotspot_df.columns]
        
        if not clustering_features:
            return False, pd.DataFrame(), "No suitable features available for clustering"
        
        # One-Hot Encode the categorical features
        X_clustered = pd.get_dummies(hotspot_df[clustering_features], drop_first=True)
        
        if X_clustered.empty or X_clustered.shape[1] == 0:
            return False, pd.DataFrame(), "No features available after encoding"
        
        # Scale the data
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_clustered)
        
        # Determine optimal number of clusters (simplified)
        K_OPTIMAL = min(5, len(hotspot_df) // 10)  # Ensure reasonable cluster count
        K_OPTIMAL = max(2, K_OPTIMAL)  # At least 2 clusters
        
        print(f"🎯 Using K={K_OPTIMAL} clusters for analysis")
        
        # Run K-Means Clustering
        kmeans_final = KMeans(n_clusters=K_OPTIMAL, random_state=42, n_init=10)
        hotspot_df['Cluster_ID'] = kmeans_final.fit_predict(X_scaled)
        
        # Analyze the composition of each cluster
        print("📈 Analyzing cluster composition...")
        
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
        
        # Calculate percentages
        cluster_analysis['Percentage'] = (cluster_analysis['Count'] / len(hotspot_df)) * 100
        
        # Save results
        output_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, 'hotspot_clusters.csv')
        
        cluster_analysis.to_csv(output_path, index=False)
        
        print(f"✅ Hotspot clustering complete! Results saved to: {output_path}")
        print(f"📊 Generated {len(cluster_analysis)} clusters from {len(hotspot_df)} non-adopted animals")
        
        return True, cluster_analysis, "Clustering analysis completed successfully"
        
    except Exception as e:
        error_msg = f"Error in dynamic clustering: {str(e)}"
        print(f"❌ {error_msg}")
        return False, pd.DataFrame(), error_msg

if __name__ == "__main__":
    success, results, message = run_dynamic_clustering()
    if success:
        print("🎉 Dynamic clustering completed successfully!")
        print(results.head())
    else:
        print(f"❌ Clustering failed: {message}")
