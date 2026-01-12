export default async function handler(req, res) {
  try {
    // 1. Construct the target URL using the incoming query parameters from the frontend
    // req.url includes the query string (e.g., /api/search?q=iphone&api_key=...)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const targetUrl = `https://api.valueserp.com/search${url.search}`;

    // 2. Server-side fetch
    // This runs on Vercel's servers, so it does not send your browser's headers.
    const response = await fetch(targetUrl);
    
    // 3. Handle response
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return res.status(response.status).json(data);
    } else {
        const text = await response.text();
        return res.status(response.status).send(text);
    }
  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}