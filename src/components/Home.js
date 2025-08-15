import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { campaignService } from '../services/campaignService';
import { useSearchContext } from '../context/SearchContext';
import './Home.css';

const Home = () => {
  const location = useLocation();
  const { searchParams, userInfo, updateSearchParams, setUserInfo } = useSearchContext();
  const [userActivities, setUserActivities] = useState([]);
  const [userFlocks, setUserFlocks] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const generateMockData = useCallback((user) => {
    // Extract real flock data from user campaigns
    const extractFlocksFromCampaigns = (campaigns) => {
      if (!campaigns || campaigns.length === 0) return [];
      
      // Group campaigns by creator to simulate flocks
      const flocksMap = new Map();
      
      campaigns.forEach(campaign => {
        const creatorId = campaign.creator_id || campaign.creator_name || 'unknown';
        const creatorName = campaign.creator_name || 'Unknown Creator';
        
        if (!flocksMap.has(creatorId)) {
          flocksMap.set(creatorId, {
            id: creatorId,
            name: creatorName,
            description: `Community organized by ${creatorName}`,
            activitiesOrganized: 0,
            members: campaign.members_count || 0,
            createdDate: campaign.created_at,
            category: campaign.campaign_type_display || 'General',
            status: 'Active',
            memberRole: campaign.membership?.is_organiser ? 'Organizer' : 'Participant',
            lastActivity: campaign.updated_at || campaign.created_at,
            privacy: 'Public',
            tags: [campaign.campaign_type_display || 'General']
          });
        }
        
        const flock = flocksMap.get(creatorId);
        flock.activitiesOrganized += 1;
        
        // Update member count if this campaign has more members
        if (campaign.members_count > flock.members) {
          flock.members = campaign.members_count;
        }
        
        // Update last activity
        if (campaign.updated_at && new Date(campaign.updated_at) > new Date(flock.lastActivity)) {
          flock.lastActivity = campaign.updated_at;
        }
      });
      
      // Convert map to array and sort by last activity
      return Array.from(flocksMap.values()).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    };

    // Generate real flock data from user campaigns
    const realFlocks = extractFlocksFromCampaigns(user.campaigns || []);
    setUserFlocks(realFlocks);
  }, []);

  const fetchUsageHistory = useCallback(async (countryCode, mobileNumber, email) => {
    try {
      const data = await campaignService.getUserUsageHistory(countryCode, mobileNumber, email);
      
      if (data.usage_history && Array.isArray(data.usage_history)) {
        setUsageHistory(data.usage_history);
      } else {
        // If no usage history data or invalid format, set empty array
        setUsageHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch usage history:', error);
      // If API call fails, set empty array
      setUsageHistory([]);
    }
  }, []);

  const fetchUserData = useCallback(async (countryCode = '+1', mobileNumber = '7815791608', email = '') => {
    try {
      setLoading(true);
      // Fetch user campaigns (activities) using existing service
      const data = await campaignService.getUserCampaigns(countryCode, mobileNumber, email);
      
      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        setUserInfo(user);
        setUserActivities(user.campaigns || []);
        
        // Generate real flock data from campaigns and fetch usage history
        generateMockData(user);
        fetchUsageHistory(countryCode, mobileNumber, email); // Fetch usage history
      } else {
        // Create specific error message based on search type
        const searchType = email ? 'email' : 'phone number';
        const searchValue = email || mobileNumber;
        setError(`No user found with the specified ${searchType}: ${searchValue}`);
        setUserInfo(null);
        setUserActivities([]);
        setUserFlocks([]);
        setUsageHistory([]);
      }
    } catch (err) {
      setError('Failed to fetch user data. Please try again.');
      setUserInfo(null);
      setUserActivities([]);
      setUserFlocks([]);
      setUsageHistory([]);
    } finally {
      setLoading(false);
    }
  }, [generateMockData, fetchUsageHistory]);

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
    
    // Clear previous data when starting new search
    setUsageHistory([]);
    
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
    setUserActivities([]);
    setUserFlocks([]);
    setUsageHistory([]);
    setHasSearched(false);
  }, []);

  const getRoleDisplay = (membership) => {
    if (membership?.is_organiser) return 'Organizer';
    return 'Participant';
  };

  const getStatusDisplay = (stage) => {
    switch (stage) {
      case 2: return 'Ongoing';
      case 3: return 'Completed';
      case 4: return 'Completed';
      case 6: return 'Draft';
      case 7: return 'Inactive';
      default: return 'Ongoing';
    }
  };

  const getStatusClass = (stage) => {
    switch (stage) {
      case 2: return 'status-ongoing';
      case 3: return 'status-completed';
      case 4: return 'status-completed';
      case 6: return 'status-draft';
      case 7: return 'status-inactive';
      default: return 'status-ongoing';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to check if table needs scroll indicator
  const checkScrollIndicator = (tableRef) => {
    if (tableRef && tableRef.current) {
      const container = tableRef.current;
      const hasScroll = container.scrollHeight > container.clientHeight;
      const section = container.closest('.table-section');
      if (section) {
        if (hasScroll) {
          section.classList.add('has-scroll');
        } else {
          section.classList.remove('has-scroll');
        }
      }
    }
  };

  // Refs for table containers
  const activitiesTableRef = useRef(null);
  const flocksTableRef = useRef(null);

  // Check scroll indicators when data changes
  useEffect(() => {
    if (userActivities.length > 0) {
      setTimeout(() => checkScrollIndicator(activitiesTableRef), 100);
    }
    if (userFlocks.length > 0) {
      setTimeout(() => checkScrollIndicator(flocksTableRef), 100);
    }
  }, [userActivities, userFlocks]);

  if (loading) {
    return (
      <div className="home">
        <div className="loading-container">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchUserData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home-content">
        <div className="welcome-header">
          <h1>Support Portal</h1>
          <p className="subtitle">Here's your activity overview</p>
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
              <h3>👋 Welcome to Your Dashboard</h3>
              <p>Enter a phone number above and click Search to view your dashboard.</p>
            </div>
          </div>
        )}

        {hasSearched && userInfo && (
          <div className="dashboard-grid">
            {/* Activities Section */}
            <div className="dashboard-section activities-section">
              <div className="section-header">
                <h2>Activities ({userActivities.length})</h2>
                <a href="/activities" className="view-all-btn">View All</a>
              </div>
              <div className="section-content">
                {userActivities.length > 0 ? (
                  <div className="table-section">
                    <div className="table-container" ref={activitiesTableRef}>
                      <table className="activities-table">
                        <thead>
                          <tr>
                            <th>Activity Name</th>
                            <th>Flock</th>
                            <th>Your Role</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userActivities.slice(0, 5).map((activity) => (
                            <tr key={activity.id} className="activity-row">
                              <td className="activity-name" data-label="Activity Name">
                                <h4>{activity.name}</h4>
                              </td>
                              <td className="flock-name" data-label="Flock">
                                <span className="flock-label">{activity.creator_name || 'N/A'}</span>
                              </td>
                              <td className="role-info" data-label="Your Role">
                                <span className={`role-badge ${getRoleDisplay(activity.membership).toLowerCase()}`}>
                                  {getRoleDisplay(activity.membership)}
                                </span>
                              </td>
                              <td className="status-info" data-label="Status">
                                <span className={`status-badge ${getStatusClass(activity.stage)}`}>
                                  {getStatusDisplay(activity.stage)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No activities found</p>
                )}
              </div>
            </div>

          {/* Flocks Section */}
          <div className="dashboard-section flocks-section">
            <div className="section-header">
              <h2>Flocks ({userFlocks.length})</h2>
              <a href="/flock" className="view-all-btn">View All</a>
            </div>
            <div className="section-content">
              {userFlocks.length > 0 ? (
                <div className="table-section">
                  <div className="table-container" ref={flocksTableRef}>
                    <table className="flocks-table">
                      <thead>
                        <tr>
                          <th>Flock Name</th>
                          <th>Category</th>
                          <th>Your Role</th>
                          <th>Activities</th>
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
                            <td className="flock-category" data-label="Category">
                              <span className="category-badge">{flock.category || 'General'}</span>
                            </td>
                            <td className="role-info" data-label="Your Role">
                              <span className={`role-badge ${flock.memberRole?.toLowerCase() || 'participant'}`}>
                                {flock.memberRole || 'Participant'}
                              </span>
                            </td>
                            <td className="activities-count" data-label="Activities">
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
                <p className="no-data">No flocks found</p>
              )}
            </div>
          </div>

          {/* Usage History Section */}
          <div className="dashboard-section usage-section">
            <h2>Usage History</h2>
            <div className="section-content">
              {usageHistory.length > 0 ? (
                <div className="usage-list">
                  {usageHistory.map((session, index) => (
                    <div key={index} className="usage-item">
                      <div className="usage-date">{formatDate(session.date)}</div>
                      <div className="usage-details">
                        <span>Duration: {session.duration}</span>
                        <span>Sessions: {session.sessions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No usage data available</p>
              )}
            </div>
          </div>

          {/* Profile Section */}
          <div className="dashboard-section profile-section">
            <h2>Profile</h2>
            <div className="section-content">
              {userInfo ? (
                <div className="profile-info">
                  <div className="profile-avatar">
                    <div className="avatar-placeholder">
                      {userInfo.full_name?.charAt(0) || 'U'}
                    </div>
                  </div>
                  <div className="profile-details">
                    <h4>{userInfo.full_name}</h4>
                    <p>{userInfo.email}</p>
                    <p>Location: {userInfo.location || 'Not specified'}</p>
                    <p>Member since: {formatDate(userInfo.date_joined)}</p>
                    <p>Total Campaigns: {userInfo.total_campaigns}</p>
                  </div>
                </div>
              ) : (
                <p className="no-data">Profile information not available</p>
              )}
            </div>
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
                  ? `No user data found for the email address: ${searchParams.email}`
                  : `No user data found for the phone number: ${searchParams.countryCode}${searchParams.mobileNumber}`
                }. Please try a different search criteria or check your input.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
