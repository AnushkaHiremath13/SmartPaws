import os
import pymongo
import json
import pandas as pd
from datetime import datetime

def get_mongo_client():
    # Try to get from environment variable
    mongo_uri = os.environ.get("MONGO_URI")

    # If not found, try to load from config file
    if not mongo_uri:
        try:
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'config.json')
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                mongo_uri = config.get('MONGO_URI')
        except Exception as e:
            print(f"Error loading config file: {e}")

    if not mongo_uri:
        raise ValueError("MONGO_URI is not set in environment or config file")

    return pymongo.MongoClient(mongo_uri)

def get_intake_collection():
    client = get_mongo_client()
    db = client.smartpaws
    return db.intakerecords

def get_outcome_collection():
    client = get_mongo_client()
    db = client.smartpaws
    return db.outcomerecords

def get_uploaded_data(sample_size=5000):
    """
    Fetch uploaded intake and outcome data from MongoDB and return as DataFrames
    OPTIMIZED: Uses sampling for large datasets to improve performance
    """
    try:
        intake_collection = get_intake_collection()
        outcome_collection = get_outcome_collection()
        
        # Get data counts
        intake_count = intake_collection.count_documents({})
        outcome_count = outcome_collection.count_documents({})
        
        print(f"Found {intake_count} intake records and {outcome_count} outcome records in database")
        
        if intake_count == 0 and outcome_count == 0:
            print("No data found in database")
            return None, None, False
        
        # SPEED OPTIMIZATION: Sample data for large datasets
        use_sampling = intake_count > sample_size or outcome_count > sample_size
        
        # Fetch intake data (with sampling for speed)
        intake_data = []
        if intake_count > 0:
            if use_sampling and intake_count > sample_size:
                print(f"🚀 SAMPLING: Using {sample_size} intake records instead of {intake_count} for speed")
                # MongoDB sampling - much faster than loading all and sampling
                intake_cursor = intake_collection.aggregate([
                    {"$sample": {"size": sample_size}}
                ])
            else:
                intake_cursor = intake_collection.find({})
                
            for record in intake_cursor:
                # Convert MongoDB ObjectId to string and clean up
                record['_id'] = str(record['_id'])
                intake_data.append(record)
        
        # Fetch outcome data (with sampling for speed)
        outcome_data = []
        if outcome_count > 0:
            if use_sampling and outcome_count > sample_size:
                print(f"🚀 SAMPLING: Using {sample_size} outcome records instead of {outcome_count} for speed")
                # MongoDB sampling - much faster than loading all and sampling
                outcome_cursor = outcome_collection.aggregate([
                    {"$sample": {"size": sample_size}}
                ])
            else:
                outcome_cursor = outcome_collection.find({})
                
            for record in outcome_cursor:
                # Convert MongoDB ObjectId to string and clean up
                record['_id'] = str(record['_id'])
                outcome_data.append(record)
        
        # Convert to DataFrames
        intake_df = pd.DataFrame(intake_data) if intake_data else pd.DataFrame()
        outcome_df = pd.DataFrame(outcome_data) if outcome_data else pd.DataFrame()
        
        data_source = "sampled" if use_sampling else "full"
        print(f"✅ Successfully loaded data ({data_source}): {len(intake_df)} intakes, {len(outcome_df)} outcomes")
        return intake_df, outcome_df, True
        
    except Exception as e:
        print(f"Error fetching data from MongoDB: {e}")
        return None, None, False

def check_data_freshness():
    """
    Check if there's new data uploaded since last ML processing
    """
    try:
        intake_collection = get_intake_collection()
        outcome_collection = get_outcome_collection()
        
        # Check for recent uploads (within last hour as example)
        recent_threshold = datetime.now().replace(hour=datetime.now().hour-1)
        
        recent_intakes = intake_collection.count_documents({
            "createdAt": {"$gte": recent_threshold}
        })
        recent_outcomes = outcome_collection.count_documents({
            "createdAt": {"$gte": recent_threshold}
        })
        
        return recent_intakes > 0 or recent_outcomes > 0
        
    except Exception as e:
        print(f"Error checking data freshness: {e}")
        return True  # Assume fresh data to be safe