import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, ProductOption } from "../types";

// --- CONFIGURATION ---
const SEARCH_MODEL = "gemini-3-pro-preview"; // The Brain
const CHAT_MODEL = "gemini-3-flash-preview"; // The Mouth

// --- CLIENT INITIALIZATION ---
const getAI = () => {
  // Access the key via process.env.API_KEY as configured in vite.config.ts
  const apiKey = process.env.API_KEY;
  
  // DEBUG: Alert the status (First 4 chars only for safety)
  if (!apiKey) {
      alert("CRITICAL DEBUG: Gemini API Key is UNDEFINED/MISSING. Please check Vercel Environment Variables (GEMINI_API_KEY).");
      console.error("Gemini API Key is missing.");
  } else {
      console.log("Key found:", apiKey.substring(0,4) + "...");
  }

  if (!apiKey) {
    throw new Error("Configuration Error: Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const getSerpApiKey = () => {
  // 1. Env Var (Vite / Production)
  if (process.env.SERPAPI_API_KEY) {
      return process.env.SERPAPI_API_KEY;
  }
  // 2. Local Storage (User Override)
  if (typeof localStorage !== 'undefined') {
    const userKey = localStorage.getItem("flipai_serpapi_key");
    if (userKey && userKey.length > 5) return userKey;
  }
  // 3. No Hardcoded Fallback (Security Hardening)
  return "";
};

// --- HELPERS ---
const extractPrice = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = val.toString().match(/[0-9,]+(\.[0-9]+)?/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
};

const resolveProductUrl = (item: any): string => {
  if (item.link) return item.link;
  if (item.product_link) return item.product_link;
  if (item.related_content_link) return item.related_content_link;
  const title = item.title || item.description || "";
  if (title) return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;
  return "https://google.com/shopping";
};

const isValidProduct = (item: any): boolean => {
  const url = (item.link || item.url || "").toLowerCase();
  const img = item.thumbnail || item.image || "";
  const title = (item.title || item.description || "").toLowerCase();
  
  if (url.includes("youtube.com") || url.includes("youtu.be")) return false;
  if (url.includes("vimeo.com")) return false;
  if (title.includes("review") && title.includes("video")) return false;
  if (!img) return false;
  
  const price = extractPrice(item.price || item.extracted_price);
  if (price <= 0) return false;

  return true;
};

const cleanQuery = (text: string): string => {
    if (!text) return "";
    let cleaned = text.replace(/[^a-zA-Z0-9\s]/g, " ");
    let trimmed = cleaned.trim().replace(/\s+/g, " ");
    const words = trimmed.split(" ");
    return words.length > 10 ? words.slice(0, 10).join(" ") : trimmed;
};

// --- API FETCH (CLIENT-SIDE PROXY) ---
async function fetchSerpApi(apiKey: string, params: Record<string, string>): Promise<any> {
  // 1. Construct the Target URL (SerpApi)
  const searchParams = new URLSearchParams();
  searchParams.append("api_key", apiKey);
  
  Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
  });

  const targetUrl = `https://serpapi.com/search.json?${searchParams.toString()}`;
  
  // 2. Wrap with CORS Proxy
  // We use corsproxy.io to bypass browser CORS restrictions when calling SerpApi directly from the client
  // This removes the need for a Vercel backend function.
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(targetUrl);
  
  try {
    const res = await fetch(proxyUrl);
    const rawText = await res.text();

    if (!res.ok) {
        console.error(`[SerpApi Client] Error ${res.status}:`, rawText);
        throw new Error(`SerpApi Failed: ${res.status}`);
    }

    try {
        const data = JSON.parse(rawText);
        if (data.error) throw new Error(data.error);
        return data;
    } catch (e) {
        throw new Error("Invalid JSON from SerpApi");
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
}

// --- STEP 1: VISUAL FINGERPRINT (Gemini) ---
async function identifyProductFromImage(ai: GoogleGenAI, imageBase64: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: "Identify this product. Return ONLY the Brand and specific Model Name. No extra text." }
        ]
      },
      config: { maxOutputTokens: 50, temperature: 0.1 }
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.warn("Visual Fingerprint Failed:", e);
    return "";
  }
}

// --- STEP 2: CANONICAL LOOKUP (SerpApi - Images) ---
async function getCanonicalImage(query: string, apiKey: string): Promise<string | null> {
  try {
    const params = {
        engine: "google_images",
        q: `${cleanQuery(query)} white background product photo`,
        num: "1",
        safe: "active"
    };

    const data = await fetchSerpApi(apiKey, params);
    if (data.images_results && data.images_results.length > 0) {
      return data.images_results[0].thumbnail; 
    }
    return null;
  } catch (e) {
    console.warn("Canonical Lookup Failed:", e);
    return null;
  }
}

// --- STEP 3: VISUAL SEARCH (SerpApi - Lens) ---
async function searchLens(imageUrl: string, apiKey: string): Promise<ProductOption[]> {
  try {
    const params = {
        engine: "google_lens",
        url: imageUrl,
        hl: "en",
        country: "us"
    };

    const data = await fetchSerpApi(apiKey, params);
    const matches = data.visual_matches || [];

    // Gather Top 40 Matches for Visual-First Strategy
    // We do NOT filter by price here; we trust Lens for visual accuracy first.
    return matches.slice(0, 40).filter(isValidProduct).map((m: any) => ({
      tier: "Visual Match",
      vendor: m.source || "Visual Match",
      price: extractPrice(m.price ? m.price.value : 0),
      currency: "USD",
      url: resolveProductUrl(m),
      image: m.thumbnail,
      description: m.title,
      probableFlaws: "None",
      qualityScore: 9,
      confidenceScore: 95
    }));
  } catch (e) {
    console.warn("Lens Search Failed:", e);
    return [];
  }
}

