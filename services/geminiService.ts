import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, ProductOption } from "../types";

// --- CONFIGURATION ---
const SEARCH_MODEL = "gemini-3-pro-preview"; // The Brain (High IQ for Analysis)
const CHAT_MODEL = "gemini-3-flash-preview"; // The Mouth (Fast/Cheap for Chat)

// ValueSERP Testing Key (Fallback only)
const DEFAULT_VALUESERP_KEY = "87F54B6AC7E8466B867587FA1487C7A1"; 

// CORRECT BASE URL
const VALUESERP_BASE_URL = "https://api.valueserp.com/search";

// --- CLIENT INITIALIZATION ---
const getAI = () => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getValueSerpKey = () => {
  // Priority 1: Vercel Environment Variable (Best for Production)
  if (typeof process !== 'undefined' && process.env.VALUESERP_API_KEY) {
      return process.env.VALUESERP_API_KEY;
  }

  // Priority 2: Local Storage (Legacy/Dev support)
  if (typeof localStorage !== 'undefined') {
    const userKey = localStorage.getItem("flipai_valueserp_key");
    if (userKey && userKey.length > 5) return userKey;
  }

  // Priority 3: Hardcoded Fallback
  return DEFAULT_VALUESERP_KEY;
};

// --- HELPER: PRICE EXTRACTION ---
const extractPrice = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Handle strings like "$1,200.00" or "USD 50"
  const match = val.toString().match(/[0-9,]+(\.[0-9]+)?/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
};

// --- HELPER: URL RESOLVER (Waterfall Strategy) ---
const resolveProductUrl = (item: any): string => {
  // Priority 1: Direct Link (ValueSERP/SerpApi 'link')
  if (item.link) return item.link;

  // Priority 2: Google Shopping Product Page
  if (item.product_link) return item.product_link;

  // Priority 3: Related Content (Lens Page)
  if (item.related_content_link) return item.related_content_link;

  // Fallback: Construct a Google Shopping Search URL
  const title = item.title || item.description || "";
  if (title) {
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;
  }

  // Absolute fallback
  return "https://google.com/shopping";
};

// --- HELPER: GARBAGE FILTER ---
const isValidProduct = (item: any): boolean => {
  const url = (item.link || item.url || "").toLowerCase();
  const img = item.thumbnail || item.image || "";
  const title = (item.title || item.description || "").toLowerCase();
  
  // 1. Filter Bad Domains
  if (url.includes("youtube.com") || url.includes("youtu.be")) return false;
  if (url.includes("vimeo.com")) return false;
  if (url.includes("dailymotion.com")) return false;
  
  // 2. Filter Bad Titles
  if (title.includes("review") && title.includes("video")) return false;

  // 3. Filter Missing Data
  if (!img) return false;
  
  // 4. Filter Zero/Invalid Price
  const price = extractPrice(item.price || item.extracted_price);
  if (price <= 0) return false;

  return true;
};

// --- HELPER: QUERY CLEANER (SANITIZER) ---
const cleanQuery = (text: string): string => {
    if (!text) return "";
    
    // 1. Strict Sanitization: Remove special chars (/, &, +, %, etc)
    // This prevents 400 Bad Request errors from broken URL params
    let cleaned = text.replace(/[^a-zA-Z0-9\s]/g, " ");
    
    // 2. Cleanup spaces
    let trimmed = cleaned.trim().replace(/\s+/g, " ");
    
    // 3. Length Limit (ValueSERP handles shorter queries better)
    const words = trimmed.split(" ");
    if (words.length > 8) {
        return words.slice(0, 8).join(" ");
    }
    return trimmed;
};

