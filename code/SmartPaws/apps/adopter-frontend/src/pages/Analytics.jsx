import React, { useState, useEffect, useCallback } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
} from 'chart.js';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Calendar,
  Users,
  Heart,
  AlertTriangle,
  Download,
  Filter,
  PieChart,
  Activity,
  Eye,
  RefreshCw,
  Database,
  Layers,
  Zap,
  Globe,
  Loader2
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Plot from 'react-plotly.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, PointElement, LineElement, ChartTitle);

const Analytics = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend-driven state
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [coordinates, setCoordinates] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [summaryRes, trendsRes, hotspotsRes] = await Promise.all([
        api.get('/analytics/summary', { headers }),
        api.get('/predictions/trends', { headers }),
        api.get('/predictions/hotspots', { headers }),
      ]);

      // Debug logging to check what data is being received
      console.log('🔍 Analytics API Response Debug:');
      console.log('Summary data:', summaryRes.data);
      console.log('Trends data:', trendsRes.data);
      console.log('Hotspots data:', hotspotsRes.data);

      // Process summary data
      setSummary(summaryRes.data);
      
      // Process forecast data
      const trendsData = trendsRes.data || {};
      const forecastData = Array.isArray(trendsData.forecast) ? trendsData.forecast : [];
      setForecast(forecastData);
      setAccuracy(typeof trendsData.accuracy === 'number' ? trendsData.accuracy : null);
      
      // Process hotspots data
      const hotspotsData = hotspotsRes.data || {};
      const hotspotsArray = Array.isArray(hotspotsData.hotspots) ? hotspotsData.hotspots : [];
      const coordinatesArray = Array.isArray(hotspotsData.coordinates) ? hotspotsData.coordinates : [];
      
      setHotspots(hotspotsArray);
      setCoordinates(coordinatesArray);
      setLastUpdated(new Date().toISOString());

      // Debug logging for processed data
      console.log('📊 Processed Analytics Data:');
      console.log('Summary:', summaryRes.data);
      console.log('Forecast points:', forecastData.length);
      console.log('Hotspots:', hotspotsArray.length);
      console.log('Coordinates:', coordinatesArray.length);
      
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      setError(error.response?.data?.message || 'Failed to fetch analytics data');
      
      // Reset state on error
      setSummary(null);
      setForecast([]);
      setAccuracy(null);
      setHotspots([]);
      setCoordinates([]);
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);


  // Process forecast data for trends - ONLY use real ML data
  const adoptionTrends = Array.isArray(forecast) && forecast.length > 0
    ? forecast.map((pt) => ({
        month: pt.ds,
        adoptions: pt.actual_adoptions || 0, // Real historical data from ML analysis
        predictions: Math.round(pt.yhat || 0),
        intakes: pt.actual_intakes || 0, // Real historical data from ML analysis
      }))
    : []; // Empty array when no real ML data

  // Process hotspots data with meaningful location names
  const getLocationName = (hotspot, index) => {
    // If hotspot has a name or location, use it
    if (hotspot.name && hotspot.name !== `Area ${index + 1}`) return hotspot.name;
    if (hotspot.location && hotspot.location !== `Area ${index + 1}`) return hotspot.location;
    
    // Generate meaningful names based on Austin geography and coordinates
    const austinAreas = [
      'Downtown Austin', 'East Austin', 'South Austin', 'North Austin', 'West Austin',
      'Cedar Park Area', 'Round Rock Area', 'Pflugerville Area', 'Georgetown Area', 'Leander Area',
      'Lakeway Area', 'Bee Cave Area', 'Dripping Springs Area', 'Bastrop Area', 'Manor Area',
      'Del Valle Area', 'Oak Hill Area', 'Westlake Area', 'Rollingwood Area', 'Sunset Valley Area'
    ];
    
    // If we have coordinates, try to map to realistic Austin areas
    if (hotspot.latitude && hotspot.longitude) {
      const lat = Number(hotspot.latitude);
      const lon = Number(hotspot.longitude);
      
      // Austin downtown area (rough coordinates)
      if (lat >= 30.25 && lat <= 30.28 && lon >= -97.75 && lon <= -97.73) {
        return 'Downtown Austin';
      }
      // East Austin
      else if (lat >= 30.25 && lat <= 30.30 && lon >= -97.73 && lon <= -97.70) {
        return 'East Austin';
      }
      // South Austin
      else if (lat >= 30.20 && lat <= 30.25 && lon >= -97.80 && lon <= -97.73) {
        return 'South Austin';
      }
      // North Austin
      else if (lat >= 30.30 && lat <= 30.40 && lon >= -97.75 && lon <= -97.70) {
        return 'North Austin';
      }
      // West Austin
      else if (lat >= 30.25 && lat <= 30.30 && lon >= -97.80 && lon <= -97.75) {
        return 'West Austin';
      }
    }
    
    // Fallback to cycling through Austin area names
    return austinAreas[index % austinAreas.length];
  };

  // Process hotspots data - ONLY use real ML analysis results
  const riskAreas = (() => {
    // Only use data if ML service has processed real data and returned meaningful results
    const hasValidHotspots = Array.isArray(hotspots) && hotspots.length > 0 && 
      hotspots.some(h => (h.count || h.incidents || h.animal_count || 0) > 0);
    
    if (hasValidHotspots) {
      // Use ONLY real hotspot data from ML service
      return hotspots.slice(0, 10).map((h, idx) => ({
        name: h.name || h.location || `Area ${idx + 1}`, // Use actual names from ML analysis
        riskLevel: h.riskLevel || h.risk_level || (h.count > 50 ? 'High' : h.count > 20 ? 'Medium' : 'Low'),
        incidents: h.count || h.incidents || h.animal_count || 0,
        trend: h.trend || (h.percentage ? `+${h.percentage.toFixed(1)}%` : '0%'),
        coordinates: h.coordinates || `${h.latitude || 0}, ${h.longitude || 0}`,
        description: h.description || 'ML-predicted risk area',
      }));
    } else {
      // Return empty array when no real ML data is available
      return [];
    }
  })();

  // Process seasonal data from summary if available
  const seasonalData = summary?.seasonalBreakdown || [];

  // Animal type breakdown (from summary.animalTypeBreakdown)
  const animalTypeData = Array.isArray(summary?.animalTypeBreakdown) && summary.animalTypeBreakdown.length > 0
    ? summary.animalTypeBreakdown.map((row, idx) => ({
        type: row._id || 'Unknown',
        adoptions: 0,
        intakes: row.intakes || 0,
        color: idx % 3 === 0 ? 'bg-blue-500' : idx % 3 === 1 ? 'bg-green-500' : 'bg-purple-500',
      }))
    : [];

  const totalAnimals = typeof summary?.totalAnimals === 'number'
    ? summary.totalAnimals
    : animalTypeData.reduce((sum, item) => sum + (item.intakes || 0), 0);

  // Intake condition breakdown (from summary.intakeConditionBreakdown)
  const intakeConditionData = Array.isArray(summary?.intakeConditionBreakdown) && summary.intakeConditionBreakdown.length > 0
    ? summary.intakeConditionBreakdown.map((row) => ({
        condition: row._id || 'Unknown',
        count: row.count || 0,
        percentage: 0,
        color: row._id === 'Normal' ? 'bg-green-500' : 
               row._id === 'Sick' ? 'bg-yellow-500' : 
               row._id === 'Injured' ? 'bg-orange-500' : 'bg-red-500',
      }))
    : [];

  // Available animal types for filtering
  const availableAnimalTypes = animalTypeData.map(item => item.type).filter(Boolean);

  // Enhanced PDF Export functionality
  const handleExportReport = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Create a new PDF with proper dimensions (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      
      let currentY = margin;
      let pageNumber = 1;

      // Helper function to add header
      const addHeader = () => {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 102, 204);
        pdf.text('SmartPaws Analytics Report', pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;
        
        // Add date info
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        const generatedDate = new Date().toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        });
        pdf.text(`Generated: ${generatedDate}`, margin, currentY);
        
        if (lastUpdated) {
          const updatedDate = new Date(lastUpdated).toLocaleString('en-US', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          });
          pdf.text(`Last Updated: ${updatedDate}`, pageWidth - margin, currentY, { align: 'right' });
        }
        currentY += 5;
        
        // Add separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;
      };

      // Helper function to add footer
      const addFooter = (pageNum) => {
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${pageNum} | SmartPaws Analytics`, 
          pageWidth / 2, 
          pageHeight - 10, 
          { align: 'center' }
        );
      };

      // Helper function to check if new page is needed
      const checkNewPage = (spaceNeeded) => {
        if (currentY + spaceNeeded > pageHeight - 25) {
          addFooter(pageNumber);
          pdf.addPage();
          pageNumber++;
          currentY = margin;
          addHeader();
          return true;
        }
        return false;
      };

      // Helper function to add section title
      const addSectionTitle = (title) => {
        checkNewPage(15);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 51, 51);
        pdf.text(title, margin, currentY);
        currentY += 8;
      };

      // Helper function to capture and add element to PDF with robust error handling
      const captureAndAddElement = async (elementId, title, options = {}) => {
        const {
          maxHeight = 120,
          retries = 3,
          waitTime = 800
        } = options;

        const element = document.getElementById(elementId);
        if (!element) {
          console.warn(`⚠️ Element ${elementId} not found, skipping...`);
          return false;
        }

        // Check if element is visible
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn(`⚠️ Element ${elementId} has zero dimensions, skipping...`);
          return false;
        }

        let attempt = 0;
        let originalStyles = {};
        
        while (attempt < retries) {
          try {
            attempt++;
            console.log(`📸 Capturing ${elementId} (attempt ${attempt}/${retries})...`);
            
            // Store original styles and remove height constraints
            const heightConstrainedElements = element.querySelectorAll('.h-64, .h-72, .h-80, .h-96');
            heightConstrainedElements.forEach((el, index) => {
              originalStyles[index] = {
                element: el,
                height: el.style.height,
                minHeight: el.style.minHeight,
                maxHeight: el.style.maxHeight,
                overflow: el.style.overflow
              };
              el.style.height = 'auto';
              el.style.minHeight = '500px';
              el.style.maxHeight = 'none';
              el.style.overflow = 'visible';
            });
            
            // Also set the main element
            const mainOriginalStyle = {
              height: element.style.height,
              minHeight: element.style.minHeight,
              maxHeight: element.style.maxHeight,
              overflow: element.style.overflow
            };
            element.style.height = 'auto';
            element.style.minHeight = '400px';
            element.style.maxHeight = 'none';
            element.style.overflow = 'visible';
            
            // Ensure element is in viewport
            element.scrollIntoView({ 
              behavior: 'instant', 
              block: 'center',
              inline: 'center'
            });
            
            // Wait for reflow and any animations/renders to complete
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Get element dimensions
            const elementRect = element.getBoundingClientRect();
            const elementWidth = element.offsetWidth || elementRect.width;
            const elementHeight = element.offsetHeight || elementRect.height;
            
            console.log(`📐 Element dimensions: ${elementWidth}x${elementHeight}px`);
            
            // Capture with optimal settings
            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff',
              windowWidth: Math.max(element.scrollWidth, elementWidth),
              windowHeight: Math.max(element.scrollHeight, elementHeight),
              width: elementWidth,
              height: elementHeight,
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              foreignObjectRendering: false,
              removeContainer: true
            });
            
            // Verify canvas was created successfully
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
              throw new Error('Canvas creation failed or has zero dimensions');
            }
            
            console.log(`✅ Canvas created: ${canvas.width}x${canvas.height}px`);
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgProps = pdf.getImageProperties(imgData);
            
            // Calculate dimensions maintaining aspect ratio
            const pdfWidth = contentWidth;
            let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Apply maxHeight constraint if needed
            if (pdfHeight > maxHeight) {
              console.log(`📏 Scaling down from ${pdfHeight.toFixed(1)}mm to ${maxHeight}mm`);
              pdfHeight = maxHeight;
            }
            
            // Ensure we have space on current page
            checkNewPage(pdfHeight + 20);
            
            // Add section title if provided
            if (title) {
              addSectionTitle(title);
            }
            
            // Add image to PDF
            pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth, pdfHeight, undefined, 'FAST');
            currentY += pdfHeight + 10;
            
            console.log(`✅ Successfully added ${elementId} to PDF`);
            
            // Restore original styles
            Object.values(originalStyles).forEach(style => {
              if (style.element) {
                style.element.style.height = style.height;
                style.element.style.minHeight = style.minHeight;
                style.element.style.maxHeight = style.maxHeight;
                style.element.style.overflow = style.overflow;
              }
            });
            element.style.height = mainOriginalStyle.height;
            element.style.minHeight = mainOriginalStyle.minHeight;
            element.style.maxHeight = mainOriginalStyle.maxHeight;
            element.style.overflow = mainOriginalStyle.overflow;
            
            return true;
            
          } catch (error) {
            console.error(`❌ Error capturing ${elementId} (attempt ${attempt}/${retries}):`, error);
            
            // Restore original styles on error
            Object.values(originalStyles).forEach(style => {
              if (style.element) {
                style.element.style.height = style.height;
                style.element.style.minHeight = style.minHeight;
                style.element.style.maxHeight = style.maxHeight;
                style.element.style.overflow = style.overflow;
              }
            });
            
            if (attempt >= retries) {
              console.error(`❌ Failed to capture ${elementId} after ${retries} attempts`);
              
              // Add error placeholder in PDF
              checkNewPage(30);
              if (title) {
                addSectionTitle(title);
              }
              pdf.setFontSize(10);
              pdf.setTextColor(200, 50, 50);
              pdf.text(`Failed to capture chart: ${elementId}`, margin + 5, currentY + 10);
              pdf.setTextColor(51, 51, 51);
              currentY += 20;
              
              return false;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        return false;
      };

      // Start PDF generation
      console.log('🎨 Starting PDF generation...');
      console.log('⏳ Please wait - expanding charts for full capture...');
      
      // Wait for all charts to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addHeader();

      // 1. Add Summary Metrics
      addSectionTitle('Key Performance Metrics');
      const metricsData = [
        { label: 'Total Adoptions', value: summary?.totalAdoptions?.toLocaleString() || '0', color: [220, 53, 69] },
        { label: 'Total Intakes', value: summary?.totalIntakes?.toLocaleString() || '0', color: [13, 110, 253] },
        { label: 'Adoption Rate', value: summary?.adoptionRate ? `${Number(summary.adoptionRate).toFixed(1)}%` : 'N/A', color: [25, 135, 84] },
        { label: 'ML Accuracy', value: typeof accuracy === 'number' ? `${Math.round(accuracy * 100)}%` : 'N/A', color: [255, 193, 7] }
      ];

      const boxWidth = (contentWidth - 10) / 2;
      const boxHeight = 20;
      let boxX = margin;
      let boxY = currentY;

      metricsData.forEach((metric, index) => {
        if (index % 2 === 0 && index > 0) {
          boxY += boxHeight + 5;
          boxX = margin;
        }

        // Draw box background
        pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'S');
        
        // Add label
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(metric.label, boxX + 5, boxY + 7);
        
        // Add value
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.text(metric.value, boxX + 5, boxY + 16);
        
        boxX += boxWidth + 5;
      });

      currentY = boxY + boxHeight + 15;

      // 2. Add Animal Type Distribution Chart
      await captureAndAddElement('animal-type-chart', 'Animal Type Distribution', {
        maxHeight: 150,
        waitTime: 1500
      });

      // 3. Add Intake Condition Chart
      await captureAndAddElement('intake-condition-chart', 'Intake Condition Analysis', {
        maxHeight: 120,
        waitTime: 1500
      });

      // 4. Add Forecast Chart
      if (forecast.length > 0) {
        await captureAndAddElement('forecast-chart-section', 'Adoption Forecast Analysis', {
          maxHeight: 150,
          waitTime: 2000
        });
      }

      // 5. Add Forecast Plot (Plotly needs more time to render)
      if (forecast.length > 0) {
        await captureAndAddElement('forecast-plot-section', 'Future Adoption Trend Forecast', {
          maxHeight: 150,
          waitTime: 2500
        });
      }

      // 6. Add Risk Areas Table
      if (riskAreas.length > 0) {
        checkNewPage(60);
        addSectionTitle('Top Risk Areas');
        
        // Table header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 51, 51);
        pdf.text('Location', margin + 3, currentY + 5.5);
        pdf.text('Risk Level', margin + 80, currentY + 5.5);
        pdf.text('Incidents', margin + 120, currentY + 5.5);
        pdf.text('Trend', margin + 150, currentY + 5.5);
        currentY += 8;
        
        // Table rows
        pdf.setFont('helvetica', 'normal');
        riskAreas.slice(0, 10).forEach((area, index) => {
          if (checkNewPage(7)) {
            // Re-add table header on new page
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, currentY, contentWidth, 8, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Location', margin + 3, currentY + 5.5);
            pdf.text('Risk Level', margin + 80, currentY + 5.5);
            pdf.text('Incidents', margin + 120, currentY + 5.5);
            pdf.text('Trend', margin + 150, currentY + 5.5);
            currentY += 8;
            pdf.setFont('helvetica', 'normal');
          }
          
          // Alternate row colors
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, currentY, contentWidth, 7, 'F');
          }
          
          pdf.setFontSize(8);
          pdf.setTextColor(51, 51, 51);
          
          // Truncate long location names
          const locationName = area.name.length > 30 ? area.name.substring(0, 27) + '...' : area.name;
          pdf.text(locationName, margin + 3, currentY + 5);
          
          // Risk level with color
          const riskColor = area.riskLevel === 'High' ? [220, 53, 69] : 
                           area.riskLevel === 'Medium' ? [255, 193, 7] : [25, 135, 84];
          pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
          pdf.text(area.riskLevel, margin + 80, currentY + 5);
          
          pdf.setTextColor(51, 51, 51);
          pdf.text(area.incidents.toString(), margin + 120, currentY + 5);
          pdf.text(area.trend, margin + 150, currentY + 5);
          
          currentY += 7;
        });
        
        currentY += 5;
      }

      // 7. Add Heatmap if available (Plotly heatmap needs extra time)
      if (coordinates.length > 0) {
        await captureAndAddElement('heatmap-section', 'Geospatial Risk Heatmap', {
          maxHeight: 150,
          waitTime: 2500
        });
      }

      // 8. Add Summary Statistics
      checkNewPage(40);
      addSectionTitle('Summary Statistics');
      
      const stats = [
        { label: 'Total Animals Processed', value: totalAnimals.toLocaleString() },
        { label: 'Total Outcomes Recorded', value: (summary?.totalOutcomes || 0).toLocaleString() },
        { label: 'Forecast Data Points', value: forecast.length.toString() },
        { label: 'Risk Areas Identified', value: riskAreas.length.toString() },
        { label: 'Coordinate Points Analyzed', value: coordinates.length.toLocaleString() }
      ];

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      stats.forEach((stat, index) => {
        if (checkNewPage(7)) return;
        
        pdf.setTextColor(100, 100, 100);
        pdf.text(stat.label, margin, currentY);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 51, 51);
        pdf.text(stat.value, pageWidth - margin, currentY, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        currentY += 7;
      });

      // Add final footer
      addFooter(pageNumber);

      // Scroll back to top
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Save the PDF
      const filename = `SmartPaws-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      console.log('✅ PDF report generated successfully:', filename);
      console.log(`📄 Total pages: ${pageNumber}`);

    } catch (error) {
      console.error('❌ Error generating PDF report:', error);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [summary, accuracy, forecast, hotspots, coordinates, lastUpdated, totalAnimals, riskAreas, setIsProcessing, setError]);

  // Build Pie chart config for animal type distribution
  const pieLabels = animalTypeData.map(a => a.type || 'Unknown');
  const pieValues = animalTypeData.map(a => a.intakes || 0);
  // Vibrant color palette for the pie
  // Palette similar to Google Charts vibrant set (from the provided example)
  const palette = [
    '#3366CC', // blue
    '#DC3912', // red
    '#FF9900', // orange
    '#109618', // green
    '#990099', // purple
    '#0099C6', // cyan
    '#DD4477', // pink red
    '#66AA00', // lime
    '#B82E2E', // dark red
    '#316395', // steel blue
  ];
  const pieColors = animalTypeData.map((_, i) => palette[i % palette.length] + 'B3'); // ~70% alpha
  const pieBorderColors = animalTypeData.map((_, i) => palette[i % palette.length]);

  const animalTypePieData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieValues,
        backgroundColor: pieColors,
        borderColor: pieBorderColors,
        borderWidth: 1,
      },
    ],
  };

  const animalTypePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || '';
            const value = ctx.raw || 0;
            const pct = totalAnimals > 0 ? Math.round((value / totalAnimals) * 100) : 0;
            return `${label}: ${value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  // Forecast line chart (dynamic)
  const lineLabels = forecast.map(p => p.ds);
  const lineValues = forecast.map(p => Number(p.yhat || 0).toFixed ? Number(p.yhat || 0) : 0);
  const forecastLineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Predicted Adoptions',
        data: lineValues,
        borderColor: '#3366CC',
        backgroundColor: 'rgba(51, 102, 204, 0.2)',
        pointRadius: 2,
        tension: 0.3,
      },
    ],
  };
  const forecastLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { maxRotation: 0 } }, y: { beginAtZero: true } },
  };

  // Plotly forecast with optional confidence interval
  const plotX = forecast.map(p => p.ds);
  const plotY = forecast.map(p => Number(p.yhat || 0));
  const hasCI = forecast.some(p => p?.yhat_lower != null && p?.yhat_upper != null);
  const ciLower = hasCI ? forecast.map(p => Number(p.yhat_lower)) : [];
  const ciUpper = hasCI ? forecast.map(p => Number(p.yhat_upper)) : [];

  const forecastPlotData = hasCI
    ? [
        {
          x: plotX,
          y: ciLower,
          mode: 'lines',
          line: { color: 'rgba(0,0,0,0)' },
          hoverinfo: 'skip',
          showlegend: false,
          name: 'Lower CI',
        },
        {
          x: plotX,
          y: ciUpper,
          mode: 'lines',
          fill: 'tonexty',
          fillcolor: 'rgba(51,102,204,0.15)',
          line: { color: 'rgba(0,0,0,0)' },
          hoverinfo: 'skip',
          showlegend: true,
          name: 'Uncertainty',
        },
        {
          x: plotX,
          y: plotY,
          mode: 'lines',
          line: { color: '#3366CC', width: 2 },
          name: 'Forecast',
        },
      ]
    : [
        {
          x: plotX,
          y: plotY,
          mode: 'lines',
          line: { color: '#3366CC', width: 2 },
          name: 'Forecast',
        },
      ];

  const forecastPlotLayout = {
    margin: { l: 60, r: 20, t: 10, b: 40 },
    xaxis: { title: 'Date', zeroline: false },
    yaxis: { title: 'Number of Adoptions', rangemode: 'tozero', zeroline: false },
    showlegend: true,
    legend: { orientation: 'h', x: 0, y: 1.15 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      case 'None': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getTrendIcon = (trend) => {
    return trend.startsWith('+') ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SmartPaws Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            ML-powered analysis: Risk prediction, trend forecasting, and big data insights
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-gray-400">
              Last updated: {formatDate(lastUpdated)}
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button 
            className="btn-secondary flex items-center" 
            onClick={() => fetchAnalytics()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Analysis
          </button>
          <button 
            className="btn-primary flex items-center" 
            onClick={handleExportReport}
            disabled={!summary}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>



      {/* Error Status */}
      {error && (
        <div className="card bg-red-50 border-red-200 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Data</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => fetchAnalytics()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Status */}
      {(isLoading || isProcessing) && !error && (
        <div className="card bg-blue-50 border-blue-200 mb-6">
          <div className="flex items-center">
            <Loader2 className="h-8 w-8 text-blue-600 mr-4 animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {isLoading ? 'Loading Analytics' : 'Processing Data'}
              </h3>
              <p className="text-sm text-blue-700">
                {isLoading 
                  ? 'Fetching data from backend and ML services...'
                  : 'Running ML analysis: Prophet forecasting, K-Means clustering, and geospatial analysis...'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Data Status */}
      {!isLoading && !isProcessing && !error && (!summary && forecast.length === 0 && riskAreas.length === 0) && (
        <div className="card bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">No Data Available</h3>
              <p className="text-sm text-yellow-700">
                Upload intake/outcome data files to see analytics and ML predictions.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Ensure the ML service is running and data has been processed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Ready Status - Only show when there's REAL data */}
      {!isLoading && !isProcessing && !error && (
        summary?.totalIntakes > 0 || 
        summary?.totalOutcomes > 0 || 
        (forecast.length > 0 && forecast.some(f => f.yhat > 0)) ||
        (riskAreas.length > 0 && riskAreas.some(r => r.incidents > 0))
      ) && (
        <div className="card bg-green-50 border-green-200 mb-6">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Analytics Ready</h3>
              <p className="text-sm text-green-700">
                ML analysis complete. Showing {summary?.totalIntakes || 0} intake records, 
                {forecast.length} forecast points, and {riskAreas.length} risk areas.
              </p>
              {lastUpdated && (
                <p className="text-xs text-green-600 mt-1">
                  Last updated: {formatDate(lastUpdated)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Real Data Status - Show when backend has no meaningful data */}
      {!isLoading && !isProcessing && !error && (
        (!summary || (summary.totalIntakes === 0 && summary.totalOutcomes === 0)) &&
        forecast.length === 0 &&
        riskAreas.length === 0
      ) && (
        <div className="card bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">No Data in Backend</h3>
              <p className="text-sm text-yellow-700">
                The backend database appears to be empty. Upload intake/outcome CSV files to see ML analysis.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                ML models require historical data to generate predictions and risk assessments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Core Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-900">Risk Prediction</h3>
              <p className="text-sm text-red-700">Geospatial heatmaps</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900">Trend Forecasting</h3>
              <p className="text-sm text-blue-700">Seasonal patterns</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Web Dashboard</h3>
              <p className="text-sm text-green-700">MERN + Python ML</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-purple-900">Big Data Pipeline</h3>
              <p className="text-sm text-purple-700">Large volume processing</p>
            </div>
          </div>
        </div>
      </div>


       {/* Key Metrics - Dynamic Data */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="card">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <Heart className="h-8 w-8 text-red-500" />
             </div>
             <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Adoptions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary?.totalAdoptions?.toLocaleString() || '0'}
              </p>
               <p className="text-sm text-green-600 flex items-center">
                 <TrendingUp className="h-4 w-4 mr-1" />
                 {summary?.adoptionRate ? `${Number(summary.adoptionRate).toFixed(1)}% rate` : 'No data'}
               </p>
             </div>
           </div>
         </div>

         <div className="card">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <Users className="h-8 w-8 text-blue-500" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-500">Total Intakes</p>
               <p className="text-2xl font-semibold text-gray-900">
                 {summary?.totalIntakes?.toLocaleString() || '0'}
               </p>
               <p className="text-sm text-blue-600 flex items-center">
                 <Activity className="h-4 w-4 mr-1" />
                 {summary?.totalOutcomes ? `${summary.totalOutcomes.toLocaleString()} outcomes` : 'No data'}
               </p>
             </div>
           </div>
         </div>

         <div className="card">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <AlertTriangle className="h-8 w-8 text-orange-500" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-500">Risk Areas</p>
               <p className="text-2xl font-semibold text-gray-900">{riskAreas.length}</p>
               <p className="text-sm text-orange-600 flex items-center">
                 <MapPin className="h-4 w-4 mr-1" />
                 {coordinates.length} coordinates
               </p>
             </div>
           </div>
         </div>

         <div className="card">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <BarChart3 className="h-8 w-8 text-green-500" />
             </div>
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-500">ML Accuracy</p>
               <p className="text-2xl font-semibold text-gray-900">
                 {typeof accuracy === 'number' ? `${Math.round(accuracy * 100)}%` : 'N/A'}
               </p>
               <p className="text-sm text-green-600 flex items-center">
                 <Zap className="h-4 w-4 mr-1" />
                 {forecast.length} predictions
               </p>
             </div>
           </div>
         </div>
       </div>

      {/* ML Analytics Charts - Only show when there's real data */}
      {(animalTypeData.length > 0 && totalAnimals > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Animal Type Distribution */}
          <div id="animal-type-chart" className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Animal Type Distribution</h3>
          </div>
          
          <div className="flex flex-col items-center mb-6">
            {/* Pie Chart Section */}
            <div className="h-64 w-full max-w-sm mb-6">
              <Pie data={animalTypePieData} options={animalTypePieOptions} />
            </div>
            
            {/* Total Animals Section */}
            <div className="text-center mb-8">
              <div className="text-2xl font-bold text-gray-900">{totalAnimals.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Animals</div>
            </div>
            
            {/* Legend Section */}
            <div className="w-full max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {animalTypeData.map((item, index) => {
                  const pct = totalAnimals > 0 ? Math.round((item.intakes / totalAnimals) * 100) : 0;
                  const swatch = palette[index % palette.length];
                  return (
                    <div key={index} className="flex items-center gap-x-3 py-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: swatch }}></div>
                      <span className="text-sm font-medium text-gray-700 truncate flex-1">{item.type || 'Unknown'}</span>
                      <div className="flex items-center gap-x-2 flex-shrink-0">
                        <span className="text-sm text-gray-600 tabular-nums">{(item.intakes || 0).toLocaleString()}</span>
                        <span className="text-xs text-gray-500">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Intake Condition Analysis */}
        <div id="intake-condition-chart" className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Intake Condition Analysis</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700" onClick={fetchAnalytics} title="Refresh">
              <Eye className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {(() => {
              const filtered = intakeConditionData.filter(c => !['Behavior','Medical','Feral','Nursing'].includes(String(c.condition)));
              const totalCond = filtered.reduce((s, c) => s + (c.count || 0), 0);
              return filtered.map((condition, index) => {
                const pct = totalCond > 0 ? Math.round((condition.count / totalCond) * 100) : 0;
                return (
                  <div key={index} className="space-y-2" title={`${condition.condition}: ${condition.count.toLocaleString()} (${pct}%)`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{condition.condition}</span>
                      <span className="text-sm text-gray-600">{condition.count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${condition.color}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            })()}
          </div>
        </div>

        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adoption vs Intake Trends */}
          <div id="adoption-trends-chart" className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Adoption vs Intake Trends</h3>
            </div>
            <div className="h-64">
              <Line data={forecastLineData} options={forecastLineOptions} />
            </div>
          </div>

          {/* Seasonal Patterns */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Seasonal Patterns Analysis</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                <Activity className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {(() => {
                // ONLY use real seasonal data from ML backend analysis
                if (seasonalData.length > 0) {
                  const seasonalAgg = seasonalData.map(season => ({
                    label: season.season || season.name,
                    value: season.adoptions || season.count || season.value || 0,
                    percentage: season.percentage || 0
                  }));
                  
                  const maxValue = Math.max(...seasonalAgg.map(s => s.value), 1);
                  
                  return seasonalAgg.map((season) => (
                    <div key={season.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <span className="text-sm font-medium text-gray-700">{season.label}</span>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.round((season.value / maxValue) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{season.value.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {season.percentage ? `${season.percentage}%` : 'animals'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                } else {
                  // Show empty state when no real ML analysis is available
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No seasonal analysis available</p>
                      <p className="text-xs">Upload intake/outcome data for ML seasonal analysis</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Prophet Forecast Section */}
      <div id="forecast-chart-section" className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Prophet Model Forecast</h3>
          <div className="flex items-center text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 mr-1" />
            180-Day Prediction
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            {forecast.length > 0 
              ? `ML-powered adoption trend forecasting using Prophet model trained on your uploaded data.`
              : `Upload intake/outcome data to generate ML-powered adoption forecasts.`
            }
          </p>
        </div>
        
        {forecast.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {forecast.length}
                </div>
                <div className="text-sm text-gray-600">Forecast Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {forecast.reduce((sum, d) => sum + (d.yhat || 0), 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Total Predicted Adoptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(forecast.reduce((sum, d) => sum + (d.yhat || 0), 0) / forecast.length).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Daily Average</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Recent Forecast Sample:</h4>
          {(forecast.length > 0) ? (
            forecast.slice(0, 5).map((f, index) => (
              <div key={`${f.ds}-${index}`} className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <span className="font-medium">{f.ds}</span>
                  <span className="text-sm text-gray-500 ml-2">Predicted Adoptions</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{Number(f.yhat || 0).toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Predicted</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Upload data files to see Prophet forecast predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Adoption Trend Forecast (interactive Plotly) - Only show with real data */}
      {forecast.length > 0 && (
        <div id="forecast-plot-section" className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Future Adoption Trend Forecast</h3>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-1" />
              Interactive with uncertainty band
            </div>
          </div>
          <div className="h-72">
            <Plot
              data={forecastPlotData}
              layout={forecastPlotLayout}
              config={{ displaylogo: false, responsive: true, scrollZoom: true }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
            />
          </div>
        </div>
      )}

      {/* Geospatial Risk Heatmap */}
      <div id="heatmap-section" className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Geospatial Risk Heatmap</h3>
         
        </div>
        
        {/* GitHub-style Year vs Location Heatmap - Only show with real data */}
        {coordinates.length > 0 ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-gray-800">Year vs Location Heatmap</h4>
              <p className="text-sm text-gray-600">Animal findings distribution across years and geographic locations</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-100 border border-gray-200"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-300 border border-gray-200"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-500 border border-gray-200"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-700 border border-gray-200"></div>
                </div>
                <span className="text-xs text-gray-500">More</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <Plot
              data={(() => {
                try {
                  const points = Array.isArray(coordinates) ? coordinates : [];
                  
                  // Generate Year vs Location data from backend coordinates
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 7 }, (_, i) => String(currentYear - 6 + i));
                  
                  // Extract meaningful locations from risk areas or use Austin geography
                  let locations = [];
                  if (riskAreas.length > 0) {
                    locations = riskAreas.slice(0, 10).map(area => area.name);
                  } else {
                    // Use realistic Austin area names
                    locations = [
                      'Downtown Austin', 'East Austin', 'South Austin', 'North Austin', 'West Austin',
                      'Cedar Park Area', 'Round Rock Area', 'Pflugerville Area', 'Georgetown Area', 'Leander Area'
                    ];
                  }
                  
                  if (points.length === 0) {
                    // Create empty data structure
                    const emptyMatrix = locations.map(() => years.map(() => 0));
                    return [{
                      z: emptyMatrix,
                      x: years,
                      y: locations,
                      type: 'heatmap',
                      colorscale: [[0, '#ebedf0'], [1, '#196127']],
                      showscale: false,
                      hovertemplate: '<b>%{y}</b><br>Year: %{x}<br>Count: %{z}<extra></extra>',
                      xgap: 2,
                      ygap: 2
                    }];
                  }

                  // Process coordinate data to create location zones
                  const coords = points
                    .filter(p => p && (typeof p.Latitude !== 'undefined' || typeof p.lat !== 'undefined'))
                    .map(p => {
                      const lat = Number(p.Latitude || p.lat);
                      const lon = Number(p.Longitude || p.lon || p.lng);
                      return (!isNaN(lat) && !isNaN(lon)) ? { lat, lon } : null;
                    })
                    .filter(Boolean);

                  if (coords.length === 0) {
                    const emptyMatrix = locations.map(() => years.map(() => 0));
                    return [{
                      z: emptyMatrix,
                      x: years,
                      y: locations,
                      type: 'heatmap',
                      colorscale: [[0, '#ebedf0'], [1, '#196127']],
                      showscale: false,
                      hovertemplate: '<b>%{y}</b><br>Year: %{x}<br>Count: %{z}<extra></extra>',
                      xgap: 2,
                      ygap: 2
                    }];
                  }

                  // Create location zones based on coordinate clustering
                  const latValues = coords.map(c => c.lat);
                  const lonValues = coords.map(c => c.lon);
                  const latMin = Math.min(...latValues);
                  const latMax = Math.max(...latValues);
                  const lonMin = Math.min(...lonValues);
                  const lonMax = Math.max(...lonValues);

                  const latRange = latMax - latMin || 1;
                  const lonRange = lonMax - lonMin || 1;
                  const gridSize = Math.ceil(Math.sqrt(locations.length));
                  const latStep = latRange / gridSize;
                  const lonStep = lonRange / gridSize;

                  // Generate activity data for each location and year
                  const activityData = [];
                  coords.forEach((coord, idx) => {
                    const latZone = Math.min(Math.floor((coord.lat - latMin) / latStep), gridSize - 1);
                    const lonZone = Math.min(Math.floor((coord.lon - lonMin) / lonStep), gridSize - 1);
                    const locationIdx = Math.min(latZone * gridSize + lonZone, locations.length - 1);
                    
                    // Distribute across years based on data patterns
                    const yearIdx = Math.floor((idx / coords.length) * years.length);
                    const year = years[Math.min(yearIdx, years.length - 1)];
                    
                    if (locations[locationIdx] && year) {
                      activityData.push({ location: locations[locationIdx], year, count: 1 });
                    }
                  });

                  // Aggregate counts
                  const countMatrix = {};
                  activityData.forEach(({ location, year }) => {
                    const key = `${location}-${year}`;
                    countMatrix[key] = (countMatrix[key] || 0) + 1;
                  });

                  // Create matrix for heatmap (locations x years)
                  const zMatrix = locations.map(location => 
                    years.map(year => countMatrix[`${location}-${year}`] || 0)
                  );

                  return [{
                    z: zMatrix,
                    x: years,
                    y: locations,
                    type: 'heatmap',
                    colorscale: [
                      [0, '#ebedf0'],      // Light gray (no activity)
                      [0.2, '#c6e48b'],    // Light green
                      [0.4, '#7bc96f'],    // Medium green
                      [0.6, '#239a3b'],    // Dark green
                      [1, '#196127']       // Darkest green
                    ],
                    hoverongaps: false,
                    hovertemplate: '<b>%{y}</b><br>Year: %{x}<br>Count: %{z}<extra></extra>',
                    showscale: false,
                    xgap: 2,
                    ygap: 2
                  }];
                } catch (error) {
                  console.error('Error generating year vs location heatmap:', error);
                  return [{
                    z: [[0]],
                    x: ['Error'],
                    y: ['Error'],
                    type: 'heatmap',
                    colorscale: [[0, '#ebedf0'], [1, '#196127']],
                    showscale: false,
                    hovertemplate: 'Error loading data<extra></extra>'
                  }];
                }
              })()}
              layout={{
                margin: { l: 120, r: 20, t: 30, b: 60 },
                xaxis: { 
                  title: 'Year',
                  side: 'bottom',
                  tickangle: 0,
                  showgrid: false,
                  zeroline: false,
                  showline: false,
                  ticks: '',
                  tickfont: { size: 11 }
                },
                yaxis: { 
                  title: 'Location',
                  showgrid: false,
                  zeroline: false,
                  showline: false,
                  ticks: '',
                  tickfont: { size: 11 },
                  automargin: true
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { size: 11, color: '#586069' }
              }}
              config={{ 
                responsive: true, 
                displaylogo: false, 
                scrollZoom: false,
                modeBarButtonsToRemove: ['toImage', 'pan2d', 'lasso2d', 'select2d', 'zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d']
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
            />
          </div>
            <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
              <span>Data source: ML Service API • Real-time coordinate clustering</span>
              <span>{coordinates.length.toLocaleString()} coordinate points • {riskAreas.length} risk areas</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">No Geospatial Data Available</h4>
            <p className="text-sm">Upload intake/outcome data with location information to see heatmap analysis</p>
            <p className="text-xs mt-2 text-gray-400">ML service will analyze coordinates and generate risk areas</p>
          </div>
        )}
        
        {/* Risk Areas List - Only show when ML data exists */}
        {riskAreas.length > 0 && (
          <div className="space-y-4">
            {riskAreas.map((area, index) => (
              <div key={`${area.name}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <MapPin className={`h-5 w-5 ${
                      area.riskLevel === 'High' ? 'text-red-500' :
                      area.riskLevel === 'Medium' ? 'text-yellow-500' :
                      area.riskLevel === 'Low' ? 'text-green-500' :
                      'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{area.name}</h4>
                    <p className="text-xs text-gray-500">{area.coordinates}</p>
                    <p className="text-xs text-gray-400 mt-1">{area.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {area.incidents.toLocaleString()} {area.incidents === 1 ? 'incident' : 'incidents'}
                    </p>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      {getTrendIcon(area.trend)}
                      <span className={`text-xs ${
                        area.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {area.trend}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(area.riskLevel)}`}>
                      {area.riskLevel === 'None' ? 'No Risk' : `${area.riskLevel} Risk`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
