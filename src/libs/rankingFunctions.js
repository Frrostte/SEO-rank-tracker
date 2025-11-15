import axios from 'axios';

export async function doGoogleSearch(keyword) {
  try {
    const params = {
      q: keyword,
      api_key: process.env.SERPAPI_API_KEY,
      num: 100,
      gl: 'in'
    };
    
    const response = await axios.get('https://serpapi.com/search', { params });
    console.log(`Google search results for: ${keyword}`);
    
    if (response?.data?.organic_results) {
      return response.data;
    } else {
      console.error('No organic results in response for keyword: ' + keyword);
      return null;
    }
  } catch (error) {
    console.error('Error fetching Google search results:', error.message);
    return null;
  }
}
