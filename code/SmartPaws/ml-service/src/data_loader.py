import pandas as pd
from database import get_intake_collection, get_outcome_collection

def load_data_from_mongo():
    intakes_collection = get_intake_collection()
    outcomes_collection = get_outcome_collection()

    intakes_data = list(intakes_collection.find())
    outcomes_data = list(outcomes_collection.find())

    intakes_df = pd.DataFrame(intakes_data)
    outcomes_df = pd.DataFrame(outcomes_data)

    print(f"Loaded {len(intakes_df)} intake records and {len(outcomes_df)} outcome records.")

    return intakes_df, outcomes_df

if __name__ == "__main__":
    try:
        intakes, outcomes = load_data_from_mongo()
        print("Data loaded successfully.")
    except Exception as e:
        print(f"Error: {e}")