// ... existing code ...

// Update the URL to use the correct port (9090)
const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:9090';

// ... existing code ...

const fetchHotspotData = async () => {
  try {
    console.log(`Fetching hotspot data from: ${ML_SERVICE_BASE_URL}/api/v1/predictions/hotspots`);
    const response = await axios.get(`${ML_SERVICE_BASE_URL}/api/v1/predictions/hotspots`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hotspot data:', error.message);
    throw new Error(`Failed to fetch hotspot data from ML service: ${error.message}`);
  }
};

// ... existing code ...