import React, { useState, useEffect, useCallback } from 'react';
import { campaignService } from '../services/campaignService';
import { useSearchContext } from '../context/SearchContext';
import './ActivityListing.css';

const ActivityListing = () => {
  const { searchParams, userInfo, updateSearchParams, setUserInfo } = useSearchContext();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  // Sorting states
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [sortedCampaigns, setSortedCampaigns] = useState([]);

  // Track if initial load is done
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const fetchCampaigns = useCallback(async (countryCode, mobileNumber, email) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getUserCampaigns(countryCode, mobileNumber, email);
      
      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        setUserInfo(user);
        setCampaigns(user.campaigns || []);
        setCurrentPage(1); // Reset to first page on new search
      } else {
        // Create specific error message based on search type
        const searchType = email ? 'email' : 'phone number';
        const searchValue = email || mobileNumber;
        setError(`No user found with the specified ${searchType}: ${searchValue}`);
        setCampaigns([]);
        setUserInfo(null);
        setTotalPages(0);
      }
    } catch (err) {
      setError('Failed to fetch campaigns. Please try again.');
      setCampaigns([]);
      setUserInfo(null);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies on searchParams to prevent auto-search

  // Sort campaigns whenever campaigns, sortField, or sortDirection changes
  useEffect(() => {
    if (campaigns.length > 0) {
      const sorted = [...campaigns].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle nested values
        if (sortField === 'creator_name') {
          aValue = a.creator_name;
          bValue = b.creator_name;
        } else if (sortField === 'campaign_type_display') {
          aValue = a.campaign_type_display || '';
          bValue = b.campaign_type_display || '';
        } else if (sortField === 'stage_display') {
          aValue = a.stage_display;
          bValue = b.stage_display;
        } else if (sortField === 'membership_status') {
          aValue = a.membership?.status_display || '';
          bValue = b.membership?.status_display || '';
        }

        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Handle null/undefined values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Compare values
        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });

      setSortedCampaigns(sorted);
      setTotalPages(Math.ceil(sorted.length / pageSize));
    } else {
      setSortedCampaigns([]);
      setTotalPages(0);
    }
  }, [campaigns, sortField, sortDirection, pageSize]);

  // Only perform initial load on component mount if we have a mobile number
  useEffect(() => {
    if (!initialLoadDone) {
      if (searchParams.mobileNumber.trim()) {
        fetchCampaigns(searchParams.countryCode, searchParams.mobileNumber);
      } else {
        setLoading(false);
        setCampaigns([]);
        setUserInfo(null);
        setTotalPages(0);
      }
      setInitialLoadDone(true);
    }
  }, [fetchCampaigns, searchParams.countryCode, searchParams.mobileNumber, initialLoadDone]);

  // Auto-fetch data when searchParams change (e.g., when navigating from another page)
  useEffect(() => {
    if (initialLoadDone && (searchParams.mobileNumber.trim() || searchParams.email.trim())) {
      fetchCampaigns(searchParams.countryCode, searchParams.mobileNumber, searchParams.email);
    }
  }, [searchParams.countryCode, searchParams.mobileNumber, searchParams.email, initialLoadDone, fetchCampaigns]);

  // Update total pages when pageSize changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateSearchParams({ [name]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (loading) return;
    
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
    
    setError(null);
    fetchCampaigns(searchParams.countryCode.trim(), searchParams.mobileNumber.trim(), searchParams.email.trim());
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedCampaigns.slice(startIndex, endIndex);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (stage) => {
    switch (stage) {
      case 2: return 'status-confirm';
      case 3: return 'status-completed';
      case 4: return 'status-cancelled';
      case 6: return 'status-draft';
      case 7: return 'status-inactive';
      default: return 'status-default';
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="sort-icon">↕️</span>;
    }
    return sortDirection === 'asc' ? 
      <span className="sort-icon active">↑</span> : 
      <span className="sort-icon active">↓</span>;
  };

  const currentPageData = getCurrentPageData();
  const startRecord = sortedCampaigns.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, sortedCampaigns.length);

  return (
    <div className="activity-listing">
      <div className="header">
        <h1>Activity Listing</h1>
        <p className="subtitle">User Campaign Management System</p>
      </div>

      {/* Search Form */}
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
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
              </div>

        {/* Initial State Message */}
        {!userInfo && !loading && !error && initialLoadDone && (
          <div className="initial-state-message">
            <div className="message-content">
              <h3>📋 Activity Listing</h3>
              <p>Enter a phone number above to search for user campaigns and activities.</p>
            </div>
          </div>
        )}

        {/* User Info */}
      {userInfo && (
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
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <p>Loading campaigns...</p>
        </div>
      )}

      {/* Campaigns Table */}
      {!loading && sortedCampaigns.length > 0 && (
        <div className="table-section">
          <div className="table-header">
            <h2>Campaigns ({sortedCampaigns.length})</h2>
            <div className="table-controls">
              <div className="page-size-control">
                <label htmlFor="pageSize">Show:</label>
                <select 
                  id="pageSize" 
                  value={pageSize} 
                  onChange={handlePageSizeChange}
                  className="page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
              </div>
              <div className="page-info">
                Showing {startRecord} to {endRecord} of {sortedCampaigns.length} campaigns
              </div>
            </div>
          </div>
          
          <div className="table-container">
            <table className="campaigns-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} className="sortable">
                    ID {getSortIcon('id')}
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name {getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('campaign_type_display')} className="sortable">
                    Type {getSortIcon('campaign_type_display')}
                  </th>
                  <th onClick={() => handleSort('currency_display')} className="sortable">
                    Currency {getSortIcon('currency_display')}
                  </th>
                  <th onClick={() => handleSort('members_count')} className="sortable">
                    Members {getSortIcon('members_count')}
                  </th>
                  <th onClick={() => handleSort('creator_name')} className="sortable">
                    Creator {getSortIcon('creator_name')}
                  </th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Created Date {getSortIcon('created_at')}
                  </th>
                  <th onClick={() => handleSort('membership_status')} className="sortable">
                    Membership Status {getSortIcon('membership_status')}
                  </th>
                  <th onClick={() => handleSort('overall_rating')} className="sortable">
                    Rating {getSortIcon('overall_rating')}
                  </th>
                  <th onClick={() => handleSort('stage_display')} className="sortable">
                    Status {getSortIcon('stage_display')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.id}</td>
                    <td>
                      <div className="campaign-name">
                        <strong>{campaign.name}</strong>
                        {campaign.description && (
                          <p className="campaign-description">
                            {campaign.description.length > 100
                              ? `${campaign.description.substring(0, 100)}...`
                              : campaign.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="campaign-type">
                        {campaign.campaign_type_display || 'N/A'}
                      </span>
                    </td>
                    <td>{campaign.currency_display}</td>
                    <td>
                      <span className="members-count">{campaign.members_count}</span>
                    </td>
                    <td>
                      <div className="creator-info">
                        <strong>{campaign.creator_name}</strong>
                        <small>{campaign.creator_email}</small>
                      </div>
                    </td>
                    <td>{formatDate(campaign.created_at)}</td>
                    <td>
                      <span className={`membership-status ${campaign.membership?.status === 1 ? 'active' : 'inactive'}`}>
                        {campaign.membership?.status_display || 'N/A'}
                        {campaign.membership?.is_organiser && (
                          <span className="organiser-badge">Organiser</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="rating">
                        {campaign.overall_rating > 0 ? `⭐ ${campaign.overall_rating}` : 'No rating'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(campaign.stage)}`}>
                        {campaign.stage_display}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="pagination-numbers">
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button 
                className="pagination-btn" 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Data Message */}
      {!loading && sortedCampaigns.length === 0 && !error && initialLoadDone && (
        <div className="no-data">
          <p>No campaigns found for the specified user.</p>
        </div>
      )}
    </div>
  );
};

export default ActivityListing; 