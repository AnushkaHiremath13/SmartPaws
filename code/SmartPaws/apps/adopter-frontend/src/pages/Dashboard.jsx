import React from 'react';
import { 
  Upload, 
  BarChart3, 
  Heart,
  Shield,
  Target,
  Zap,
  MapPin,
  PieChart,
  Activity,
  ArrowRight,
  Star,
  Building,
  Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Hero Section Component
  const HeroSection = () => (
    <div 
      className="relative bg-cover bg-center bg-no-repeat py-32 px-6 min-h-[600px] overflow-hidden bg-gray-600"
      style={{
        backgroundImage: "url('/hero-bg.png')"
      }}
    >
      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
      
      <div className="relative max-w-6xl mx-auto">
        <div className="max-w-lg ml-8 md:ml-16 lg:ml-20 mt-16 md:mt-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Welcome to <span className="text-blue-400">Smart Paws</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed">
            Empowering NGOs and shelters through data-driven animal care and intelligent adoption insights
          </p>
        </div>
      </div>
    </div>
  );

  // About Section Component
  const AboutSection = () => (
    <div className="py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">About Smart Paws</h2>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Smart Paws is an intelligent web platform designed to help animal shelters, NGOs, and rescue organizations 
            manage, predict, and improve adoption outcomes using advanced data insights and machine learning.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Our mission is to reduce animal homelessness by providing shelters with the tools they need to make 
            data-driven decisions, identify at-risk animals, and optimize their adoption processes for better outcomes.
          </p>
        </div>
      </div>
    </div>
  );

  // How It Works Section Component
  const HowItWorksSection = () => {
    const steps = [
      {
        icon: Upload,
        title: "Upload Shelter Data",
        description: "Easily upload your animal intake and outcome data through our secure platform",
        color: "bg-blue-500"
      },
      {
        icon: BarChart3,
        title: "Analyze Trends",
        description: "Our AI analyzes patterns in adoptions, seasonal trends, and animal characteristics",
        color: "bg-green-500"
      },
      {
        icon: MapPin,
        title: "Identify Risk Areas",
        description: "Discover geographic hotspots and high-risk periods for animal intake",
        color: "bg-purple-500"
      },
      {
        icon: Heart,
        title: "Improve Outcomes",
        description: "Use insights to optimize adoption strategies and save more lives",
        color: "bg-pink-500"
      }
    ];

    return (
      <div className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="relative mb-6">
                    <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-300"></div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Key Features Section Component
  const KeyFeaturesSection = () => {
    const features = [
      {
        icon: Zap,
        title: "AI-Powered Predictions",
        description: "Advanced machine learning algorithms predict adoption trends and outcomes",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50"
      },
      {
        icon: Upload,
        title: "Easy Data Uploads",
        description: "Simple CSV upload process with automatic data validation and processing",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      {
        icon: Shield,
        title: "Shelter Management Tools",
        description: "Comprehensive tools for managing animal data and tracking outcomes",
        color: "text-green-600",
        bgColor: "bg-green-50"
      },
      {
        icon: PieChart,
        title: "Interactive Reports",
        description: "Beautiful, interactive dashboards and reports for data visualization",
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      },
      {
        icon: Target,
        title: "Risk Assessment",
        description: "Identify high-risk animals and areas requiring immediate attention",
        color: "text-red-600",
        bgColor: "bg-red-50"
      },
      {
        icon: Activity,
        title: "Real-time Analytics",
        description: "Live monitoring of shelter metrics and performance indicators",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50"
      }
    ];

    return (
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Use Cases Section Component
  const UseCasesSection = () => {
    const useCases = [
      {
        icon: Home,
        title: "Animal Shelters",
        description: "Optimize adoption processes and reduce length of stay for animals",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      {
        icon: Heart,
        title: "NGOs",
        description: "Track impact and improve resource allocation for animal welfare programs",
        color: "text-red-600",
        bgColor: "bg-red-50"
      },
      {
        icon: Building,
        title: "City Animal Control",
        description: "Monitor municipal animal services and identify community needs",
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      },
      {
        icon: Star,
        title: "Adoption Centers",
        description: "Increase successful adoptions through data-driven matching",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50"
      }
    ];

    return (
      <div className="py-24 px-6 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div key={index} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:scale-105 transition-transform duration-300 text-center">
                  <div className={`${useCase.bgColor} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8`}>
                    <Icon className={`h-10 w-10 ${useCase.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{useCase.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{useCase.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Call to Action Section Component
  const CTASection = () => (
    <div 
      className="relative py-24 px-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/bg2.png')"
      }}
    >
      {/* Semi-transparent dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Left Column - Text Content */}
          <div className="max-w-lg md:max-w-xl text-left ml-4 md:ml-8 lg:ml-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to make a difference?
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed">
              Join Smart Paws today and start transforming animal welfare through data.
            </p>
          </div>
          
          {/* Right Column - Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 justify-center md:justify-end">
            <button 
              onClick={() => navigate('/analytics')}
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button 
              onClick={() => navigate('/data-upload')}
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Upload Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Welcome Message for Logged-in Users */}
      {user && (
        <div className="bg-blue-600 text-white px-8 py-6 text-center shadow-lg">
          <p className="text-lg md:text-xl font-medium">Welcome back, {user.name}! 👋 Explore your dashboard below.</p>
        </div>
      )}
      
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <KeyFeaturesSection />
      <UseCasesSection />
      <CTASection />
    </div>
  );
};

export default Dashboard;
