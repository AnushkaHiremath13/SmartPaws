import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import numpy as np

# --- 1. Load Data (Using Corrected Path and Name) ---
try:
    df = pd.read_csv(r'D:\5sem\mini\data\Austin_Animal_Center_Outcomes.csv')
    print("Data loaded successfully.")
    print("Loaded CSV columns:", df.columns.tolist())
except FileNotFoundError:
    print("FATAL ERROR: Data file not found at the expected path.")
    exit()

# --- 2. Feature Engineering (Create 'Season') ---
# This code is NECESSARY to create the 'Season' column!
df['DateTime'] = pd.to_datetime(df['DateTime'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce')
df['Month'] = df['DateTime'].dt.month

def get_season(month):
    """Maps month number to a seasonal name."""
    if month in [3, 4, 5]:
        return 'Spring'
    elif month in [6, 7, 8]:
        return 'Summer'
    elif month in [9, 10, 11]:
        return 'Fall'
    else:
        return 'Winter'

df['Season'] = df['Month'].apply(get_season)


# --- 3. Feature Reduction on 'Breed' ---
TOP_N_BREEDS = 50 
common_breeds = df['Breed'].value_counts().nlargest(TOP_N_BREEDS).index

# Create 'Reduced_Breed' column
df['Reduced_Breed'] = np.where(
    df['Breed'].isin(common_breeds),
    df['Breed'],
    'Rare_Breed'
)

# --- 4. Data Pre-processing and Encoding ---

# Define the features (X) and the target (y)
target_column = 'Outcome Type' 

# 🚨 CORRECTED FEATURE LIST: Use the new 'Reduced_Breed' and 'Season' 
# (which we just created). 'Condition' is excluded.
feature_columns = ['Animal Type', 'Reduced_Breed', 'Season'] 

# Create the binary target variable 'Adopted'
# 1 = 'Adoption' outcome, 0 = All other outcomes
df['Adopted'] = df[target_column].apply(lambda x: 1 if x == 'Adoption' else 0)
y = df['Adopted']

# One-Hot Encode the categorical features (now manageable!)
X = pd.get_dummies(df[feature_columns], drop_first=True)

# Handle cases where the dataset might be too small after encoding
if X.empty or len(X) < 100:
    print("\nWARNING: Dataset is too small or contains no features after encoding.")
    exit()

# --- 5. Train the Random Forest Classifier ---

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize and train the Random Forest Classifier
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# --- 6. Extract and Rank Feature Importance ---

# Get the importance scores
importances = model.feature_importances_

# Map the scores to the feature names
feature_names = X.columns
importance_df = pd.DataFrame({
    'Feature': feature_names,
    'Importance': importances
})

# Create a mapping for grouping features
def get_original_feature_name(feature):
    """Extracts the original feature name from the one-hot encoded column name."""
    if '_' in feature:
        return feature.split('_')[0]
    return feature

importance_df['Original_Feature'] = importance_df['Feature'].apply(get_original_feature_name)

# Group by the original feature and sum the importance scores
grouped_importance = importance_df.groupby('Original_Feature')['Importance'].sum().reset_index()

# Sort by importance in descending order
ranked_factors = grouped_importance.sort_values(by='Importance', ascending=False)

# --- 7. Save Results ---

# Save the ranked factors to a CSV file for analysis and visualization
output_path = '../data/factor_importance.csv'
ranked_factors.to_csv(output_path, index=False)

print("\n🎉 Key Factor Identification Complete.")
print(f"Top Adoption Influencing Factors Saved to: {output_path}")

print("\n--- Ranked Influencing Factors ---")
print(ranked_factors.to_markdown(index=False, numalign="left"))