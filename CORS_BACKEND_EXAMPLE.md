# Backend CORS Configuration Example

This document provides sample code for implementing CORS (Cross-Origin Resource Sharing) support on the CryptoPro backend server to allow communication between the frontend at `https://cryptopro-1.onrender.com` and the backend at `https://cryptopro.onrender.com`.

## Current Error You're Facing

The error message indicates two main issues:

1. The backend is using a wildcard (`*`) for `Access-Control-Allow-Origin` when credentials are included in the request.
2. The CORS policy is blocking the custom header `X-Requested-From` used by the proxy fallback mechanism.

These can be fixed with the proper server-side configuration below.

## Express.js Implementation

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'https://cryptopro-1.onrender.com',
    'http://localhost:3000'  // For local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-Requested-From'],
  credentials: true,
  maxAge: 86400  // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Support for handling preflight requests with credentials
app.options('*', cors(corsOptions));

// For handling requests that come through proxies
app.use((req, res, next) => {
  // Check for requests coming from a proxy
  const requestedFrom = req.headers['x-requested-from'];
  
  // If the request is from our frontend via a proxy, allow it
  if (requestedFrom && corsOptions.origin.includes(requestedFrom)) {
    res.header('Access-Control-Allow-Origin', requestedFrom);
  }
  
  next();
});

// Rest of your Express app code...
```

## Node.js with http Server Implementation

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', 'https://cryptopro-1.onrender.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-Requested-From');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Handle regular requests...
  // Your API implementation goes here
});

server.listen(process.env.PORT || 3000);
```

## PHP Implementation

```php
<?php
// Allow from our frontend domain
header("Access-Control-Allow-Origin: https://cryptopro-1.onrender.com");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Requested-From");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // 24 hours

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit();
}

// Continue with the rest of your API code...
?>
```

## Python Flask Implementation

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS
cors = CORS(
    app,
    resources={r"/*": {
        "origins": [
            "https://cryptopro-1.onrender.com",
            "http://localhost:3000"  # For local development
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With", "X-Requested-From"],
        "supports_credentials": True,
        "max_age": 86400  # 24 hours
    }}
)

# Your Flask API routes go here...

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
```

## Testing Your CORS Configuration

After implementing these changes, you should test your CORS configuration by:

1. Deploying the updated backend code to `https://cryptopro.onrender.com`
2. Accessing your frontend from `https://cryptopro-1.onrender.com`
3. Opening your browser's developer tools (F12) and checking the Network tab for any CORS errors
4. Testing all main functionality: login, registration, fetching prices, wallet data, etc.

## Common CORS Issues & Solutions

1. **Using wildcard with credentials**: You cannot use `Access-Control-Allow-Origin: *` with `credentials: true`. You must specify the exact origin.

2. **Missing preflight handling**: Always respond to `OPTIONS` requests with appropriate headers and a 204 status code.

3. **Missing headers in allowedHeaders**: Make sure all custom headers (like `X-Requested-From`) are included in the list of allowed headers.

4. **URL mismatch**: Ensure the exact origin URL is used (e.g., with or without trailing slash).

5. **HTTP vs HTTPS**: Make sure you're matching the correct protocol in your origin configuration.

6. **Wrong case in headers**: Header names are case-sensitive in some environments.

If you continue to have CORS issues after implementing the server-side configuration, check:

1. That your backend server is correctly configured to respond to OPTIONS requests
2. That all necessary headers are included in the responses
3. That the origin URL is exactly correct (no trailing slashes if not in the actual origin)
4. Whether your hosting provider has any additional security rules that might be blocking CORS requests 