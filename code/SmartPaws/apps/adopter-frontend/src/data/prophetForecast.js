// Prophet forecast data from Austin Animal Center analysis
export const prophetForecastData = [
  { date: '2021-03-04', forecast: 1.90, lower: 0.01, upper: 3.84 },
  { date: '2021-03-05', forecast: 1.97, lower: 0.07, upper: 4.01 },
  { date: '2021-03-06', forecast: 2.08, lower: -0.08, upper: 3.92 },
  { date: '2021-03-07', forecast: 2.02, lower: 0.18, upper: 3.95 },
  { date: '2021-03-08', forecast: 2.07, lower: 0.09, upper: 3.88 },
  { date: '2021-03-09', forecast: 2.09, lower: 0.24, upper: 3.96 },
  { date: '2021-03-10', forecast: 1.86, lower: -0.10, upper: 3.72 },
  { date: '2021-03-11', forecast: 1.81, lower: 0.03, upper: 3.65 },
  { date: '2021-03-12', forecast: 1.89, lower: -0.08, upper: 3.73 },
  { date: '2021-03-13', forecast: 1.95, lower: 0.05, upper: 3.78 },
  { date: '2021-03-14', forecast: 2.01, lower: 0.12, upper: 3.85 },
  { date: '2021-03-15', forecast: 2.06, lower: 0.18, upper: 3.91 },
  { date: '2021-03-16', forecast: 2.11, lower: 0.25, upper: 3.97 },
  { date: '2021-03-17', forecast: 2.15, lower: 0.31, upper: 4.02 },
  { date: '2021-03-18', forecast: 2.19, lower: 0.37, upper: 4.07 },
  { date: '2021-03-19', forecast: 2.23, lower: 0.43, upper: 4.12 },
  { date: '2021-03-20', forecast: 2.27, lower: 0.49, upper: 4.17 },
  { date: '2021-03-21', forecast: 2.31, lower: 0.55, upper: 4.22 },
  { date: '2021-03-22', forecast: 2.35, lower: 0.61, upper: 4.27 },
  { date: '2021-03-23', forecast: 2.39, lower: 0.67, upper: 4.32 },
  { date: '2021-03-24', forecast: 2.43, lower: 0.73, upper: 4.37 },
  { date: '2021-03-25', forecast: 2.47, lower: 0.79, upper: 4.42 },
  { date: '2021-03-26', forecast: 2.51, lower: 0.85, upper: 4.47 },
  { date: '2021-03-27', forecast: 2.55, lower: 0.91, upper: 4.52 },
  { date: '2021-03-28', forecast: 2.59, lower: 0.97, upper: 4.57 },
  { date: '2021-03-29', forecast: 2.63, lower: 1.03, upper: 4.62 },
  { date: '2021-03-30', forecast: 2.67, lower: 1.09, upper: 4.67 },
  { date: '2021-03-31', forecast: 2.71, lower: 1.15, upper: 4.72 }
];

// Clustering analysis results
export const clusteringResults = [
  {
    clusterId: 0,
    count: 3669,
    avgAge: '2 years',
    mostCommonType: 'Cat',
    mostCommonBreed: 'Domestic Shorthair',
    mostCommonSeason: 'Summer',
    percentage: 5.31,
    description: 'Small cluster of domestic shorthair cats in summer'
  },
  {
    clusterId: 1,
    count: 37762,
    avgAge: '2 years',
    mostCommonType: 'Dog',
    mostCommonBreed: 'Rare_Breed',
    mostCommonSeason: 'Fall',
    percentage: 54.61,
    description: 'Large cluster of non-adopted rare breed dogs in fall season'
  },
  {
    clusterId: 2,
    count: 796,
    avgAge: '2 years',
    mostCommonType: 'Cat',
    mostCommonBreed: 'Domestic Longhair Mix',
    mostCommonSeason: 'Winter',
    percentage: 1.15,
    description: 'Small cluster of domestic longhair mix cats in winter'
  },
  {
    clusterId: 3,
    count: 6066,
    avgAge: '1 year',
    mostCommonType: 'Other',
    mostCommonBreed: 'Bat Mix',
    mostCommonSeason: 'Spring',
    percentage: 8.77,
    description: 'Mixed other animals including bats in spring'
  },
  {
    clusterId: 4,
    count: 20851,
    avgAge: '1 year',
    mostCommonType: 'Cat',
    mostCommonBreed: 'Domestic Shorthair Mix',
    mostCommonSeason: 'Summer',
    percentage: 30.16,
    description: 'High volume of domestic shorthair mix cats in summer'
  }
];

// Austin Animal Center summary statistics
export const austinStats = {
  totalAdoptions: 6146,
  totalIntakes: 10682,
  adoptionRate: 57.55,
  totalAnimals: 10682,
  dateRange: '2013-2021',
  dataSource: 'Austin Animal Center Dataset'
};
