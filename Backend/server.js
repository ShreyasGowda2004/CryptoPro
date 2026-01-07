require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
const apiKey = process.env.CMC_API_KEY; // Crypto API key

// Use a hardcoded MongoDB URI for local development if environment variable is not set
const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptoPro';

// Middleware
app.use(cors({
  origin: ['https://cryptopro-1.onrender.com', 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Admin-Key']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const session = require('express-session');
// Use session middleware
app.use(
    session({
      secret: jwtSecret,
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }, // Set `secure: true` for HTTPS
    })
  );

// MongoDB Connection
mongoose
  .connect(mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err.message);
    process.exit(1);
  });

// Configure Multer for Image Upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit: 1MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG files are allowed!'), false);
    }
  },
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const Admin = mongoose.model('Admin', adminSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  idProofNumber: { type: String, required: true },
  dob: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  idProofImage: { type: Buffer, required: true },
  purchases: [
    {
      coin: { type: String, required: true },
      quantity: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  transactions: [
    {
      type: { type: String, required: true },
      coin: { type: String, required: true },
      quantity: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
});
const User = mongoose.model('User', userSchema);

// Authentication Middleware
const authenticateUser = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { email: decoded.email };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};
// Middleware to Authenticate Admin Token
require('dotenv').config(); // Load .env variables

const authenticateAdmin = (req, res, next) => {
  const adminKey = req.header('Admin-Key');
  if (!adminKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No Admin-Key provided' });
  }

  // Compare provided key with stored secret
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ success: false, message: 'Forbidden: Invalid Admin-Key' });
  }

  // Admin authenticated
  req.admin = { role: 'admin' };
  next();
};
// Fetching Admin key
app.get('/admin/config', (req, res) => {
  res.json({ adminKey: process.env.ADMIN_SECRET_KEY });
});


// Registration Route
app.post('/register', async (req, res) => {
  const { name, contactNumber, idProofNumber, dob, email, password, idProofBase64, idProofFilename, idProofType } = req.body;

  // Check if ID proof image data is provided
  if (!idProofBase64) {
    return res.status(400).json({ success: false, message: 'ID proof image is required and must be in JPG format.' });
  }

  // Validate password complexity
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must meet complexity requirements.' });
  }

  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email address already exists. Please use a different email.' });
    }

    // Check if contact number already exists
    const existingContact = await User.findOne({ contactNumber });
    if (existingContact) {
      return res.status(400).json({ success: false, message: 'Contact number already exists. Please use a different contact number.' });
    }

    // Check if ID proof number already exists
    const existingIdProof = await User.findOne({ idProofNumber });
    if (existingIdProof) {
      return res.status(400).json({ success: false, message: 'ID proof number already exists. Please verify your information.' });
    }

    // Convert base64 to buffer
    const idProofBuffer = Buffer.from(idProofBase64, 'base64');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user details to MongoDB
    const user = new User({
      name,
      contactNumber,
      idProofNumber,
      dob,
      email,
      password: hashedPassword,
      idProofImage: idProofBuffer,
    });

    await user.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found. Please check your email or register for an account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ email: user.email }, jwtSecret, { expiresIn: '1h' });

    // Set CORS headers explicitly for this response
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      name: user.name, // Include the user's name
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Delete user by email (and all associated data)
app.delete("/admin/users/:email", authenticateAdmin, async (req, res) => {
  try {
      const { email } = req.params;

      // Find and delete user
      const deletedUser = await User.findOneAndDelete({ email });

      if (!deletedUser) {
          return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
          success: true,
          message: "User deleted successfully",
          deletedUser: {
              name: deletedUser.name,
              email: deletedUser.email,
              contactNumber: deletedUser.contactNumber,
              idProofNumber: deletedUser.idProofNumber,
              dob: deletedUser.dob,
              idProofImage: deletedUser.idProofImage ? deletedUser.idProofImage.toString("base64") : null, // Convert image buffer to Base64
              purchases: deletedUser.purchases,
          },
      });
  } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Route to fetch ID proof image by user ID
app.get('/get-idproof/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.idProofImage) {
      return res.status(404).send('ID proof image not found');
    }
    res.set('Content-Type', 'image/jpeg');
    res.send(user.idProofImage);
  } catch (err) {
    console.error('Error fetching ID proof image:', err);
    res.status(500).send('Failed to fetch ID proof image');
  }
});


