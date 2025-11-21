import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Eye,
  Trash2,
  Calendar,
  Database,
  FileSpreadsheet
} from 'lucide-react';

import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const DataUpload = () => {
  const { token } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, []);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    const fileArray = Array.from(files);
    
    // Process all files in parallel for faster uploads
    const uploadPromises = fileArray.map(async (file) => {
      const tempId = `${file.name}-${Date.now()}-${Math.random()}`;
      const ext = (file.name || '').toLowerCase();
      const inferredType = ext.includes('intake') ? 'intake' : ext.includes('outcome') ? 'outcome' : 'location';

      // Add placeholder entry immediately
      setUploadedFiles(prev => [
        {
          id: tempId,
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          status: 'processing',
          uploadDate: new Date().toISOString().split('T')[0],
          records: 0,
          type: inferredType
        },
        ...prev
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        console.log(`📤 Uploading file: ${file.name}`);
        console.log(`   File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Token present: ${!!token}`);

        const response = await api.post('/data/ingest', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(percent);
          },
        });

        console.log(`✅ Upload response for ${file.name}:`, response.data);

        const recordsInserted = response?.data?.inserted || response?.data?.count || 0;

        console.log(`   Records inserted: ${recordsInserted}`);

        // Mark as processed
        setUploadedFiles(prev => prev.map(f => (
          f.id === tempId ? { ...f, status: 'processed', records: recordsInserted } : f
        )));
        
        return { success: true, file: file.name, records: recordsInserted };
      } catch (e) {
        console.error(`❌ Upload failed for ${file.name}:`, e);
        console.error(`   Error message: ${e.message}`);
        console.error(`   Error response:`, e.response?.data);
        
        // Mark as error
        setUploadedFiles(prev => prev.map(f => (
          f.id === tempId ? { ...f, status: 'error' } : f
        )));
        
        return { success: false, file: file.name, error: e.response?.data?.message || e.message };
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    setUploadProgress(0);
    setIsUploading(false);
    
    // Show summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (successful > 0 && failed === 0) {
      const totalRecords = results.reduce((sum, r) => sum + (r.records || 0), 0);
      console.log(`✅ ${successful} file(s) uploaded successfully! ${totalRecords} records inserted.`);
    } else if (failed > 0) {
      console.log(`⚠️ ${successful} succeeded, ${failed} failed`);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
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

  const getFileTypeIcon = (type) => {
    switch (type) {
      case 'intake':
        return <Database className="h-5 w-5 text-blue-500" />;
      case 'outcome':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'location':
        return <FileSpreadsheet className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Upload</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload your animal shelter data files for batch processing and analysis
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Data Files</h2>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.json"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Drop files here or click to upload
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Supports CSV, Excel, and JSON files up to 10MB each
              </p>
            </div>
            
            <div className="text-xs text-gray-400">
              <p>Accepted formats: .csv, .xlsx, .json</p>
              <p>Maximum file size: 10MB per file</p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Intake Data</h3>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Animal ID, Name, Species</li>
            <li>• Intake Date, Type, Condition</li>
            <li>• Location, Age, Gender</li>
            <li>• Breed, Color, Size</li>
          </ul>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Outcome Data</h3>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Animal ID, Outcome Date</li>
            <li>• Outcome Type (Adoption, etc.)</li>
            <li>• Outcome Subtype</li>
            <li>• Days in Shelter</li>
          </ul>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <FileSpreadsheet className="h-6 w-6 text-purple-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Location Data</h3>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Geographic coordinates</li>
            <li>• ZIP codes, Neighborhoods</li>
            <li>• Risk factors by area</li>
            <li>• Population density</li>
          </ul>
        </div>
      </div>

      {/* Uploaded Files */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Uploaded Files</h2>
          <span className="text-sm text-gray-500">{uploadedFiles.length} files</span>
        </div>

        <div className="space-y-4">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                {getFileTypeIcon(file.type)}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.records} records</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {file.uploadDate}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(file.status)}`}>
                  {file.status}
                </span>
                {getStatusIcon(file.status)}
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {uploadedFiles.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your first data file to get started with analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUpload;
