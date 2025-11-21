import React, { useEffect, useState } from 'react';
import { useAuth, getAuthToken } from '../contexts/AuthContext';
import api from '../api/axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Upload,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Austin, TX 78701',
    bio: 'Animal lover and advocate for pet adoption. Passionate about finding forever homes for all pets.'
  });
  const [myFiles, setMyFiles] = useState([]); // full list for table
  const [recentFiles, setRecentFiles] = useState([]); // recent activity
  const [stats, setStats] = useState({ dataFiles: 0, totalRecords: 0, analysisReports: 0 });

  const userStats = {
    dataFiles: stats.dataFiles,
    totalRecords: stats.totalRecords,
    analysisReports: stats.analysisReports || 23,
    memberSince: user?.createdAt || '2022-03-15'
  };

  const recentActivity = recentFiles.slice(0, 5).map((f, idx) => ({
    id: idx + 1,
    type: 'upload',
    title: 'Data File Uploaded',
    description: `${f.name} (${f.type})`,
    date: f.uploadDate || f.createdAt,
    icon: Upload
  }));

  const RecentVisited = () => {
    let items = [];
    try {
      items = JSON.parse(localStorage.getItem('sp_recent_visits') || '[]');
    } catch (e) {
      items = [];
    }
    if (!items.length) {
      return <p className="text-sm text-gray-500">No recent pages visited yet.</p>;
    }
    return (
      <div className="space-y-3">
        {items.map((v, idx) => (
          <div key={idx} className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{v.name}</p>
              <p className="text-xs text-gray-500">{v.path}</p>
            </div>
            <div className="text-xs text-gray-400">{new Date(v.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    // load profile + stats from backend for current user
    const token = getAuthToken();
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` }})
      .then(res => {
        const { user: u, stats: backendStats, recentFiles: backendRecent } = res.data;
        setFormData(prev => ({
          ...prev,
          name: u?.name || '',
          email: u?.email || '',
          phone: u?.phone || prev.phone,
          address: u?.address || prev.address,
          bio: u?.bio || prev.bio
        }));
        setStats(backendStats || { dataFiles: 0, totalRecords: 0, analysisReports: 0 });
        setRecentFiles(backendRecent || []);
        // cache user
        localStorage.setItem('smartpaws_user', JSON.stringify(u));
        // fetch full file list for table
        return api.get('/files/mine', { headers: { Authorization: `Bearer ${token}` }});
      })
      .then(res => {
        if (res && res.data) {
          setMyFiles(res.data.files || []);
        }
      })
      .catch(() => {
        // fallback to context if /me fails
        setFormData(prev => ({ ...prev, name: user?.name || '', email: user?.email || '' }));
      });
  }, [user]);

  useEffect(() => {
    const fetchMyFiles = async () => {
      try {
        const token = getAuthToken();
        const res = await api.get('/files/mine', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyFiles(res.data.files || []);
      } catch (e) {
        console.error('Failed to fetch user files', e);
      }
    };
    fetchMyFiles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // preferences removed

  const handleSave = () => {
    // Persist phone/address/bio to backend
    const token = getAuthToken();
    api.put('/auth/profile', {
      phone: formData.phone,
      address: formData.address,
      bio: formData.bio
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      // Update local storage user as well
      const updatedUser = { ...(JSON.parse(localStorage.getItem('smartpaws_user') || '{}')), ...res.data.user };
      localStorage.setItem('smartpaws_user', JSON.stringify(updatedUser));
      setIsEditing(false);
    }).catch(err => {
      console.error('Failed to save profile', err);
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, Austin, TX 78701',
      bio: 'Animal lover and advocate for pet adoption. Passionate about finding forever homes for all pets.'
    });
    setIsEditing(false);
  };

  // preferences removed

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            isEditing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            {/* Profile Picture */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="h-20 w-20 bg-primary-200 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-primary-600" />
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-1 rounded-full hover:bg-primary-700">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  ) : (
                    formData.name
                  )}
                </h3>
                <p className="text-sm text-gray-500">Member since {new Date(userStats.memberSince).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {formData.email}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {formData.phone}
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {formData.address}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900">{formData.bio}</p>
              )}
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* File uploads list removed as requested */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity - Recently visited pages */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <RecentVisited />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
