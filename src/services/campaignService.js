const API_BASE_URL = 'https://h386cmk85a.us-east-1.awsapprunner.com/support_api';

export const campaignService = {
  /**
   * Fetch user campaigns from the API
   * @param {string} countryCode - Country code (e.g., "+1")
   * @param {string} mobileNumber - Mobile number
   * @returns {Promise} - Promise resolving to API response
   */
  async getUserCampaigns(countryCode, mobileNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/user-campaigns/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country_code: countryCode,
          mobile_number: mobileNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
      throw error;
    }
  },
}; 