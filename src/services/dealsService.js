const API_BASE_URL = 'https://h386cmk85a.us-east-1.awsapprunner.com/support_api';

export const dealsService = {
  /**
   * Fetch user deals from the API
   * @param {string} countryCode - Country code (e.g., "+1")
   * @param {string} mobileNumber - Mobile number
   * @param {string} email - User email (optional)
   * @returns {Promise} - Promise resolving to deals data
   */
  async getUserDeals(countryCode, mobileNumber, email = '') {
    try {
      const requestBody = {
        country_code: countryCode,
        mobile_number: mobileNumber,
      };
      
      // Add email to request if provided
      if (email && email.trim()) {
        requestBody.email = email.trim();
      }

      const response = await fetch(`${API_BASE_URL}/user-deals/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user deals:', error);
      throw error;
    }
  },

  /**
   * Fetch deals added by user to FlocknGo platform
   * @param {string} countryCode - Country code (e.g., "+1")
   * @param {string} mobileNumber - Mobile number
   * @param {string} email - User email (optional)
   * @returns {Promise} - Promise resolving to deals added by user
   */
  async getUserAddedDeals(countryCode, mobileNumber, email = '') {
    try {
      const requestBody = {
        country_code: countryCode,
        mobile_number: mobileNumber,
      };
      
      // Add email to request if provided
      if (email && email.trim()) {
        requestBody.email = email.trim();
      }

      const response = await fetch(`${API_BASE_URL}/user-added-deals/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user added deals:', error);
      throw error;
    }
  },
};
