# SmartPaws NGO Admin Frontend

A comprehensive React application for NGO administrators to manage animal shelter data, analyze trends, and make data-driven decisions. This frontend provides powerful tools for data upload, analysis, and visualization specifically designed for animal welfare organizations.

## Features

### 🔐 Authentication
- **Login Page**: Secure NGO admin authentication with email and password
- **Register Page**: New NGO admin registration with form validation
- **Protected Routes**: Automatic redirection based on authentication status

### 🏠 Admin Dashboard
- **Dashboard**: Overview of NGO statistics, data files, and quick actions
- **Data Upload**: Upload CSV/Excel files with drag-and-drop functionality
- **Analytics**: Interactive charts, pie charts, and comprehensive data visualization
- **Data Management**: Organize, search, and manage uploaded data files
- **Profile**: Manage NGO admin information and system preferences

### 🎨 UI/UX Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface using Tailwind CSS
- **Interactive Components**: Smooth animations and hover effects
- **Toast Notifications**: User feedback for actions and errors

### 🧠 Smart Features
- **Data Upload & Processing**: Support for CSV, Excel, and JSON files with batch processing
- **Static Data Analytics**: Charts, pie charts, and data visualization for uploaded datasets
- **Risk Area Analysis**: Geospatial visualization of high-risk areas from historical data
- **Trend Analysis**: Historical data visualization and ML predictions
- **File Management**: Advanced search, filtering, and bulk operations
- **Export Capabilities**: Generate and download analysis reports

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **React Router 6**: Client-side routing with protected routes
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Beautiful, customizable SVG icons
- **React Hot Toast**: Elegant toast notifications
- **React Hook Form**: Performant forms with easy validation

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd apps/adopter-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and visit `http://localhost:3000`

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm eject`: Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with navigation
│   ├── Login.jsx       # Login form component
│   └── Register.jsx    # Registration form component
├── contexts/           # React context providers
│   └── AuthContext.js  # Authentication state management
├── pages/              # Page components
│   ├── Dashboard.jsx   # NGO admin dashboard
│   ├── DataUpload.jsx  # File upload interface
│   ├── Analytics.jsx   # Interactive analytics and charts
│   ├── DataManagement.jsx # Data file management
│   └── Profile.jsx     # Admin profile management
├── App.jsx             # Main app component with routing
├── index.js            # App entry point
└── index.css           # Global styles and Tailwind imports
```

## Key Components

### Authentication System
- **AuthContext**: Manages user authentication state
- **ProtectedRoute**: Wrapper for authenticated-only pages
- **PublicRoute**: Redirects authenticated users away from login/register

### Layout System
- **Responsive Sidebar**: Collapsible navigation for mobile
- **Top Navigation**: User profile dropdown and quick actions
- **Breadcrumb Navigation**: Clear page hierarchy

### Data Management
- **File Upload**: Drag-and-drop interface for CSV, Excel, and JSON files
- **Data Processing**: Real-time file validation and processing status
- **File Organization**: Advanced search, filtering, and categorization

### Static Data Analytics
- **Data Distribution Pie Chart**: Visual breakdown of data sources and categories
- **Adoption Trends**: Charts showing adoption patterns from uploaded historical data
- **Risk Area Mapping**: Geospatial visualization of high-risk zones from dataset
- **Seasonal Analysis**: Time-based adoption pattern analysis from historical data
- **Data Refresh**: Reload and reprocess uploaded datasets

## API Integration

The frontend is designed to work with a RESTful API. Currently using mock data, but ready for integration with:

- NGO admin authentication endpoints
- Data file upload and processing services
- Analytics and ML prediction services
- File management and organization APIs
- Report generation and export services

## Styling Guidelines

- **Color Scheme**: Primary blue (#2563eb), secondary green, with semantic colors
- **Typography**: Inter font family for modern, readable text
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Components**: Reusable button and input styles defined in CSS

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style and patterns
2. Use meaningful component and variable names
3. Add comments for complex logic
4. Test responsive design on multiple screen sizes
5. Ensure accessibility standards are met

## Key Features for NGO Admins

### 📊 Data Upload & Management
- **Drag-and-Drop Upload**: Easy file upload with progress tracking
- **File Validation**: Automatic validation of CSV, Excel, and JSON formats
- **Bulk Operations**: Select and manage multiple files simultaneously
- **File Organization**: Categorize files by type (intake, outcome, location, etc.)

### 📈 Static Data Analytics
- **Data Distribution Pie Chart**: Visual breakdown of data sources and categories
- **Static Charts**: Line charts, bar charts, and pie charts for uploaded data
- **Risk Area Visualization**: Geospatial mapping of high-risk areas from dataset
- **Trend Analysis**: Historical data visualization with ML predictions
- **Export Reports**: Generate and download comprehensive analysis reports

### 🔧 Admin Tools
- **Dashboard Overview**: Key metrics and quick actions
- **Data Processing Status**: File processing indicators and batch job status
- **Quality Assessment**: Data quality scoring and validation
- **User Management**: Admin profile and system preferences

## Future Enhancements

- [ ] Batch data processing improvements
- [ ] Advanced ML model integration
- [ ] Custom dashboard widgets
- [ ] Integration with external mapping services
- [ ] Automated report scheduling
- [ ] Multi-tenant support for multiple NGOs
- [ ] API rate limiting and monitoring
- [ ] Advanced data visualization libraries (D3.js, Chart.js)

## License

This project is part of the SmartPaws platform for intelligent animal welfare data management and analysis.