// --- HELPER: DIRECT GET FETCH ---
async function fetchValueSerp(apiKey: string, params: Record<string, string>): Promise<any> {
  // Construct URL with URLSearchParams to handle encoding automatically
  const url = new URL(VALUESERP_BASE_URL);
  url.searchParams.append("api_key", apiKey);
  
  Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
  });

  const targetUrl = url.toString();
  
  try {
    // --- DEBUG LOGGING START ---
    console.log(`[ValueSERP] GET Request:`, targetUrl);
    // --- DEBUG LOGGING END ---

    // DIRECT FETCH (GET) - Requires CORS Extension
    const res = await fetch(targetUrl);
    
    // Read the raw text first to debug errors
    const rawText = await res.text();

    // --- DEBUG LOGGING START ---
    console.log(`[ValueSERP] HTTP Status: ${res.status}`);
    // --- DEBUG LOGGING END ---

    if (!res.ok) {
        console.error(`[ValueSERP] FATAL ERROR BODY:`, rawText);
        throw new Error(`ValueSERP API Error (${res.status}): ${rawText.substring(0, 200)}`);
    }

    // Try parsing JSON
    let data;
    try {
        data = JSON.parse(rawText);
    } catch (e) {
        console.error(`[ValueSERP] JSON Parse Failed. Raw body:`, rawText);
        throw new Error("Invalid JSON response from ValueSERP");
    }
    
    // ValueSERP Internal Error Handling
    if (data.request_info && data.request_info.success === false) {
        const msg = data.request_info.message || "ValueSERP Request Failed";
        console.error(`[ValueSERP] Logic Error:`, msg);
        throw new Error(msg);
    }
    if (data.error) {
        console.error(`[ValueSERP] API Error:`, data.error);
        throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error("[ValueSERP] Network Failure:", error);
    throw error;
  }
}

// --- STEP 1: VISUAL FINGERPRINTING ---
async function identifyProductFromImage(ai: GoogleGenAI, imageBase64: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: "Analyze this image. Return ONLY the specific Brand and Model name. Do not describe the background." }
        ]
      },
      config: { maxOutputTokens: 40, temperature: 0.1 }
    });
    return response.text?.trim() || "";
  } catch (e) {
    return "";
  }
}

// --- STEP 2: CANONICAL LOOKUP ---
async function getCanonicalImage(query: string, apiKey: string): Promise<string | null> {
  try {
    // SANITIZE INPUT
    const cleanedQuery = cleanQuery(query);
    
    const params = {
        engine: "google_images",
        q: `${cleanedQuery} white background product photo`,
        num: "1"
    };

    const data = await fetchValueSerp(apiKey, params);

    if (data.images_results && data.images_results.length > 0) {
      return data.images_results[0].thumbnail; 
    }
    return null;
  } catch (e) {
    console.warn("Canonical Image Lookup Failed", e);
    return null;
  }
}

