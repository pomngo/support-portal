import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useState({
    countryCode: '+1',
    mobileNumber: '',
    email: '',
  });

  const [userInfo, setUserInfo] = useState(null);

  const updateSearchParams = (newParams) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
    }));
  };

  const clearSearchParams = () => {
    setSearchParams({
      countryCode: '+1',
      mobileNumber: '',
      email: '',
    });
    setUserInfo(null);
  };

  const value = {
    searchParams,
    userInfo,
    updateSearchParams,
    setUserInfo,
    clearSearchParams,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
