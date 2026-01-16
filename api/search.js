export default async function handler(req, res) {
  // 1. Extract parameters from the request
  const queryParams = req.query;

  // 2. Build the URL params explicitly to avoid encoding issues
  const params = new URLSearchParams();
  
  // Inject Server-Side Key
  if (process.env.SERPAPI_API_KEY) {
      params.append("api_key", process.env.SERPAPI_API_KEY);
  }
  
  Object.keys(queryParams).forEach((key) => {
    // Avoid overwriting the server-side key if client sends one, 
    // or allow client override depending on policy. 
    // Here we skip 'api_key' from client if we want to enforce server key,
    // but typically we just append what isn't the key if we injected it.
    if (key !== 'api_key') {
        params.append(key, queryParams[key]);
    }
  });

  // 3. GOLDEN ERA TARGET: Direct proxy to SerpApi.com
  const targetUrl = `https://serpapi.com/search.json?${params.toString()}`;

  try {
    // 4. Fetch from SerpApi
    const response = await fetch(targetUrl);
    
    // 5. Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "SerpApi Proxy Failed", details: errorText });
    }

    // 6. Return the data
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
}