import React from 'react';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Users, 
  Shield,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

const Home = () => {
  const stats = [
    {
      name: 'Total Adoptions',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Heart
    },
    {
      name: 'High-Risk Areas',
      value: '23',
      change: '-5%',
      changeType: 'negative',
      icon: AlertTriangle
    },
    {
      name: 'Active Shelters',
      value: '45',
      change: '+3%',
      changeType: 'positive',
      icon: Shield
    },
    {
      name: 'Monthly Predictions',
      value: '89%',
      change: '+2%',
      changeType: 'positive',
      icon: TrendingUp
    }
  ];

  const features = [
    {
      title: 'Smart Adoption Matching',
      description: 'AI-powered matching system that connects the right pets with the right families based on lifestyle, preferences, and compatibility.',
      icon: Heart,
      color: 'text-red-500'
    },
    {
      title: 'Risk Area Prediction',
      description: 'Advanced geospatial analysis to identify high-risk areas for animal injuries and abandonment, helping shelters allocate resources effectively.',
      icon: MapPin,
      color: 'text-orange-500'
    },
    {
      title: 'Seasonal Trend Analysis',
      description: 'Predictive analytics using historical data to forecast adoption trends and seasonal patterns, optimizing shelter operations.',
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboard with real-time insights into adoption rates, shelter capacity, and community engagement metrics.',
      icon: BarChart3,
      color: 'text-green-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to SmartPaws</h1>
        <p className="text-primary-100 text-lg">
          Your intelligent platform for animal adoption and shelter management. 
          Making pet adoption smarter, safer, and more successful.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary flex items-center justify-center">
            <Heart className="h-5 w-5 mr-2" />
            Browse Adoptable Pets
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <MapPin className="h-5 w-5 mr-2" />
            View Risk Map
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
