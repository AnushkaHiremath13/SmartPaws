import pandas as pd

# Load the main dataset
file_path = r'D:\5sem\mini\data\Austin_Animal_Center_Outcomes.csv'
outcomes_df = pd.read_csv(file_path)

# --- Perform the Data Processing ---

# 1. Create a 'reduced_breed' column
def reduce_breed(breed):
    if pd.isna(breed):
        return "Unknown"
    if 'Mix' in str(breed):
        return breed.replace(' Mix', '').strip()
    return breed
outcomes_df['reduced_breed'] = outcomes_df['Breed'].apply(reduce_breed)


# 2. Create a 'predicted_season' column
# Convert 'DateTime' to a datetime object, handling errors gracefully
outcomes_df['Month'] = pd.to_datetime(outcomes_df['DateTime'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce').dt.month
def get_season(month):
    if pd.isna(month):
        return "Unknown"
    month = int(month)
    if month in [12, 1, 2]:
        return 'Winter'
    if month in [3, 4, 5]:
        return 'Spring'
    if month in [6, 7, 8]:
        return 'Summer'
    if month in [9, 10, 11]:
        return 'Fall'
    return "Unknown" # Handle any other cases
outcomes_df['predicted_season'] = outcomes_df['Month'].apply(get_season)


# --- Save the processed data to a new file ---
outcomes_df.to_csv('processed_outcomes.csv', index=False)
print("Processed data saved to processed_outcomes.csv")