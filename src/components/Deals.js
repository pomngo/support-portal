import React, { useState, useEffect, useCallback } from 'react';
import { dealsService } from '../services/dealsService';
import { useSearchContext } from '../context/SearchContext';
import './Deals.css';

const Deals = () => {
  const { searchParams, userInfo, updateSearchParams, setUserInfo } = useSearchContext();
  const [userDeals, setUserDeals] = useState([]);
  const [userAddedDeals, setUserAddedDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('participating'); // 'participating' or 'added'

  const fetchUserData = useCallback(async (countryCode, mobileNumber, email) => {
    if (!mobileNumber.trim() && !email.trim()) {
      setUserInfo(null);
      setUserDeals([]);
      setUserAddedDeals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch user deals and added deals using the deals service
      const [dealsData, addedDealsData] = await Promise.all([
        dealsService.getUserDeals(countryCode, mobileNumber, email),
        dealsService.getUserAddedDeals(countryCode, mobileNumber, email)
      ]);
      
      if (dealsData.users && dealsData.users.length > 0) {
        const user = dealsData.users[0];
        setUserInfo(user);
        setUserDeals(dealsData.deals || []);
        setUserAddedDeals(addedDealsData.deals || []);
      } else {
        // Create specific error message based on search type
        const searchType = email ? 'email' : 'phone number';
        const searchValue = email || mobileNumber;
        setError(`No user found with the specified ${searchType}: ${searchValue}`);
        setUserInfo(null);
        setUserDeals([]);
        setUserAddedDeals([]);
      }
    } catch (error) {
      console.error('Failed to fetch user deals:', error);
      setError('Failed to fetch user deals. Please try again.');
      setUserInfo(null);
      setUserDeals([]);
      setUserAddedDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setUserDeals([]);
    setUserAddedDeals([]);
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

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getDealStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'open':
        return 'status-active';
      case 'completed':
      case 'closed':
        return 'status-completed';
      case 'pending':
      case 'draft':
        return 'status-pending';
      case 'cancelled':
      case 'expired':
        return 'status-cancelled';
      default:
        return 'status-active';
    }
  };

  if (loading) {
    return (
      <div className="deals">
        <div className="loading-container">
          <p>Loading deals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deals">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => fetchUserData(searchParams.countryCode, searchParams.mobileNumber, searchParams.email)} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="deals">
      <div className="deals-content">
        <div className="deals-header">
          <h1>Deals Management</h1>
          <p className="subtitle">Track and manage your deals on the FlocknGo platform</p>
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
              <h3>Deals Management</h3>
              <p>Enter a phone number or email address above to search for user deals and added deals.</p>
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
                  ? `No deals found for the email address: ${searchParams.email}`
                  : `No deals found for the phone number: ${searchParams.countryCode}${searchParams.mobileNumber}`
                }. Please try a different search criteria or check your input.
              </p>
            </div>
          </div>
        )}

        {/* Deals Content - Only show when user has searched and data is available */}
        {hasSearched && userInfo && (
          <div className="deals-content-main">
            {/* User Information Section */}
            <div className="user-info">
              <h2>User Information</h2>
              <div className="user-details">
                <span><strong>Name:</strong> {userInfo.full_name}</span>
                <span><strong>Email:</strong> {userInfo.email}</span>
                <span><strong>Location:</strong> {userInfo.location}</span>
                <span><strong>Total Deals:</strong> {userDeals.length + userAddedDeals.length}</span>
                <span><strong>Member Since:</strong> {formatDate(userInfo.date_joined)}</span>
              </div>
            </div>

            {/* Deals Tabs */}
            <div className="deals-tabs">
              <button
                className={`tab-button ${activeTab === 'participating' ? 'active' : ''}`}
                onClick={() => setActiveTab('participating')}
              >
                Participating Deals ({userDeals.length})
              </button>
              <button
                className={`tab-button ${activeTab === 'added' ? 'active' : ''}`}
                onClick={() => setActiveTab('added')}
              >
                Added Deals ({userAddedDeals.length})
              </button>
            </div>

            {/* Participating Deals Tab */}
            {activeTab === 'participating' && (
              <div className="deals-section">
                <h2>Deals You're Part Of</h2>
                {userDeals.length > 0 ? (
                  <div className="table-section">
                    <div className="table-container">
                      <table className="deals-table">
                        <thead>
                          <tr>
                            <th>Deal Name</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDeals.map((deal) => (
                            <tr key={deal.id} className="deal-row">
                              <td className="deal-name" data-label="Deal Name">
                                <div className="deal-name-content">
                                  <h4>{deal.name || 'Unnamed Deal'}</h4>
                                  <span className="deal-description">{deal.description || 'No description'}</span>
                                </div>
                              </td>
                              <td className="deal-type" data-label="Type">
                                <span className="type-badge">{deal.deal_type || 'General'}</span>
                              </td>
                              <td className="deal-value" data-label="Value">
                                <span className="value-amount">{formatCurrency(deal.value, deal.currency)}</span>
                              </td>
                              <td className="deal-status" data-label="Status">
                                <span className={`status-badge ${getDealStatusClass(deal.status)}`}>
                                  {deal.status || 'Active'}
                                </span>
                              </td>
                              <td className="deal-start-date" data-label="Start Date">
                                {formatDate(deal.start_date)}
                              </td>
                              <td className="deal-end-date" data-label="End Date">
                                {formatDate(deal.end_date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No participating deals found for this user.</p>
                )}
              </div>
            )}

            {/* Added Deals Tab */}
            {activeTab === 'added' && (
              <div className="deals-section">
                <h2>Deals You've Added to FlocknGo</h2>
                {userAddedDeals.length > 0 ? (
                  <div className="table-section">
                    <div className="table-container">
                      <table className="deals-table">
                        <thead>
                          <tr>
                            <th>Deal Name</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Added Date</th>
                            <th>Participants</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userAddedDeals.map((deal) => (
                            <tr key={deal.id} className="deal-row">
                              <td className="deal-name" data-label="Deal Name">
                                <div className="deal-name-content">
                                  <h4>{deal.name || 'Unnamed Deal'}</h4>
                                  <span className="deal-description">{deal.description || 'No description'}</span>
                                </div>
                              </td>
                              <td className="deal-type" data-label="Type">
                                <span className="type-badge">{deal.deal_type || 'General'}</span>
                              </td>
                              <td className="deal-value" data-label="Value">
                                <span className="value-amount">{formatCurrency(deal.value, deal.currency)}</span>
                              </td>
                              <td className="deal-status" data-label="Status">
                                <span className={`status-badge ${getDealStatusClass(deal.status)}`}>
                                  {deal.status || 'Active'}
                                </span>
                              </td>
                              <td className="deal-added-date" data-label="Added Date">
                                {formatDate(deal.created_at)}
                              </td>
                              <td className="deal-participants" data-label="Participants">
                                <span className="participants-count">{deal.participants_count || 0}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No added deals found for this user.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Deals;
