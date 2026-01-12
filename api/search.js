export default async function handler(req, res) {
  // 1. Get query parameters from the incoming request
  // Vercel parses the query string into an object automatically
  const queryParams = req.query;

  // 2. Convert them back to a clean query string
  // This ensures proper encoding of spaces, special characters, etc.
  const queryString = new URLSearchParams(queryParams).toString();

  // 3. Construct the Target URL
  // We attach the cleaned query string to the ValueSERP API endpoint
  const targetUrl = `https://api.valueserp.com/search?${queryString}`;

  try {
    // 4. Call ValueSERP from the server side
    // This requests the data without sending browser-specific headers (like Referer) 
    // that might trigger ValueSERP's security blocks (400 Bad Request).
    const response = await fetch(targetUrl);
    
    // 5. Get the JSON data from ValueSERP
    const data = await response.json();

    // 6. Return the data to the frontend
    // We forward the status code from ValueSERP (e.g., 200 or error codes)
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: "Server Proxy Failed", details: error.message });
  }
}