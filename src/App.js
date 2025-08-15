import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.js';
import Home from './components/Home.js';
import ServiceRequest from './components/ServiceRequest.js';
import ActivityListing from './components/ActivityListing.js';
import Flocks from './components/Flocks.js';
import Deals from './components/Deals.js';
import PlaceholderPage from './components/PlaceholderPage.js';
import { SearchProvider } from './context/SearchContext.js';
import './App.css';

function App() {
  return (
    <SearchProvider>
      <Router>
        <div className="App">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/service-request" element={<ServiceRequest />} />
              <Route path="/documents" element={
                <PlaceholderPage 
                  title="Documents" 
                  description="Access and manage your documents"
                  icon="📄"
                />
              } />
              <Route path="/whatsapp" element={
                <PlaceholderPage 
                  title="What's App" 
                  description="Communication and messaging center"
                  icon="💬"
                />
              } />
              <Route path="/activities" element={<ActivityListing />} />
              <Route path="/flock" element={<Flocks />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/settings" element={
                <PlaceholderPage 
                  title="Settings" 
                  description="Configure your account preferences"
                  icon="⚙️"
                />
              } />
              <Route path="/logout" element={
                <PlaceholderPage 
                  title="Logout" 
                  description="Sign out of your account"
                  icon="🚪"
                />
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </SearchProvider>
  );
}

export default App;