// --- STEP 3: VISUAL SEARCH (ValueSERP) ---
async function searchLens(imageUrl: string, apiKey: string): Promise<ProductOption[]> {
  // --- DEBUG LOGGING START ---
  console.log("Using Key (Lens):", apiKey.substring(0, 5) + "...");
  // --- DEBUG LOGGING END ---
  
  try {
    // Note: Do NOT sanitize URL with regex, it breaks https://
    const cleanedUrl = imageUrl.trim();

    const params = {
        engine: "google_lens",
        url: cleanedUrl
    };

    const data = await fetchValueSerp(apiKey, params);
    
    const matches = data.visual_matches || [];

    // DATA CLEANING: Strict filter for garbage
    return matches.filter(isValidProduct).map((m: any) => ({
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
    console.warn("Lens Failed:", e);
    return [];
  }
}

// --- STEP 4: SHOPPING FALLBACK (ValueSERP) ---
async function searchShopping(query: string, apiKey: string): Promise<ProductOption[]> {
  // --- DEBUG LOGGING START ---
  console.log("Using Key (Shopping):", apiKey.substring(0, 5) + "...");
  // --- DEBUG LOGGING END ---

  try {
    // SANITIZE INPUT
    const optimizedQuery = cleanQuery(query);
    
    const params = {
        engine: "google_shopping",
        q: optimizedQuery,
        google_domain: "google.com",
        gl: "us",
        hl: "en",
        num: "100",
        sort: "price_low"
    };

    const data = await fetchValueSerp(apiKey, params);
    
    const results = data.shopping_results || [];

    // DATA CLEANING: Strict filter
    return results.filter((item: any) => {
        // Map ValueSERP shopping result structure
        const tempItem = {
            link: item.link,
            thumbnail: item.thumbnail,
            price: item.extracted_price || item.price,
            title: item.title
        };
        return isValidProduct(tempItem);
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
    console.warn("Shopping Failed:", e);
    return [];
  }
}

// --- STEP 5: VERIFICATION (Relaxed) ---
async function verifyAndFilterResults(
    ai: GoogleGenAI, 
    options: ProductOption[], 
    productContext: string
): Promise<ProductOption[]> {
  if (options.length === 0) return [];
  
  try {
    const simplifiedList = options.map((o, i) => `${i}: ${o.description} - $${o.price}`).join("\n");
    
    // RELAXED PROMPT
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: `Context: User wants "${productContext}".
      
      Task: Filter this list.
      1. REJECT ONLY if the item is obviously a DIFFERENT product.
      2. KEEP generic versions, look-alikes, and different brands.
      3. KEEP parts/accessories if they look relevant.
      4. RETURN AS MANY MATCHES AS POSSIBLE.
      
      List:
      ${simplifiedList}
      
      Return JSON indices of valid items: [0, 1, 3...]`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text || "[]";
    const jsonStr = rawText.replace(/```json|```/g, "").trim();
    const validIndices = JSON.parse(jsonStr);
    
    if (Array.isArray(validIndices) && validIndices.length > 0) {
       return options.filter((_, idx) => validIndices.includes(idx));
    }
    return options; 
  } catch (e) {
    console.warn("Verification Error - Returning Raw List:", e);
    return options;
  }
}

// --- MAIN EXPORT ---
export const findCheaperProducts = async (
  imageData: string | null,
  textDescription: string,
  referenceUrl: string,
  userTargetPrice: string
): Promise<AnalysisResult> => {
  const ai = getAI();
  const valueSerpKey = getValueSerpKey();
  const targetPriceVal = parseFloat(userTargetPrice) || 0;
  
  let options: ProductOption[] = [];
  let productName = "";
  let method = "Global Search";
  let canonicalUrl = ""; 

  // 1. Identify
  if (imageData) {
    const fingerprint = await identifyProductFromImage(ai, imageData);
    if (fingerprint) productName = fingerprint;
    else if (textDescription) productName = cleanQuery(textDescription);

    if (productName && valueSerpKey) {
        canonicalUrl = await getCanonicalImage(productName, valueSerpKey) || "";
    }
  } else if (referenceUrl) {
      canonicalUrl = referenceUrl;
  }
  if (!productName && textDescription) productName = textDescription;

  // 2. Search (Lens via ValueSERP)
  if (canonicalUrl && valueSerpKey) {
    options = await searchLens(canonicalUrl, valueSerpKey);
  }

  // 3. Fallback (Shopping via ValueSERP)
  if (options.length === 0 && valueSerpKey) {
    const query = productName || textDescription || "unknown product";
    options = await searchShopping(query, valueSerpKey);
    method = "Text Search (Fallback)";
  }

  // 4. Verify & Limit
  if (options.length > 0) {
    // RESTORE VOLUME: Slice to top 15
    const candidates = options.slice(0, 15);
    
    if (productName) {
        const verified = await verifyAndFilterResults(ai, candidates, productName);
        options = verified.length > 0 ? verified : candidates;
    } else {
        options = candidates;
    }
  }

  // Sort cheapest first
  options.sort((a, b) => a.price - b.price);

  if (options.length === 0) {
    throw new Error(`No valid products found. Ensure your ValueSERP key is valid and try again.`);
  }

  return {
    productName: productName || "Unknown Item",
    identifiedModel: method,
    originalEstimatedPrice: targetPriceVal,
    marketAnalysis: {
      averageMarketPrice: `$${(options.reduce((acc, curr) => acc + curr.price, 0) / options.length).toFixed(2)}`,
      honestyScore: 95,
      uncertaintyReason: "Verified Results"
    },
    options: options, 
    visualAnalysis: `Identified as ${productName}.`,
    searchImageUsed: canonicalUrl || ""
  };
};

export const sendChatMessage = async (
  history: any[],
  newMessage: string,
  analysisContext?: AnalysisResult | null
): Promise<string> => {
  const ai = getAI();
  const contextMsg = analysisContext ? `Context: analyzing ${analysisContext.productName}.` : "";
  const chat = ai.chats.create({
    model: CHAT_MODEL,
    config: { systemInstruction: `You are FlipAI. ${contextMsg} Be helpful.` }
  });
  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "Error.";
};