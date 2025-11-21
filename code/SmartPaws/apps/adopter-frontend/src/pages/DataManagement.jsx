import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { 
  Database, 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Upload,
  X,
  Loader,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

const DataManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [clearing, setClearing] = useState(false);


  // Fetch files from /files endpoint
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get files from /files endpoint first
      const filesResponse = await axios.get('/files').catch(() => ({ data: { files: [] } }));
      console.log('Files API Response:', filesResponse.data);
      
      let filesData = filesResponse.data.files || filesResponse.data || [];
      
      // If no files found, try to get data from intake/outcome endpoints
      if (filesData.length === 0) {
        console.log('No files found, fetching from data endpoints...');
        
        // Fetch only a small sample to get counts and metadata (much faster)
        const [intakeResponse, outcomeResponse] = await Promise.all([
          axios.get('/data/intake', { params: { limit: 1 } }).catch(() => ({ data: [] })),
          axios.get('/data/outcome', { params: { limit: 1 } }).catch(() => ({ data: [] }))
        ]);
        
        // Get total counts from analytics endpoint (more efficient)
        const analyticsResponse = await axios.get('/analytics/summary').catch(() => ({ 
          data: { totalIntakes: 0, totalOutcomes: 0 } 
        }));
        
        const intakeCount = analyticsResponse.data.totalIntakes || 0;
        const outcomeCount = analyticsResponse.data.totalOutcomes || 0;
        
        console.log('Intake records:', intakeCount);
        console.log('Outcome records:', outcomeCount);
        
        // Create virtual file entries
        const virtualFiles = [];
        
        if (intakeCount > 0) {
          const sampleIntake = intakeResponse.data?.[0];
          virtualFiles.push({
            id: 'intake-data',
            name: 'Intake Data Records',
            type: 'intake',
            size: `${(intakeCount * 0.001).toFixed(2)} MB`,
            records: intakeCount,
            uploadDate: sampleIntake?.datetime || new Date().toISOString(),
            lastModified: sampleIntake?.datetime || new Date().toISOString(),
            status: 'processed',
            quality: 'good',
            description: `Animal intake records from database`
          });
        }
        
        if (outcomeCount > 0) {
          const sampleOutcome = outcomeResponse.data?.[0];
          virtualFiles.push({
            id: 'outcome-data',
            name: 'Outcome Data Records',
            type: 'outcome',
            size: `${(outcomeCount * 0.001).toFixed(2)} MB`,
            records: outcomeCount,
            uploadDate: sampleOutcome?.datetime || new Date().toISOString(),
            lastModified: sampleOutcome?.datetime || new Date().toISOString(),
            status: 'processed',
            quality: 'good',
            description: `Animal outcome records from database`
          });
        }
        
        filesData = virtualFiles;
      }
      
      console.log('Final files data:', filesData);
      setFiles(filesData);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try again.');
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file, metadata) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', metadata.type);
      formData.append('description', metadata.description);
      
      console.log('Uploading file:', file.name, 'Type:', metadata.type);
      
      const response = await axios.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      
      console.log('Upload response:', response.data);
      
      toast.success('File uploaded successfully!');
      setShowUploadModal(false);
      fetchFiles();
      return response.data;
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(err.response?.data?.message || 'Failed to upload file');
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateFile = async (id, updates) => {
    try {
      const response = await axios.put(`/files/${id}`, updates);
      toast.success('File updated successfully!');
      setShowEditModal(false);
      setEditingFile(null);
      fetchFiles();
      return response.data;
    } catch (err) {
      console.error('Error updating file:', err);
      toast.error(err.response?.data?.message || 'Failed to update file');
      throw err;
    }
  };

  const deleteFile = async (id) => {
    try {
      // Check if it's a virtual file (intake-data or outcome-data)
      if (id === 'intake-data') {
        // Delete all intake records
        await axios.delete('/data/cleanup', { data: { type: 'intake' } });
        toast.success('All intake records deleted successfully!');
      } else if (id === 'outcome-data') {
        // Delete all outcome records
        await axios.delete('/data/cleanup', { data: { type: 'outcome' } });
        toast.success('All outcome records deleted successfully!');
      } else {
        // Delete individual file
        await axios.delete(`/files/${id}`);
        toast.success('File deleted successfully!');
      }
      fetchFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error(err.response?.data?.message || 'Failed to delete file');
      throw err;
    }
  };

  const bulkDelete = async (fileIds) => {
    try {
      await axios.delete('/files/bulk', {
        data: { fileIds }
      });
      toast.success(`${fileIds.length} files deleted successfully!`);
      setSelectedFiles([]);
      fetchFiles();
    } catch (err) {
      console.error('Error bulk deleting files:', err);
      toast.error(err.response?.data?.message || 'Failed to delete files');
      throw err;
    }
  };

  const downloadFile = async (id, filename) => {
    try {
      let response;
      let downloadFilename = filename;
      
      // Check if it's a virtual file (intake-data or outcome-data)
      if (id === 'intake-data') {
        // Download intake data as CSV
        response = await axios.get('/data/intake', { 
          params: { limit: 200000 },
          responseType: 'json'
        });
        
        // Convert to CSV
        const data = response.data || [];
        if (data.length === 0) {
          toast.warning('No intake data to download');
          return;
        }
        
        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFilename = 'intake_data.csv';
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', downloadFilename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
      } else if (id === 'outcome-data') {
        // Download outcome data as CSV
        response = await axios.get('/data/outcome', { 
          params: { limit: 200000 },
          responseType: 'json'
        });
        
        // Convert to CSV
        const data = response.data || [];
        if (data.length === 0) {
          toast.warning('No outcome data to download');
          return;
        }
        
        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFilename = 'outcome_data.csv';
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', downloadFilename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
      } else {
        // Download regular file
        response = await axios.get(`/files/${id}/download`, {
          responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      
      toast.success('File downloaded successfully!');
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error('Failed to download file');
    }
  };
  
  // Helper function to convert JSON to CSV
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const csvHeaders = headers.join(',');
    
    // Create CSV data rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Clear all data function
  const clearAllData = async () => {
    if (!window.confirm('⚠️ Are you sure you want to clear ALL data? This will delete all intake and outcome records from the database. This action cannot be undone!')) {
      return;
    }
    
    try {
      setClearing(true);
      toast.loading('Clearing all data...', { id: 'clear-data' });
      
      const response = await axios.delete('/data/clear');
      
      toast.success(`Successfully cleared ${response.data.deleted.intakes} intake records and ${response.data.deleted.outcomes} outcome records`, { id: 'clear-data' });
      
      // Refresh the file list
      fetchFiles();
    } catch (err) {
      console.error('Error clearing data:', err);
      toast.error('Failed to clear data', { id: 'clear-data' });
    } finally {
      setClearing(false);
    }
  };

  // Load files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Client-side filtering and searching
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(file => 
        file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      result = result.filter(file => file.type === selectedFilter);
    }

    return result;
  }, [files, searchTerm, selectedFilter]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    return {
      totalFiles: files.length,
      totalRecords: files.reduce((sum, file) => sum + (file.records || 0), 0),
      processed: files.filter(f => f.status === 'processed').length,
      errors: files.filter(f => f.status === 'error').length
    };
  }, [files]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'intake':
        return <Database className="h-5 w-5 text-blue-500" />;
      case 'outcome':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };


  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(
      selectedFiles.length === filteredFiles.length 
        ? [] 
        : filteredFiles.map(file => file.id)
    );
  };

  // Modal Components
  const UploadModal = () => {
    const [file, setFile] = useState(null);
    const [metadata, setMetadata] = useState({ type: 'intake', description: '' });
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    };

    const validateFile = (file) => {
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Only CSV and Excel files are allowed');
        return false;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('File size must be less than 50MB');
        return false;
      }
      
      return true;
    };

    const handleFileSelect = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile && validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!file) {
        toast.error('Please select a file');
        return;
      }
      
      try {
        await uploadFile(file, metadata);
        setFile(null);
        setMetadata({ type: 'intake', description: '' });
      } catch (err) {
        // Error handled in uploadFile function
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Upload New File</h3>
            <button 
              onClick={() => setShowUploadModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* File Drop Zone */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your file here, or
                  </p>
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700">
                    browse files
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    CSV, XLSX files up to 50MB
                  </p>
                </div>
              )}
            </div>

            {/* File Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={metadata.type}
                onChange={(e) => setMetadata({ ...metadata, type: e.target.value })}
                className="input-field"
                required
              >
                <option value="intake">Intake</option>
                <option value="outcome">Outcome</option>
              </select>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Brief description of the file contents..."
                required
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={uploading || !file}
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EditModal = () => {
    const [formData, setFormData] = useState({
      type: editingFile?.type || 'intake',
      description: editingFile?.description || '',
      status: editingFile?.status || 'processing'
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      
      try {
        await updateFile(editingFile.id, formData);
      } catch (err) {
        // Error handled in updateFile function
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit File</h3>
            <button 
              onClick={() => {
                setShowEditModal(false);
                setEditingFile(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name
              </label>
              <input
                type="text"
                value={editingFile?.name || ''}
                className="input-field bg-gray-50"
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field"
              >
                <option value="intake">Intake</option>
                <option value="outcome">Outcome</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="processing">Processing</option>
                <option value="processed">Processed</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Brief description of the file contents..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFile(null);
                }}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  // Loading state
  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchFiles}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage, organize, and process your NGO's uploaded data files
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={fetchFiles}
            className="btn-secondary flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reload Data
          </button>
          <button 
            onClick={clearAllData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            disabled={clearing || loading}
          >
            <Trash2 className={`h-4 w-4 mr-2 ${clearing ? 'animate-pulse' : ''}`} />
            {clearing ? 'Clearing...' : 'Clear All Data'}
          </button>
          <button 
            onClick={() => navigate('/data-upload')}
            className="btn-primary flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalFiles}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRecords.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Database className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.processed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.errors}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search files by name or description..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <select
              className="input-field"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">All Files</option>
              <option value="intake">Intake Data</option>
              <option value="outcome">Outcome Data</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  selectedFiles.forEach(id => {
                    const file = files.find(f => f.id === id);
                    if (file) downloadFile(id, file.name);
                  });
                }}
                className="btn-secondary text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              <button 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
                    bulkDelete(selectedFiles);
                  }
                }}
                className="btn-secondary text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Files Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleSelectFile(file.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(file.type)}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-500">{file.size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {file.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.records.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(file.status)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(file.status)}`}>
                        {file.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getQualityColor(file.quality)}`}>
                      {file.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.lastModified).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => downloadFile(file.id, file.name)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
                            deleteFile(file.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or upload new files.
            </p>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <Database className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{files.length}</div>
          <div className="text-sm text-gray-500">Total Files</div>
        </div>
        
        <div className="card text-center">
          <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {files.reduce((sum, file) => sum + (file.records || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Records</div>
        </div>
        
        <div className="card text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {files.filter(file => file.status === 'processed').length}
          </div>
          <div className="text-sm text-gray-500">Processed</div>
        </div>
        
        <div className="card text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {files.filter(file => file.status === 'error').length}
          </div>
          <div className="text-sm text-gray-500">Errors</div>
        </div>
      </div>

      {/* Modals */}
      {showUploadModal && <UploadModal />}
      {showEditModal && editingFile && <EditModal />}
    </div>
  );
};

export default DataManagement;
