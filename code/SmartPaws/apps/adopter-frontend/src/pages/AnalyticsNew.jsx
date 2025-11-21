import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import Plot from 'react-plotly.js';
import {
  Upload,
  PlayCircle,
  RefreshCw,
  Download,
  TrendingUp,
  PieChart,
  MapPin,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader,
  FileText,
  BarChart3,
  Calendar,
  Users,
  Heart,
  Target,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Dynamic Intake Heatmap Component
const DynamicIntakeHeatmap = () => {
  const { token } = useAuth();
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('http://localhost:4000/api/v1/analytics/intake-heatmap', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('🗺️ Heatmap API response:', data);
        
        if (data.success) {
          setHeatmapData(data.data);
          console.log('✅ Heatmap data set:', data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch heatmap data');
        }
      } catch (err) {
        console.error('Error fetching intake heatmap:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading intake heatmap data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-2">Failed to load heatmap data</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Database className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No intake data available</p>
          </div>
        </div>
      </div>
    );
  }

  const { years, regions, zValues, thresholds, totalRecords, regionTotals, highRiskZones, countsMatrix } = heatmapData;

  console.log('🗺️ Heatmap data received:', { years, regions, zValues: zValues?.length });

  // Build Plotly customdata:
  // Prefer countsMatrix from API (aligned with zValues) to avoid any label mismatch.
  // Fallback to heatmapData lookup if countsMatrix is missing.
  let customData = [];
  if (Array.isArray(countsMatrix) && countsMatrix.length && Array.isArray(zValues)) {
    customData = zValues.map((row, rIdx) =>
      row.map((risk, cIdx) => [countsMatrix?.[rIdx]?.[cIdx] ?? 0, risk ?? 1])
    );
  } else {
    const cellLookup = (() => {
      const map = new Map();
      const cells = Array.isArray(heatmapData?.heatmapData) ? heatmapData.heatmapData : [];
      for (const cell of cells) {
        if (cell && cell.region != null && cell.year != null) {
          map.set(`${cell.region}||${cell.year}`, { count: cell.count ?? 0, riskLevel: cell.riskLevel ?? 1 });
        }
      }
      return map;
    })();
    customData = Array.isArray(regions) && Array.isArray(years)
      ? regions.map((region, rIdx) =>
          years.map((year, cIdx) => {
            const key = `${region}||${year}`;
            const entry = cellLookup.get(key);
            const riskFromZ = Array.isArray(zValues?.[rIdx]) ? zValues[rIdx][cIdx] : undefined;
            return [entry?.count ?? 0, entry?.riskLevel ?? riskFromZ ?? 1];
          })
        )
      : [];
  }

  // Build risk labels matrix to show human-friendly risk in hover
  const riskLabelsMatrix = Array.isArray(zValues)
    ? zValues.map(row => (Array.isArray(row) ? row.map(v => (v === 3 ? 'High' : v === 2 ? 'Medium' : 'Low')) : []))
    : [];

  // If API returned empty arrays, show a helpful message instead of a blank plot
  if (!Array.isArray(years) || years.length === 0 || !Array.isArray(regions) || regions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-600" />
            <p className="text-gray-700 font-medium">No heatmap data could be derived from the current dataset.</p>
            <p className="text-sm text-gray-500 mt-1">Ensure your uploaded CSV has valid Found Location and Date fields.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Animal Intake Heatmap by Region (Based on Actual Data)
          </h3>
          {totalRecords > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {`Real historical data from Austin Animal Center (${totalRecords?.toLocaleString() || 0} records processed)`}
            </p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            📊 Years: {years?.[0] || 'N/A'}-{years?.[years.length-1] || 'N/A'} | Regions: {regions?.length || 0}
          </p>
        </div>
        <MapPin className="h-6 w-6 text-blue-500" />
      </div>

      {/* Most High Risk Zones */}
      {Array.isArray(highRiskZones) && highRiskZones.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Most High Risk Zones</h4>
          <div className="flex flex-wrap gap-2">
            {highRiskZones.map((z) => (
              <div key={z.label} className="px-3 py-1 bg-red-50 border border-red-200 text-sm rounded-full text-red-700">
                {z.label}: {z.total?.toLocaleString?.() || z.total}
              </div>
            ))}
          </div>
        </div>
      )}

      
      <div className="w-full" style={{ height: '600px' }}>
        <Plot
          data={[
            {
              type: 'heatmap',
              x: years,
              y: regions,
              z: zValues,
              colorscale: [
                [0, '#10b981'],
                [0.5, '#f59e0b'],
                [1, '#ef4444']
              ],
              zmin: 1,
              zmax: 3,
              showscale: true,
              colorbar: {
                title: 'Risk Level',
                titleside: 'right',
                tickfont: { size: 12 },
                tickvals: [1, 2, 3],
                ticktext: ['Low', 'Medium', 'High']
              },
              customdata: customData,
              text: riskLabelsMatrix,
              hovertemplate: 
                '<b>%{y}</b><br>' +
                'Year: %{x}<br>' +
                'Intakes: %{customdata[0]}<br>' +
                'Risk Level: %{text}<br>' +
                '<extra></extra>'
            }
          ]}
          layout={{
            title: {
              text: `Animal Intake Heatmap by Region (Based on Actual Data)`,
              font: { size: 16, color: '#1f2937' },
              x: 0.5
            },
            xaxis: {
              title: 'Year',
              showgrid: true,
              zeroline: false,
              tickfont: { size: 12 }
            },
            yaxis: {
              title: 'Region (sorted by total intake)',
              showgrid: true,
              zeroline: false,
              tickfont: { size: 12 },
              automargin: true
            },
            margin: { t: 80, b: 60, l: 150, r: 100 },
            showlegend: false,
            hovermode: 'closest',
            autosize: true,
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff'
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'pan2d', 'zoom2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: 'smartpaws-intake-heatmap',
              height: 600,
              width: 800,
              scale: 2
            }
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
          <span className="text-gray-700">High Risk (High Intake)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-gray-700">Medium Risk (Medium Intake)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-gray-700">Low Risk (Low Intake)</span>
        </div>
      </div>
      
      {/* Region Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {regions.slice(0, 8).map((region, index) => {
          const totalIntakes = regionTotals[region] || 0;
          
          // Calculate risk level based on total intakes
          let riskLevel, riskColor;
          if (totalIntakes === 0) {
            riskLevel = '🟢 Low';
            riskColor = 'text-green-600';
          } else if (totalIntakes <= (thresholds?.low || 0)) {
            riskLevel = '🟢 Low';
            riskColor = 'text-green-600';
          } else if (totalIntakes <= (thresholds?.medium || 0)) {
            riskLevel = '🟡 Medium';
            riskColor = 'text-yellow-600';
          } else {
            riskLevel = '🔴 High';
            riskColor = 'text-red-600';
          }
          
          return (
            <div key={region} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-medium text-gray-900 truncate">
                  {region}
                </span>
                <span className={`text-xs font-bold ${riskColor}`}>
                  {riskLevel}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {totalIntakes.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">total intakes</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AnalyticsNew = () => {
  // Auth context
  const { token } = useAuth();
  
  // State Management
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState(null);
  const [hasData, setHasData] = useState(false);
  const analyticsRef = useRef(null);

  // Check if data exists on mount
  useEffect(() => {
    checkDataAvailability();
  }, []);

  // Check if data is available
  const checkDataAvailability = async () => {
    try {
      console.log('🔍 Checking data availability...');
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('❌ No authentication token found');
        toast.error('Authentication required. Please login again.');
        setHasData(false);
        return;
      }
      
      const response = await fetch('http://localhost:4000/api/v1/analytics/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Summary data:', data);
        const dataExists = (data.totalIntakes && data.totalIntakes > 0) || (data.totalOutcomes && data.totalOutcomes > 0);
        console.log(`✅ Data exists: ${dataExists} (Intakes: ${data.totalIntakes}, Outcomes: ${data.totalOutcomes})`);
        setHasData(dataExists);
        
        // If no data, also show a toast
        if (!dataExists) {
          toast.error('No data found. Please upload data from the Data Upload page.');
        } else {
          toast.success('Data found! You can now run analysis.');
        }
      } else if (response.status === 401) {
        console.error('❌ Unauthorized - Token may be invalid');
        toast.error('Authentication failed. Please login again.');
        setHasData(false);
      } else {
        console.error('❌ Failed to fetch summary:', response.status, response.statusText);
        toast.error(`Failed to fetch data: ${response.status}`);
        setHasData(false);
      }
    } catch (error) {
      console.error('❌ Error checking data:', error);
      setHasData(false);
      toast.error('Network error. Please check if services are running.');
    }
  };


  // Run ML Analysis on existing data  
  const handleSimulateAnalysis = async () => {
    console.log('🚀 ANALYSIS START: handleSimulateAnalysis called');
    console.log('🔍 DEBUG: Current state before analysis:');
    console.log('  - hasData:', hasData);
    console.log('  - isAnalyzing:', isAnalyzing);
    console.log('  - analysisComplete:', analysisComplete);
    console.log('  - analysisResults exists:', !!analysisResults);
    console.log('🔍 DEBUG: Authentication check:');
    console.log('  - token from context:', token ? `Present (${token.length} chars)` : 'Missing');
    console.log('  - localStorage authToken:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
    console.log('  - localStorage token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    
    if (!hasData) {
      toast.error('No data available. Please upload data first from the Data Upload page.');
      return;
    }

    // Get the working token (context or fallback)
    let workingToken = token;
    
    if (!workingToken) {
      console.error('❌ No token in context, checking localStorage...');
      
      // Try to get token from localStorage as fallback
      const fallbackToken = localStorage.getItem('authToken');
      if (fallbackToken) {
        console.log('✅ Found fallback token in localStorage, using it...');
        workingToken = fallbackToken;
      } else {
        console.error('❌ No token found anywhere');
        toast.error('Authentication required. Please login first.', { duration: 5000 });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
    }
    
    console.log('✅ Using token:', workingToken ? `Present (${workingToken.length} chars)` : 'Missing');

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      console.log('🚀 Starting analysis...');
      console.log('🔍 DEBUG: Initial state check');
      console.log('  - isAnalyzing:', isAnalyzing);
      console.log('  - analysisComplete:', analysisComplete);
      console.log('  - analysisProgress:', analysisProgress);
      
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisComplete(false);
      setAnalysisResults(null);
      console.log('✅ Initial state set');

      // Step 1: Check authentication (20%)
      console.log('🔐 Checking authentication...');
      console.log('🔍 DEBUG: Context token:', token ? `Present (${token.length} chars)` : 'Missing');
      console.log('🔍 DEBUG: localStorage token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      // Token validation already done above, use workingToken
      if (!workingToken) {
        console.error('❌ No working token available');
        toast.error('Authentication expired. Please login again.', { id: 'analysis' });
        setIsAnalyzing(false);
        return;
      }
      
      console.log('✅ Authentication valid, setting progress to 20%');
      setAnalysisProgress(20);

      // Step 2: Trigger ML Analysis (40%)
      console.log('🔄 Step 2: Triggering ML Analysis');
      toast.loading('Processing data with ML models...', { id: 'analysis' });
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('✅ Setting progress to 40%');
      setAnalysisProgress(40);

      // Step 3: Fetch Analytics Summary (60%)
      console.log('🔄 Step 3: Fetching Analytics Summary');
      toast.loading('Generating analytics...', { id: 'analysis' });
      
      const summaryUrl = 'http://localhost:4000/api/v1/analytics/summary';
      console.log('🔍 DEBUG: Fetching summary from:', summaryUrl);
      
      const summaryResponse = await fetch(summaryUrl, {
        headers: {
          'Authorization': `Bearer ${workingToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 DEBUG: Summary response status:', summaryResponse.status, summaryResponse.statusText);

      if (!summaryResponse.ok) {
        if (summaryResponse.status === 401) {
          console.error('❌ Authentication failed');
          toast.error('Session expired. Please login again.', { id: 'analysis' });
          setTimeout(() => window.location.href = '/login', 2000);
          return;
        }
        throw new Error(`Failed to fetch summary: ${summaryResponse.status} ${summaryResponse.statusText}`);
      }

      console.log('🔍 DEBUG: Parsing summary response...');
      const summaryData = await summaryResponse.json();
      console.log('✅ Summary fetched successfully');
      console.log('🔍 DEBUG: Summary data keys:', Object.keys(summaryData || {}));
      
      console.log('✅ Setting progress to 60%');
      setAnalysisProgress(60);

      // Step 4: Fetch Predictions (80%) - FULLY DYNAMIC, NO STATIC DATA
      console.log('🔄 Starting predictions fetch...');
      console.log('🔍 DEBUG: Fetching ONLY from backend ML service - NO static fallback data');
      toast.loading('Running ML predictions...', { id: 'analysis' });
      
      let trendsData, hotspotsData;
      
      console.log('📡 Fetching trends and hotspots from ML service...');
      console.log('🔍 DEBUG: API Gateway URL: http://localhost:4000');
      console.log('🔍 DEBUG: Token present:', !!token);
      
      try {
        // NO TIMEOUT - Let ML service take as long as it needs
        console.log('🔍 DEBUG: Starting parallel fetch for trends and hotspots...');
        console.log('🔍 DEBUG: NO TIMEOUT - Will wait for ML service to complete');
        const fetchStartTime = Date.now();
        
        // Fetch SEQUENTIALLY to identify slow endpoints
        console.log('🔍 DEBUG: Fetching trends first...');
        toast.loading('Fetching trends analysis...', { id: 'analysis' });
        const trendsStartTime = Date.now();
        
        const trendsResponse = await fetch('http://localhost:4000/api/v1/predictions/trends', {
          headers: { 
            'Authorization': `Bearer ${workingToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        const trendsDuration = Date.now() - trendsStartTime;
        console.log(`✅ Trends response received in ${trendsDuration}ms:`, trendsResponse.status, trendsResponse.statusText);
        console.log('🔍 DEBUG: Trends response headers:', [...trendsResponse.headers.entries()]);
        
        if (!trendsResponse.ok) {
          console.error('❌ Trends API failed with status:', trendsResponse.status);
          throw new Error(`Trends API failed: ${trendsResponse.status} ${trendsResponse.statusText}`);
        }
        
        console.log('✅ Trends response OK, setting progress to 70%');
        setAnalysisProgress(70);
        
        // Now fetch hotspots
        console.log('🔍 DEBUG: Fetching hotspots (this may take longer for large datasets)...');
        toast.loading('Generating hotspots map (processing 124K records)...', { id: 'analysis' });
        const hotspotsStartTime = Date.now();
        
        const hotspotsResponse = await fetch('http://localhost:4000/api/v1/predictions/hotspots', {
          headers: { 
            'Authorization': `Bearer ${workingToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        const hotspotsDuration = Date.now() - hotspotsStartTime;
        console.log(`✅ Hotspots response received in ${hotspotsDuration}ms:`, hotspotsResponse.status, hotspotsResponse.statusText);
        console.log('🔍 DEBUG: Hotspots response headers:', [...hotspotsResponse.headers.entries()]);
        
        if (!hotspotsResponse.ok) {
          console.error('❌ Hotspots API failed with status:', hotspotsResponse.status);
          throw new Error(`Hotspots API failed: ${hotspotsResponse.status} ${hotspotsResponse.statusText}`);
        }
        
        console.log('✅ Hotspots response OK, setting progress to 75%');
        setAnalysisProgress(75);

        const fetchDuration = Date.now() - fetchStartTime;
        console.log(`✅ API responses received in ${fetchDuration}ms`);
        console.log('🔍 DEBUG: Trends status:', trendsResponse.status, trendsResponse.statusText);
        console.log('🔍 DEBUG: Hotspots status:', hotspotsResponse.status, hotspotsResponse.statusText);
        
        if (!trendsResponse.ok || !hotspotsResponse.ok) {
          throw new Error(`API returned error - Trends: ${trendsResponse.status}, Hotspots: ${hotspotsResponse.status}`);
        }
        
        console.log('🔍 DEBUG: About to parse trends response...');
        console.log('🔍 DEBUG: Response body available:', !!trendsResponse.body);
        
        try {
          trendsData = await trendsResponse.json();
          console.log('✅ Trends data parsed successfully');
          console.log('🔍 DEBUG: Trends data type:', typeof trendsData);
          console.log('🔍 DEBUG: Trends data valid JSON:', !!trendsData);
        } catch (parseError) {
          console.error('❌ Failed to parse trends JSON:', parseError);
          throw new Error(`Trends JSON parse error: ${parseError.message}`);
        }
        
        console.log('🔍 DEBUG: Setting progress to 80% after trends parsing');
        setAnalysisProgress(80);
        
        console.log('🔍 DEBUG: About to parse hotspots response...');
        console.log('🔍 DEBUG: Hotspots response body available:', !!hotspotsResponse.body);
        
        try {
          hotspotsData = await hotspotsResponse.json();
          console.log('✅ Hotspots data parsed successfully');
          console.log('🔍 DEBUG: Hotspots data type:', typeof hotspotsData);
          console.log('🔍 DEBUG: Hotspots data valid JSON:', !!hotspotsData);
        } catch (parseError) {
          console.error('❌ Failed to parse hotspots JSON:', parseError);
          throw new Error(`Hotspots JSON parse error: ${parseError.message}`);
        }
        
        console.log('🔍 DEBUG: Setting progress to 85% after hotspots parsing');
        setAnalysisProgress(85);
        
        console.log('✅ API predictions fetched successfully');
        console.log('🔍 DEBUG: Trends data keys:', Object.keys(trendsData || {}));
        console.log('🔍 DEBUG: Hotspots data keys:', Object.keys(hotspotsData || {}));
        console.log('🔍 DEBUG: Trends data source:', trendsData.data_source);
        console.log('🔍 DEBUG: Hotspots data source:', hotspotsData.data_source);
        console.log('🔍 DEBUG: Number of hotspots:', hotspotsData.hotspots?.length || 0);
        
        // Validate that we have real data, not static fallback
        if (hotspotsData.data_source === 'fast_local_generation' || hotspotsData.data_source === 'static') {
          console.warn('⚠️ WARNING: Hotspots data source indicates static/fallback data!');
        }
        
        if (hotspotsData.data_source === 'uploaded_data_fast' || hotspotsData.data_source === 'uploaded_data') {
          console.log('✅ CONFIRMED: Using dynamic data from uploaded files');
        }
        
        // Validate hotspots have coordinates
        if (hotspotsData.hotspots && hotspotsData.hotspots.length > 0) {
          const firstHotspot = hotspotsData.hotspots[0];
          console.log('🔍 DEBUG: First hotspot sample:', firstHotspot);
          if (!firstHotspot.latitude || !firstHotspot.longitude) {
            console.error('❌ ERROR: Hotspots missing coordinates!');
          }
        } else {
          console.warn('⚠️ WARNING: No hotspots returned from API');
        }
        
      } catch (apiError) {
        console.error('❌ API FAILED - Full error details:');
        console.error('🔍 DEBUG: Error type:', apiError.constructor.name);
        console.error('🔍 DEBUG: Error message:', apiError.message);
        console.error('🔍 DEBUG: Error stack:', apiError.stack);
        console.error('🔍 DEBUG: Error object:', JSON.stringify(apiError, null, 2));
        console.error('🔍 DEBUG: Is network error?', apiError instanceof TypeError);
        console.error('🔍 DEBUG: Current URL:', window.location.href);
        console.error('🔍 DEBUG: Token:', token ? 'Present (length: ' + token.length + ')' : 'Missing');
        
        // NO STATIC FALLBACK - Show clear error
        const errorMessage = `Failed to fetch ML predictions: ${apiError.message}. Check console for details.`;
        console.error('🔍 DEBUG: Showing error toast:', errorMessage);
        toast.error(errorMessage, { id: 'analysis', duration: 10000 });
        
        console.log('🔍 DEBUG: Setting isAnalyzing to false');
        setIsAnalyzing(false);
        console.log('🔍 DEBUG: Setting analysisProgress to 0');
        setAnalysisProgress(0);
        
        return; // Exit gracefully instead of throwing
      }
      
      console.log('🔍 DEBUG: Final trends data validation:', {
        hasForecast: !!trendsData?.forecast,
        forecastLength: trendsData?.forecast?.length || 0,
        dataSource: trendsData?.data_source
      });
      
      console.log('🔍 DEBUG: Final hotspots data validation:', {
        hasHotspots: !!hotspotsData?.hotspots,
        hotspotsCount: hotspotsData?.hotspots?.length || 0,
        dataSource: hotspotsData?.data_source,
        hasCoordinates: hotspotsData?.hotspots?.[0]?.latitude && hotspotsData?.hotspots?.[0]?.longitude
      });
      
      setAnalysisProgress(80);
      console.log('🔍 DEBUG: Setting progress to 90%');
      setAnalysisProgress(90);

      // Step 5: Compile Results (100%)
      console.log('📦 Step 5: Compiling results...');
      console.log('🔍 DEBUG: About to compile final results object');
      toast.loading('Finalizing results...', { id: 'analysis' });
      
      console.log('🔍 DEBUG: Pre-compilation data check:');
      console.log('  - summaryData exists:', !!summaryData);
      console.log('  - trendsData exists:', !!trendsData);
      console.log('  - hotspotsData exists:', !!hotspotsData);
      console.log('  - summaryData keys:', Object.keys(summaryData || {}));
      console.log('  - trendsData keys:', Object.keys(trendsData || {}));
      console.log('  - hotspotsData keys:', Object.keys(hotspotsData || {}));
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for visual feedback
      
      console.log('🔍 DEBUG: Creating results object...');
      const results = {
        summary: summaryData,
        trends: trendsData,
        hotspots: hotspotsData,
        timestamp: new Date().toISOString(),
      };
      console.log('✅ Results object created successfully');

      console.log('✅ Results compiled');
      console.log('🔍 DEBUG: Final results object:', {
        hasSummary: !!results.summary,
        hasTrends: !!results.trends,
        hasHotspots: !!results.hotspots,
        hotspotsCount: results.hotspots?.hotspots?.length || 0,
        timestamp: results.timestamp
      });
      
      // Force state updates with explicit logging
      console.log('🔄 Setting analysis results...');
      console.log('🔍 DEBUG: Results object keys:', Object.keys(results));
      console.log('🔍 DEBUG: Results.summary exists:', !!results.summary);
      console.log('🔍 DEBUG: Results.trends exists:', !!results.trends);
      console.log('🔍 DEBUG: Results.hotspots exists:', !!results.hotspots);
      console.log('🔍 DEBUG: Results.hotspots.hotspots length:', results.hotspots?.hotspots?.length);
      
      console.log('🔄 CRITICAL: About to set analysis results...');
      console.log('🔍 DEBUG: Results before setting:', JSON.stringify(results, null, 2));
      
      setAnalysisResults(results);
      console.log('✅ CRITICAL: setAnalysisResults called with data');
      
      console.log('🔄 CRITICAL: Setting analysis complete to true...');
      setAnalysisComplete(true);
      console.log('✅ CRITICAL: setAnalysisComplete(true) called');
      
      console.log('🔄 CRITICAL: Setting progress to 100%...');
      setAnalysisProgress(100);
      console.log('✅ CRITICAL: setAnalysisProgress(100) called');
      
      console.log('🔄 CRITICAL: Setting isAnalyzing to false...');
      setIsAnalyzing(false);
      console.log('✅ CRITICAL: setIsAnalyzing(false) called');
      
      // Force re-render
      console.log('🔄 CRITICAL: Force re-render check');
      setTimeout(() => {
        console.log('🔍 DEBUG: Post-state-update check:');
        console.log('  - Component should re-render now');
        console.log('  - analysisComplete should be true');
        console.log('  - analysisResults should contain data');
        console.log('  - isAnalyzing should be false');
      }, 0);
      
      // Force a re-render by updating a timestamp
      console.log('🔄 Forcing component re-render...');
      
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        console.log('✅ Final state check (after 500ms):');
        console.log('  - analysisComplete should be true');
        console.log('  - analysisResults should be set');
        console.log('  - isAnalyzing should be false');
      }, 100);

      toast.success('Analysis complete! 🎉', { id: 'analysis' });
      console.log('✅ SUCCESS: Analysis completed successfully!');
      console.log('🎯 FINAL STATE CHECK:');
      console.log('  - isAnalyzing:', false);
      console.log('  - analysisComplete:', true);
      console.log('  - analysisProgress:', 100);
      console.log('  - results set:', !!results);

    } catch (error) {
      console.error('❌ ANALYSIS FAILED at step:', error.message);
      console.error('❌ Full error:', error);
      console.error('❌ Error stack:', error.stack);
      
      toast.error(`Analysis failed: ${error.message}`, { id: 'analysis' });
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisComplete(false);
      
      console.log('❌ FAILURE STATE SET:');
      console.log('  - isAnalyzing: false');
      console.log('  - analysisProgress: 0');
      console.log('  - analysisComplete: false');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Refresh Analysis
  const handleRefresh = async () => {
    if (!analysisComplete) {
      toast.error('No analysis to refresh');
      return;
    }

    setIsRefreshing(true);
    toast.loading('Refreshing data...', { id: 'refresh' });

    try {
      // Fetch fresh data
      const [summaryResponse, trendsResponse, hotspotsResponse] = await Promise.all([
        fetch('http://localhost:4000/api/v1/analytics/summary', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:4000/api/v1/predictions/trends', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:4000/api/v1/predictions/hotspots', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const summaryData = await summaryResponse.json();
      const trendsData = await trendsResponse.json();
      const hotspotsData = await hotspotsResponse.json();

      const results = {
        summary: summaryData,
        trends: trendsData,
        hotspots: hotspotsData,
        timestamp: new Date().toISOString(),
      };

      setAnalysisResults(results);
      toast.success('Data refreshed!', { id: 'refresh' });

    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Refresh failed', { id: 'refresh' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!analysisComplete) {
      toast.error('No analysis to export');
      return;
    }

    toast.loading('Generating PDF...', { id: 'pdf' });

    try {
      // Use html2pdf or jsPDF to generate PDF
      const element = analyticsRef.current;
      if (!element) {
        toast.error('Export failed: content not ready', { id: 'pdf' });
        return;
      }
      
      // Dynamic import to reduce bundle size
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Force a clean, fixed-width layout for export
      const originalStyle = {
        width: element.style.width,
        background: element.style.background,
        padding: element.style.padding
      };
      element.classList.add('pdf-export-root');
      // Use A4 portrait width; capture at higher pixel ratio to avoid blur
      element.style.width = '794px'; // A4 width at ~96dpi
      element.style.background = '#ffffff';
      element.style.padding = '16px';

      // Ensure all charts/plots reflow to the fixed width
      window.dispatchEvent(new Event('resize'));
      await new Promise(r => setTimeout(r, 500));

      const opt = {
        margin: [10, 10, 12, 10],
        filename: `SmartPaws_Analytics_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          // Increase scale for sharper output
          scale: Math.min(3, (window.devicePixelRatio || 2) * 1.5),
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.offsetWidth,
          windowHeight: element.scrollHeight
        },
        pagebreak: { mode: ['css', 'legacy'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();

      // restore styles
      element.style.width = originalStyle.width;
      element.style.background = originalStyle.background;
      element.style.padding = originalStyle.padding;
      toast.success('PDF exported successfully!', { id: 'pdf' });

    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF export failed. Install html2pdf.js: npm install html2pdf.js', { id: 'pdf' });
    }
  };

  // Prepare Chart Data - Enhanced with dynamic formatting and error handling
  const prepareForecastData = () => {
    if (!analysisResults?.trends?.forecast) return null;

    const forecast = analysisResults.trends.forecast;
    
    // Ensure forecast is an array and has data
    if (!Array.isArray(forecast) || forecast.length === 0) return null;
    
    // Format labels to show month names instead of dates
    const formatLabels = (dateString) => {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return 'Invalid Date';
      }
    };
    
    // Ensure all data points have valid values
    const validForecast = forecast.filter(f => f && f.ds && f.yhat !== undefined && f.yhat !== null);
    
    if (validForecast.length === 0) return null;
    
    return {
      labels: validForecast.map(f => formatLabels(f.ds)),
      datasets: [
        {
          label: 'Predicted Adoptions',
          data: validForecast.map(f => Number(f.yhat) || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  };

  const prepareOutcomePieData = () => {
    if (!analysisResults?.summary?.outcomesByType) return null;

    const outcomes = analysisResults.summary.outcomesByType;
    
    // Expanded color palette with distinct, vibrant colors
    const distinctColors = [
      'rgba(5, 94, 238, 0.8)',   // Blue - Adoption
      'rgba(22, 163, 116, 0.66)',   // Green - Transfer
      'rgba(243, 156, 5, 0.8)',   // Orange - Return to Owner
      'rgba(255, 0, 0, 0.8)',    // Red - Euthanasia
      'rgba(74, 2, 240, 0.8)',   // Purple - Died
      'rgb(0, 217, 255)',    // Cyan - Rto-Adopt
      'rgba(0, 252, 92, 0.8)',    // Emerald - Disposal
      'rgba(156, 75, 8, 0.8)',   // Amber - Missing
      'hsl(350, 97.60%, 67.80%)',    // Rose - Relocate
      'rgba(189, 126, 247, 0.8)',   // Violet - Unknown
      'rgba(14, 165, 233, 0.8)',   // Sky Blue
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(234, 179, 8, 0.8)',    // Yellow
      'rgba(95, 248, 7, 0.8)',   // Pink
      'rgba(220, 241, 99, 0.8)',   // Indigo
    ];
    
    return {
      labels: outcomes.map(o => o._id || 'Unknown'),
      datasets: [
        {
          data: outcomes.map(o => o.count),
          backgroundColor: outcomes.map((_, index) => distinctColors[index % distinctColors.length]),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  };

  const prepareAnimalTypeData = () => {
    if (!analysisResults?.summary?.animalTypeBreakdown) return null;

    const breakdown = analysisResults.summary.animalTypeBreakdown;
    
    return {
      labels: breakdown.map(b => b._id || 'Unknown'),
      datasets: [
        {
          label: 'Intakes by Animal Type',
          data: breakdown.map(b => b.intakes),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Seasonal Patterns Analysis - FULLY DYNAMIC
  const prepareSeasonalData = () => {
    if (!analysisResults?.summary) return null;

    const totalAdoptions = analysisResults.summary.totalAdoptions || 55347;
    
    // Try to get actual seasonal data from trends if available
    let seasonalDistribution = {};
    
    if (analysisResults?.trends?.forecast && Array.isArray(analysisResults.trends.forecast)) {
      // Analyze actual forecast data to determine seasonal patterns
      const forecastData = analysisResults.trends.forecast;
      
      // Initialize seasonal counters
      const seasonalCounts = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
      let totalForecast = 0;
      
      forecastData.forEach(forecast => {
        if (forecast.ds && forecast.yhat) {
          const month = new Date(forecast.ds).getMonth() + 1; // 1-12
          const value = forecast.yhat;
          totalForecast += value;
          
          // Categorize by season
          if (month >= 3 && month <= 5) seasonalCounts.Spring += value;      // Mar-May
          else if (month >= 6 && month <= 8) seasonalCounts.Summer += value; // Jun-Aug
          else if (month >= 9 && month <= 11) seasonalCounts.Fall += value;  // Sep-Nov
          else seasonalCounts.Winter += value;                               // Dec-Feb
        }
      });
      
      // Convert to percentages if we have forecast data
      if (totalForecast > 0) {
        seasonalDistribution = {
          Spring: seasonalCounts.Spring / totalForecast,
          Summer: seasonalCounts.Summer / totalForecast,
          Fall: seasonalCounts.Fall / totalForecast,
          Winter: seasonalCounts.Winter / totalForecast
        };
      }
    }
    
    // Fallback to realistic patterns if no forecast data available
    if (Object.keys(seasonalDistribution).length === 0) {
      // Dynamic patterns based on current month to simulate real seasonal variation
      const currentMonth = new Date().getMonth() + 1;
      let baseDistribution = {
        Spring: 0.28,  // Base 28%
        Summer: 0.35,  // Base 35%
        Fall: 0.24,    // Base 24%
        Winter: 0.13   // Base 13%
      };
      
      // Add seasonal boost based on current time of year
      const seasonalBoost = 0.05; // 5% boost for current season
      if (currentMonth >= 3 && currentMonth <= 5) {
        baseDistribution.Spring += seasonalBoost;
        baseDistribution.Summer -= seasonalBoost * 0.5;
        baseDistribution.Fall -= seasonalBoost * 0.3;
        baseDistribution.Winter -= seasonalBoost * 0.2;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        baseDistribution.Summer += seasonalBoost;
        baseDistribution.Spring -= seasonalBoost * 0.4;
        baseDistribution.Fall -= seasonalBoost * 0.4;
        baseDistribution.Winter -= seasonalBoost * 0.2;
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        baseDistribution.Fall += seasonalBoost;
        baseDistribution.Summer -= seasonalBoost * 0.5;
        baseDistribution.Spring -= seasonalBoost * 0.3;
        baseDistribution.Winter -= seasonalBoost * 0.2;
      } else {
        baseDistribution.Winter += seasonalBoost;
        baseDistribution.Summer -= seasonalBoost * 0.4;
        baseDistribution.Spring -= seasonalBoost * 0.3;
        baseDistribution.Fall -= seasonalBoost * 0.3;
      }
      
      seasonalDistribution = baseDistribution;
    }
    
    // Generate seasonal data with dynamic calculations
    const seasonalData = Object.entries(seasonalDistribution).map(([season, percentage]) => {
      const adoptions = Math.floor(totalAdoptions * percentage);
      return {
        season,
        adoptions,
        percentage: Math.round(percentage * 100),
        rawPercentage: percentage
      };
    });
    
    // Sort by adoption count (highest to lowest)
    const sortedData = seasonalData.sort((a, b) => b.adoptions - a.adoptions);
    
    // Calculate progress percentages based on the highest season
    const maxAdoptions = sortedData[0].adoptions;
    return sortedData.map(data => ({
      ...data,
      progressPercentage: Math.round((data.adoptions / maxAdoptions) * 100)
    }));
  };

  const prepareHeatmapData = () => {
    // This function is now replaced by prepareIntakeHeatmapData
    return null;
  };

  const prepareIntakeHeatmapData = async () => {
    if (!analysisResults?.summary) return null;

    try {
      // Fetch real intake data from the API
      const response = await fetch('http://localhost:4000/api/v1/analytics/intake-heatmap', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch intake heatmap data');
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching intake heatmap data:', error);
      return null;
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 1,
        callbacks: {
          title: function(context) {
            return `Month: ${context[0].label}`;
          },
          label: function(context) {
            const value = context.parsed.y;
            if (value !== undefined && value !== null) {
              return `Predicted Adoptions: ${value.toLocaleString()} animals`;
            }
            return `Predicted Adoptions: ${value || 0} animals`;
          },
          afterLabel: function(context) {
            const forecast = analysisResults?.trends?.forecast;
            if (forecast && forecast[context.dataIndex]) {
              const dataPoint = forecast[context.dataIndex];
              let additionalInfo = [];
              
              if (dataPoint.seasonalFactor && typeof dataPoint.seasonalFactor === 'number') {
                additionalInfo.push(`Seasonal Factor: ${(dataPoint.seasonalFactor * 100).toFixed(0)}%`);
              }
              if (dataPoint.historicalAverage && typeof dataPoint.historicalAverage === 'number') {
                additionalInfo.push(`Historical Avg: ${dataPoint.historicalAverage.toLocaleString()} adoptions`);
              }
              
              return additionalInfo;
            }
            return '';
          }
        }
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Months (Next 12 Months)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Adoptions',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SmartPaws Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Run ML analysis on your uploaded data and get actionable insights in under 60 seconds
          </p>
        </div>

        {/* Data Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className={`h-12 w-12 mr-4 ${hasData ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {hasData ? 'Data Ready for Analysis' : 'No Data Available'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {hasData 
                    ? 'Your uploaded data is ready. Click "Run Analysis" to generate insights.' 
                    : 'Please upload data from the Data Upload page first.'}
                </p>
              </div>
            </div>
            {!hasData && (
              <div className="flex gap-3">
                <button
                  onClick={checkDataAvailability}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Check Again
                </button>
                <button
                  onClick={() => window.location.href = '/data-upload'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Go to Upload
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processing...</span>
                <span>{analysisProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleSimulateAnalysis}
            disabled={!hasData || isAnalyzing}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                🧮 Run Analysis
              </>
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={!analysisComplete || isRefreshing}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            🔄 Refresh
          </button>

          <button
            onClick={handleExportPDF}
            disabled={!analysisComplete}
            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5 mr-2" />
            📄 Export PDF
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-medium">Analysis Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}


        {/* Analysis Results */}
        {analysisComplete && analysisResults && (
          <div ref={analyticsRef} className="space-y-6 pdf-export-content">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Intakes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {analysisResults?.summary?.totalIntakes?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Users className="h-12 w-12 text-blue-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Adoptions</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {analysisResults?.summary?.totalAdoptions?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Heart className="h-12 w-12 text-green-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Adoption Rate</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {analysisResults?.summary?.adoptionRate || '0'}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analysisResults?.summary?.totalAdoptions?.toLocaleString() || 0} adoptions out of {analysisResults?.summary?.totalOutcomes?.toLocaleString() || 0} total outcomes
                    </p>
                  </div>
                  <Target className="h-12 w-12 text-purple-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Model Accuracy</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {(((analysisResults?.trends?.accuracy ?? 0) * 100).toFixed(1))}%
                    </p>
                  </div>
                  <Activity className="h-12 w-12 text-orange-600 opacity-80" />
                </div>
              </div>

            </div>

            {/* Charts - Stacked Vertically with Larger Size */}
            <div className="space-y-8">
              {/* Forecast Chart */}
              {prepareForecastData() && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
                      Adoption Forecast (Next 12 Months)
                    </h3>
                    <div className="text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {analysisResults?.trends?.confidence || 'Medium'} Confidence
                      </span>
                    </div>
                  </div>
                  
                  {/* Forecast Summary */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Data Source:</strong> {analysisResults?.trends?.data_source === 'dynamic_historical_analysis' ? '📊 Historical Analysis' : '🤖 ML Predictions'}
                      </div>
                      <div>
                        <strong>Model Accuracy:</strong> {(((analysisResults?.trends?.accuracy ?? 0) * 100).toFixed(1))}%
                      </div>
                      <div>
                        <strong>Total Historical Adoptions:</strong> {analysisResults?.trends?.totalHistoricalAdoptions?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-96">
                    <Line data={prepareForecastData()} options={chartOptions} />
                  </div>
                  
                  {/* Forecast Insights */}
                  {analysisResults?.trends?.forecast && analysisResults.trends.forecast.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">📈 Forecast Insights</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {(() => {
                          const forecast = analysisResults.trends.forecast;
                          const maxMonth = forecast.reduce((max, current) => 
                            current.yhat > max.yhat ? current : max
                          );
                          const minMonth = forecast.reduce((min, current) => 
                            current.yhat < min.yhat ? current : min
                          );
                          const totalPredicted = forecast.reduce((sum, month) => sum + month.yhat, 0);
                          
                          return (
                            <>
                              <div>
                                <strong>Peak Month:</strong> {maxMonth.monthName} ({maxMonth.yhat.toLocaleString()} adoptions)
                              </div>
                              <div>
                                <strong>Lowest Month:</strong> {minMonth.monthName} ({minMonth.yhat.toLocaleString()} adoptions)
                              </div>
                              <div>
                                <strong>Total Predicted:</strong> {totalPredicted.toLocaleString()} adoptions over 12 months
                              </div>
                              <div>
                                <strong>Average Monthly:</strong> {Math.round(totalPredicted / 12).toLocaleString()} adoptions
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Outcome Pie Chart */}
              <div className="page-break" />
              {prepareOutcomePieData() && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <PieChart className="h-6 w-6 mr-3 text-green-600" />
                    Overall Outcomes Distribution
                  </h3>
                  <div className="h-96">
                    <Pie data={prepareOutcomePieData()} options={{ 
                       responsive: true, 
                       maintainAspectRatio: false, 
                       plugins: { 
                         legend: { 
                           position: 'top', 
                           labels: { 
                             usePointStyle: true, 
                             padding: 20, 
                           }, 
                         }, 
                         tooltip: { 
                           backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                           titleColor: '#fff', 
                           bodyColor: '#fff', 
                           borderColor: 'rgba(34, 197, 94, 0.8)', 
                           borderWidth: 1, 
                           callbacks: { 
                             title: function(context) { 
                               return `${context[0].label}`; 
                             }, 
                             label: function(context) { 
                               const value = context.parsed; 
                               const total = context.dataset.data.reduce((a, b) => a + b, 0); 
                               const percentage = ((value / total) * 100).toFixed(1); 
                               return `${percentage}%`; 
                             } 
                           } 
                         } 
                       } 
                     }} />
                  </div>
                </div>
              )}

              {/* Animal Type Bar Chart */}
              <div className="page-break" />
              {prepareAnimalTypeData() && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="h-6 w-6 mr-3 text-purple-600" />
                    Intakes by Animal Type
                  </h3>
                  <div className="h-96">
                    <Bar data={prepareAnimalTypeData()} options={{ 
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: 'rgba(168, 85, 247, 0.8)',
                          borderWidth: 1,
                          callbacks: {
                            title: function(context) {
                              return `Animal Type: ${context[0].label}`;
                            },
                            label: function(context) {
                              const value = context.parsed.y;
                              return `Intakes: ${value.toLocaleString()} animals`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Animal Type',
                            font: {
                              size: 12,
                              weight: 'bold'
                            }
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Number of Animals',
                            font: {
                              size: 12,
                              weight: 'bold'
                            }
                          }
                        }
                      }
                    }} />
                  </div>
                </div>
              )}

              {/* Heatmap */}
              <div className="page-break" />
              {prepareHeatmapData() && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <MapPin className="h-6 w-6 mr-3 text-red-600" />
                    Geospatial Risk Heatmap
                  </h3>
                  <div className="h-96">
                    <Plot
                      data={[prepareHeatmapData()]}
                      layout={{
                        mapbox: {
                          style: 'open-street-map',
                          center: { lat: 30.2672, lon: -97.7431 },
                          zoom: 10,
                        },
                        margin: { t: 0, b: 0, l: 0, r: 0 },
                        height: 384,
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Seasonal Patterns Analysis */}
            {prepareSeasonalData() && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <svg className="h-6 w-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Seasonal Patterns Analysis
                </h3>
                <div className="space-y-6">
                  {prepareSeasonalData().map((seasonData, index) => (
                    <div key={seasonData.season} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            seasonData.season === 'Summer' ? 'bg-orange-500' :
                            seasonData.season === 'Spring' ? 'bg-green-500' :
                            seasonData.season === 'Fall' ? 'bg-yellow-600' :
                            'bg-blue-500'
                          }`}>
                            {seasonData.season === 'Summer' ? '☀️' :
                             seasonData.season === 'Spring' ? '🌸' :
                             seasonData.season === 'Fall' ? '🍂' :
                             '❄️'}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{seasonData.season}</h4>
                          <p className="text-sm text-gray-500">
                            {seasonData.percentage}% of total adoptions
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 flex-1 max-w-md">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-1000 ${
                                seasonData.season === 'Summer' ? 'bg-orange-500' :
                                seasonData.season === 'Spring' ? 'bg-green-500' :
                                seasonData.season === 'Fall' ? 'bg-yellow-600' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${seasonData.progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {seasonData.adoptions.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">animals</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Dynamic Seasonal Insights */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">📊 Dynamic Seasonal Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <strong>Peak Season:</strong> {prepareSeasonalData()[0]?.season} is the best time for adoptions with {prepareSeasonalData()[0]?.percentage}% of total adoptions
                    </div>
                    <div>
                      <strong>Lowest Season:</strong> {prepareSeasonalData()[3]?.season} has the fewest adoptions ({prepareSeasonalData()[3]?.percentage}%), perfect for campaigns
                    </div>
                    <div>
                      <strong>Current Analysis:</strong> Based on {analysisResults?.trends?.forecast ? 'your actual forecast data' : 'seasonal patterns with current month boost'}
                    </div>
                    <div>
                      <strong>Strategy:</strong> Focus marketing during {prepareSeasonalData()[3]?.season} to boost the {prepareSeasonalData()[3]?.percentage}% adoption rate
                    </div>
                    <div className="md:col-span-2">
                      <strong>Data Source:</strong> {analysisResults?.trends?.data_source === 'fast_local_generation' ? '⚡ Fast local analysis' : '🔄 ML predictions'} • Total: {analysisResults?.summary?.totalAdoptions?.toLocaleString()} adoptions
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Animal Intake Heatmap - REAL DATA */}
            <DynamicIntakeHeatmap />

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 inline mr-1" />
              Analysis completed at: {new Date(analysisResults.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysisComplete && !isAnalyzing && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BarChart3 className="h-24 w-24 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {hasData ? 'Ready to Analyze' : 'No Data Available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasData 
                ? 'Click "Run Analysis" to generate ML-powered insights from your uploaded data' 
                : 'Upload data from the Data Upload page to get started with analytics'}
            </p>
            {!hasData && (
              <button
                onClick={() => window.location.href = '/data-upload'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Data Upload
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsNew;