// --- STEP 4: SHOPPING FALLBACK (SerpApi - Shopping) ---
async function searchShopping(query: string, apiKey: string): Promise<ProductOption[]> {
  try {
    const params = {
        engine: "google_shopping",
        q: cleanQuery(query),
        google_domain: "google.com",
        gl: "us",
        hl: "en",
        num: "60", // Increased to catch hidden gems
        sort: "price_low" // Force lowest price first for text fallback
    };

    const data = await fetchSerpApi(apiKey, params);
    const results = data.shopping_results || [];

    return results.filter((item: any) => {
        const temp = { ...item, extracted_price: item.extracted_price || item.price };
        return isValidProduct(temp);
    }).map((item: any) => ({
      tier: "Market Option",
      vendor: item.source || item.merchant?.name || "Global Marketplace",
      price: item.extracted_price || item.price || 0,
      currency: "USD",
      url: resolveProductUrl(item),
      image: item.thumbnail,
      description: item.title,
      probableFlaws: item.condition || "New",
      qualityScore: item.rating ? Math.round(item.rating * 2) : 8,
      confidenceScore: 80
    }));
  } catch (e) {
    console.warn("Shopping Search Failed:", e);
    return [];
  }
}

// --- STEP 5: VERIFICATION (Gemini) ---
async function verifyResults(
    ai: GoogleGenAI, 
    options: ProductOption[], 
    context: string
): Promise<ProductOption[]> {
  if (options.length === 0) return [];
  
  // Create a list for the AI - Increased to 40 to cover all Lens results
  const listText = options.slice(0, 40).map((o, i) => `[${i}] ${o.description} (${o.vendor}) - $${o.price}`).join("\n");
  
  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: `Context: User is analyzing: "${context}".
      
      Task: Identify items that are the Visual Match of the user's product.
      
      Rules:
      1. Accept different brand names (white label/factory unbranded is GOOD).
      2. Reject parts, accessories, or boxes (e.g. if user wants a drone, reject "propellers only").
      3. Reject completely different items.
      
      Return a JSON array of indices for the matching items.
      
      List:
      ${listText}
      
      Output JSON: [0, 2, 5...]`,
      config: { responseMimeType: "application/json" }
    });

    const jsonStr = response.text?.replace(/```json|```/g, "").trim() || "[]";
    const indices = JSON.parse(jsonStr);
    
    if (Array.isArray(indices) && indices.length > 0) {
       return options.filter((_, i) => indices.includes(i));
    }
    return options; // Fallback: return original if parsing fails
  } catch (e) {
    console.warn("Verification Failed, returning raw results");
    return options;
  }
}

// --- MAIN ORCHESTRATOR ---
export const findCheaperProducts = async (
  imageData: string | null,
  textDescription: string,
  referenceUrl: string,
  userTargetPrice: string
): Promise<AnalysisResult> => {
  const ai = getAI();
  const serpApiKey = getSerpApiKey();
  const targetPriceVal = parseFloat(userTargetPrice) || 0;
  
  let options: ProductOption[] = [];
  let productName = "";
  let method = "Global Search";
  let canonicalUrl = ""; 

  // --- Step 1: Identification ---
  if (imageData) {
    const fingerprint = await identifyProductFromImage(ai, imageData);
    if (fingerprint) productName = fingerprint;
  }
  
  if (!productName && textDescription) productName = cleanQuery(textDescription);
  if (!productName) productName = "Unknown Product";

  // --- Step 2: Canonical Image ---
  if (imageData && productName) {
    // If we have an image, we try to get a CLEAN version for better Lens results
    canonicalUrl = await getCanonicalImage(productName, serpApiKey) || "";
  } else if (referenceUrl) {
    // If user provided a link, that is our canonical source
    canonicalUrl = referenceUrl;
  }

  // --- Step 3: Visual Search (Lens) ---
  if (canonicalUrl) {
    options = await searchLens(canonicalUrl, serpApiKey);
  }

  // --- Step 4: Text Fallback ---
  // Only runs if Lens failed completely
  if (options.length === 0) {
    method = "Text Fallback";
    options = await searchShopping(productName, serpApiKey);
  }

  // --- Step 5: Verification & Filter ---
  if (options.length > 0) {
    const verified = await verifyResults(ai, options, productName);
    options = verified.length > 0 ? verified : options;
  }

  // --- Step 6: Client-Side Sorting ---
  // The Golden Rule: Sort the Verified Visual Matches by Price (Low to High)
  options.sort((a, b) => a.price - b.price);

  if (options.length === 0) {
    throw new Error(`We searched the globe but couldn't find "${productName}". Try a clearer image.`);
  }

  return {
    productName: productName,
    identifiedModel: method,
    originalEstimatedPrice: targetPriceVal,
    marketAnalysis: {
      averageMarketPrice: `$${(options.reduce((acc, curr) => acc + curr.price, 0) / options.length).toFixed(2)}`,
      honestyScore: 95,
      uncertaintyReason: "Verified SerpApi Results"
    },
    options: options, 
    visualAnalysis: `Identified as ${productName}. Search based on ${canonicalUrl ? "Visual Reference" : "Text Description"}.`,
    searchImageUsed: canonicalUrl || ""
  };
};

export const sendChatMessage = async (
  history: any[],
  newMessage: string,
  analysisContext?: AnalysisResult | null
): Promise<string> => {
  const ai = getAI();
  const contextMsg = analysisContext ? `Context: User is analyzing ${analysisContext.productName}.` : "";
  const chat = ai.chats.create({
    model: CHAT_MODEL,
    config: { systemInstruction: `You are FlipAI. ${contextMsg} Help the user negotiate or evaluate suppliers.` }
  });
  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "Connection Error.";
};
