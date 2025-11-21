import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Heart, 
  MapPin, 
  Calendar, 
  Users,
  Star,
  Eye
} from 'lucide-react';

const Adoption = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    species: '',
    age: '',
    size: '',
    gender: ''
  });

  // Mock data - replace with actual API data
  const pets = [
    {
      id: 1,
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: '2 years',
      size: 'Large',
      gender: 'Male',
      location: 'Austin Animal Center',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      description: 'Friendly and energetic dog who loves playing fetch and going for walks.',
      adoptionFee: '$150',
      isFavorite: false,
      riskLevel: 'Low'
    },
    {
      id: 2,
      name: 'Luna',
      species: 'Cat',
      breed: 'Siamese Mix',
      age: '1 year',
      size: 'Medium',
      gender: 'Female',
      location: 'Austin Animal Center',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      description: 'Gentle and affectionate cat who enjoys cuddling and quiet environments.',
      adoptionFee: '$100',
      isFavorite: true,
      riskLevel: 'Low'
    },
    {
      id: 3,
      name: 'Max',
      species: 'Dog',
      breed: 'Labrador Mix',
      age: '3 years',
      size: 'Large',
      gender: 'Male',
      location: 'Austin Animal Center',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
      description: 'Loyal and protective dog, great with families and children.',
      adoptionFee: '$120',
      isFavorite: false,
      riskLevel: 'Medium'
    },
    {
      id: 4,
      name: 'Whiskers',
      species: 'Cat',
      breed: 'Domestic Shorthair',
      age: '4 months',
      size: 'Small',
      gender: 'Male',
      location: 'Austin Animal Center',
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
      description: 'Playful kitten who loves toys and exploring new environments.',
      adoptionFee: '$80',
      isFavorite: false,
      riskLevel: 'Low'
    }
  ];

  const filterOptions = {
    species: ['All', 'Dog', 'Cat', 'Other'],
    age: ['All', 'Puppy/Kitten', 'Young', 'Adult', 'Senior'],
    size: ['All', 'Small', 'Medium', 'Large'],
    gender: ['All', 'Male', 'Female']
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterType]: value
    });
  };

  const toggleFavorite = (petId) => {
    // In a real app, this would make an API call
    console.log('Toggle favorite for pet:', petId);
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = selectedFilters.species === '' || selectedFilters.species === 'All' || pet.species === selectedFilters.species;
    const matchesAge = selectedFilters.age === '' || selectedFilters.age === 'All' || pet.age.includes(selectedFilters.age);
    const matchesSize = selectedFilters.size === '' || selectedFilters.size === 'All' || pet.size === selectedFilters.size;
    const matchesGender = selectedFilters.gender === '' || selectedFilters.gender === 'All' || pet.gender === selectedFilters.gender;

    return matchesSearch && matchesSpecies && matchesAge && matchesSize && matchesGender;
  });

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Your Perfect Pet</h1>
          <p className="mt-1 text-sm text-gray-500">
            Discover amazing pets waiting for their forever homes
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="text-sm text-gray-500">
            {filteredPets.length} pets available
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or breed..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(filterOptions).map(([filterType, options]) => (
              <select
                key={filterType}
                className="input-field"
                value={selectedFilters[filterType]}
                onChange={(e) => handleFilterChange(filterType, e.target.value)}
              >
                {options.map(option => (
                  <option key={option} value={option === 'All' ? '' : option}>
                    {option}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      </div>

      {/* Pets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPets.map((pet) => (
          <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="relative">
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(pet.riskLevel)}`}>
                  {pet.riskLevel} Risk
                </span>
                <button
                  onClick={() => toggleFavorite(pet.id)}
                  className={`p-2 rounded-full ${
                    pet.isFavorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-gray-400 hover:text-red-500'
                  } transition-colors duration-200`}
                >
                  <Heart className={`h-4 w-4 ${pet.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                  <p className="text-sm text-gray-600">{pet.breed}</p>
                </div>
                <span className="text-lg font-bold text-primary-600">{pet.adoptionFee}</span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {pet.age}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  {pet.gender} • {pet.size}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {pet.location}
                </div>
              </div>
              
              <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                {pet.description}
              </p>
              
              <div className="mt-6 flex space-x-3">
                <button className="flex-1 btn-primary">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button className="btn-secondary">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPets.length === 0 && (
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default Adoption;