// Buy Cryptocurrency Route
app.post('/buy', authenticateUser, async (req, res) => {
    const { coin, quantity, totalPrice } = req.body;

    if (!coin || !quantity || quantity <= 0 || !totalPrice || totalPrice <= 0) {
        return res.status(400).json({ success: false, message: 'All fields are required and must be valid' });
    }

    try {
        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the coin already exists in the user's purchases
        const existingPurchase = user.purchases.find(p => p.coin === coin);

        if (existingPurchase) {
            // Update the existing purchase
            existingPurchase.quantity += quantity;
            existingPurchase.totalPrice += totalPrice;
        } else {
            // Add a new purchase
            user.purchases.push({
                coin,
                quantity,
                totalPrice,
            });
        }

        // Add a buy transaction to the user's transactions array
        // If transactions array doesn't exist, create it
        if (!user.transactions) {
            user.transactions = [];
        }

        // Add the buy transaction
        user.transactions.push({
            type: 'Buy',
            coin: coin,
            quantity: quantity,
            totalPrice: totalPrice,
            date: new Date()
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: `Successfully purchased ${quantity} ${coin}(s) for $${totalPrice}.`,
            purchases: user.purchases,
            transaction: {
                type: 'Buy',
                coin: coin,
                quantity: quantity,
                totalPrice: totalPrice,
                date: new Date()
            }
        });
    } catch (err) {
        console.error('Error during purchase:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Sell Cryptocurrency Route
app.post('/sell', authenticateUser, async (req, res) => {
  const { coin, quantity, totalPrice } = req.body;

  if (!coin || !quantity || quantity <= 0 || !totalPrice || totalPrice <= 0) {
      return res.status(400).json({ success: false, message: 'All fields are required and must be valid.' });
  }

  try {
      const user = await User.findOne({ email: req.user.email });

      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Check if the coin exists in the user's holdings
      const existingPurchase = user.purchases.find(p => p.coin === coin);

      if (!existingPurchase || existingPurchase.quantity < quantity) {
          return res.status(400).json({ success: false, message: 'Insufficient quantity to sell.' });
      }

      // Update the quantity and total price
      existingPurchase.quantity -= quantity;
      existingPurchase.totalPrice -= totalPrice;

      // Remove the coin entry if quantity becomes zero
      if (existingPurchase.quantity <= 0) {
          user.purchases = user.purchases.filter(p => p.coin !== coin);
      }

      // Add a sell transaction to the user's transactions array
      // If transactions array doesn't exist, create it
      if (!user.transactions) {
          user.transactions = [];
      }

      // Add the sell transaction
      user.transactions.push({
          type: 'Sell',
          coin: coin,
          quantity: quantity,
          totalPrice: totalPrice,
          date: new Date()
      });

      await user.save();

      res.status(200).json({
          success: true,
          message: `Successfully sold ${quantity} ${coin}(s) for $${totalPrice}.`,
          purchases: user.purchases,
          transaction: {
              type: 'Sell',
              coin: coin,
              quantity: quantity,
              totalPrice: totalPrice,
              date: new Date()
          }
      });
  } catch (err) {
      console.error('Error during sale:', err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Wallet Route
app.get('/wallet', authenticateUser, async (req, res) => {
  try {
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Return both purchases (holdings) and transactions history
      res.status(200).json({ 
          success: true, 
          wallet: user.purchases,
          transactions: user.transactions || [] 
      });
  } catch (err) {
      console.error('Error fetching wallet:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch User Details by Email
app.get('/user', authenticateUser, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
// FETCHING LIVE CURRENCY PRICE
app.get('/crypto-price', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ success: false, message: 'Coin parameter is required' });
  }

  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: { symbol: coin.toUpperCase() },
      headers: { 'X-CMC_PRO_API_KEY': apiKey },
    });

    const coinData = response.data.data[coin.toUpperCase()];
    if (!coinData || !coinData.quote || !coinData.quote.USD) {
      return res.status(404).json({ success: false, message: `Price data not found for ${coin}` });
    }

    const price = coinData.quote.USD.price;
    res.status(200).json({ success: true, price });
  } catch (err) {
    console.error('Error fetching cryptocurrency price:', err.message);
    const statusCode = err.response ? err.response.status : 500;
    const message = statusCode === 500
      ? 'Failed to fetch cryptocurrency price due to an internal server error.'
      : `Failed to fetch cryptocurrency price: ${err.response.data.status.error_message}`;
    res.status(statusCode).json({ success: false, message });
  }
});


// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
        }

        return res.status(200).json({ success: true, message: "Login successful." });

    } catch (err) {
        console.error("Error during admin login:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
});



  
  
// Admin Route to Fetch All Users
app.get('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field from the response

    // Map through users and include idProofImage as a Base64-encoded string
    const userData = users.map((user) => {
      const userObj = user.toObject(); // Convert Mongoose Document to plain object
      return {
        ...userObj,
        idProofImage: user.idProofImage
          ? `data:image/jpeg;base64,${Buffer.from(user.idProofImage).toString('base64')}` // Encode image
          : null,
      };
    });
  


    // Send success response with user data
    res.status(200).json({ success: true, users: userData });
  } catch (err) {
    console.error('Error fetching users:', err);
    // Send error response
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Check if user exists route
app.post('/check-user-exists', async (req, res) => {
  const { email, contactNumber, idProofNumber } = req.body;

  if (!email && !contactNumber && !idProofNumber) {
    return res.status(400).json({ 
      success: false, 
      message: 'At least one parameter (email, contactNumber, or idProofNumber) is required' 
    });
  }

  try {
    let existingUser = null;
    let message = '';

    // Check email if provided
    if (email) {
      existingUser = await User.findOne({ email });
      if (existingUser) {
        message = 'Email address already exists. Please use a different email.';
      }
    }

    // Check contact number if provided and no user found yet
    if (!existingUser && contactNumber) {
      existingUser = await User.findOne({ contactNumber });
      if (existingUser) {
        message = 'Contact number already exists. Please use a different contact number.';
      }
    }

    // Check ID proof number if provided and no user found yet
    if (!existingUser && idProofNumber) {
      existingUser = await User.findOne({ idProofNumber });
      if (existingUser) {
        message = 'ID proof number already exists. Please verify your information.';
      }
    }

    // Return the result
    return res.status(existingUser ? 200 : 200).json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? message : 'User information is available for registration'
    });
  } catch (err) {
    console.error('Error checking existing user:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Handle Undefined Routes
app.use((req, res) => {
    res.status(404).send('Route not found');
});

// Start the Server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
