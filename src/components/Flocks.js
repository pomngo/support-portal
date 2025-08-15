import React, { useState, useEffect, useCallback } from 'react';
import { campaignService } from '../services/campaignService';
import { useSearchContext } from '../context/SearchContext';
import './Flocks.css';

function Flocks() {
  const { searchParams, userInfo, updateSearchParams, setUserInfo } = useSearchContext();
  const [userFlocks, setUserFlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const generateMockFlocks = useCallback((user) => {
    // Extract real flock data from user campaigns
    const extractFlocksFromCampaigns = (campaigns) => {
      if (!campaigns || campaigns.length === 0) return [];
      
      // Group campaigns by creator to simulate flocks
      const flockMap = new Map();
      
      campaigns.forEach(campaign => {
        const creatorName = campaign.creator_name || 'Unknown Creator';
        
        if (!flockMap.has(creatorName)) {
          flockMap.set(creatorName, {
            id: `flock-${creatorName.toLowerCase().replace(/\s+/g, '-')}`,
            name: creatorName,
            description: `Flock managed by ${creatorName}`,
            category: campaign.campaign_type_display || 'General',
            memberRole: campaign.membership?.is_organiser ? 'Organizer' : 'Participant',
            privacy: 'Public',
            activitiesOrganized: 0,
            members: Math.floor(Math.random() * 50) + 10,
            createdDate: campaign.created_at,
            lastActivity: campaign.updated_at,
            status: campaign.stage === 2 ? 'Active' : 'Inactive'
          });
        }
        
        // Count activities for this creator
        const flock = flockMap.get(creatorName);
        flock.activitiesOrganized++;
      });
      
      return Array.from(flockMap.values());
    };

    const flocks = extractFlocksFromCampaigns(user.campaigns || []);
    setUserFlocks(flocks);
  }, []);

  const fetchUserData = useCallback(async (countryCode = '+1', mobileNumber = '', email = '') => {
    if (!mobileNumber.trim() && !email.trim()) {
      setUserInfo(null);
      setUserFlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch user campaigns using existing service
      const data = await campaignService.getUserCampaigns(countryCode, mobileNumber, email);
      
      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        setUserInfo(user);
        generateMockFlocks(user);
      } else {
        // Create specific error message based on search type
        const searchType = email ? 'email' : 'phone number';
        const searchValue = email || mobileNumber;
        setError(`No user found with the specified ${searchType}: ${searchValue}`);
        setUserInfo(null);
        setUserFlocks([]);
      }
    } catch (err) {
      setError('Failed to fetch user data. Please try again.');
      setUserInfo(null);
      setUserFlocks([]);
    } finally {
      setLoading(false);
    }
  }, [generateMockFlocks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateSearchParams({ [name]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchLoading) return;
    
    const hasPhone = searchParams.mobileNumber.trim();
    const hasEmail = searchParams.email.trim();
    
    if (!searchParams.countryCode.trim()) {
      setError('Please select a country code.');
      return;
    }
    
    if (!hasPhone && !hasEmail) {
      setError('Please enter either a mobile number or email address.');
      return;
    }
    
    if (hasPhone && hasEmail) {
      setError('Please enter either a mobile number OR email address, not both.');
      return;
    }
    
    setSearchLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      await fetchUserData(searchParams.countryCode.trim(), searchParams.mobileNumber.trim(), searchParams.email.trim());
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    // Only clear data on component mount - don't auto-fetch
    setLoading(false);
    setUserInfo(null);
    setUserFlocks([]);
    setHasSearched(false);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flocks-container">
        <div className="loading-container">
          <p>Loading flock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flocks-container">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => fetchUserData(searchParams.countryCode, searchParams.mobileNumber, searchParams.email)} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flocks-container">
      <div className="flocks-header">
        <h1>Flocks</h1>
        <p>Manage and organize your flocks</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-inputs">
            <div className="input-group">
              <label htmlFor="countryCode">Country Code</label>
              <select
                id="countryCode"
                name="countryCode"
                value={searchParams.countryCode}
                onChange={handleInputChange}
                required
              >
                <option value="+1">+1 (US/Canada)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (India)</option>
                <option value="+61">+61 (Australia)</option>
                <option value="+86">+86 (China)</option>
                <option value="+81">+81 (Japan)</option>
                <option value="+49">+49 (Germany)</option>
                <option value="+33">+33 (France)</option>
                <option value="+39">+39 (Italy)</option>
                <option value="+34">+34 (Spain)</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={searchParams.mobileNumber}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                disabled={!!searchParams.email.trim()}
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={searchParams.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                disabled={!!searchParams.mobileNumber.trim()}
              />
            </div>
          </div>
          <button type="submit" className="search-btn" disabled={searchLoading}>
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Initial State Message */}
      {!hasSearched && !userInfo && !loading && !error && (
        <div className="initial-state-message">
          <div className="message-content">
            <h3>Flock Management</h3>
            <p>Enter a phone number above and click Search to view user flocks.</p>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {hasSearched && !userInfo && !loading && !error && (
        <div className="no-results-message">
          <div className="message-content">
            <h3>No Results Found</h3>
            <p>
              {searchParams.email.trim() 
                ? `No flocks found for the email address: ${searchParams.email}`
                : `No flocks found for the phone number: ${searchParams.countryCode}${searchParams.mobileNumber}`
              }. Please try a different search criteria or check your input.
            </p>
          </div>
        </div>
      )}

            {/* Flocks Content - Only show when user has searched and data is available */}
      {hasSearched && userInfo && (
        <div className="flocks-content">
          {/* User Information Section */}
          <div className="user-info">
            <h2>User Information</h2>
            <div className="user-details">
              <span><strong>Name:</strong> {userInfo.full_name}</span>
              <span><strong>Email:</strong> {userInfo.email}</span>
              <span><strong>Location:</strong> {userInfo.location}</span>
              <span><strong>Total Campaigns:</strong> {userInfo.total_campaigns}</span>
              <span><strong>Member Since:</strong> {formatDate(userInfo.date_joined)}</span>
            </div>
          </div>

          <div className="flocks-section">
            <h2>Active Flocks ({userFlocks.length})</h2>
            {userFlocks.length > 0 ? (
              <div className="table-section">
                <div className="table-container">
                  <table className="flocks-table">
                    <thead>
                      <tr>
                        <th>Flock Name</th>
                        <th>Activities Organized</th>
                        <th>Members</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userFlocks.map((flock) => (
                        <tr key={flock.id} className="flock-row">
                          <td className="flock-name" data-label="Flock Name">
                            <div className="flock-name-content">
                              <h4>{flock.name}</h4>
                              <span className={`flock-status ${flock.status?.toLowerCase() || 'active'}`}>
                                {flock.status || 'Active'}
                              </span>
                            </div>
                          </td>
                          <td className="activities-count" data-label="Activities Organized">
                            <span className="count-badge">{flock.activitiesOrganized}</span>
                          </td>
                          <td className="members-count" data-label="Members">
                            <span className="count-badge">{flock.members}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="no-data">No flocks found for this user.</p>
            )}
          </div>
          

        </div>
      )}
    </div>
  );
}

export default Flocks;
