// Simple client-side database using localStorage
const Database = {
    // Initialize database with default values if not already set
    init: function() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('transactions')) {
            localStorage.setItem('transactions', JSON.stringify([]));
        }
        if (!localStorage.getItem('wallets')) {
            localStorage.setItem('wallets', JSON.stringify({}));
        }
    },
    
    // User methods
    users: {
        getAll: function() {
            return JSON.parse(localStorage.getItem('users') || '[]');
        },
        
        add: function(user) {
            const users = this.getAll();
            user.id = Date.now().toString();
            user.createdAt = new Date().toISOString();
            user.status = user.status || 'Pending';
            users.push(user);
            localStorage.setItem('users', JSON.stringify(users));
            return user;
        },
        
        update: function(userId, updatedData) {
            const users = this.getAll();
            const index = users.findIndex(user => user.id === userId);
            if (index !== -1) {
                users[index] = { ...users[index], ...updatedData };
                localStorage.setItem('users', JSON.stringify(users));
                return users[index];
            }
            return null;
        },
        
        delete: function(userId) {
            const users = this.getAll();
            const filteredUsers = users.filter(user => user.id !== userId);
            localStorage.setItem('users', JSON.stringify(filteredUsers));
            return filteredUsers.length < users.length;
        },
        
        getById: function(userId) {
            const users = this.getAll();
            return users.find(user => user.id === userId) || null;
        }
    },
    
    // Transaction methods
    transactions: {
        getAll: function() {
            return JSON.parse(localStorage.getItem('transactions') || '[]');
        },
        
        add: function(transaction) {
            const transactions = this.getAll();
            
            // Generate transaction ID if not present
            transaction.id = transaction.id || 'TX' + Date.now().toString();
            
            // Set creation date if not present
            transaction.createdAt = transaction.createdAt || new Date().toISOString();
            
            // Set default status if not present
            transaction.status = transaction.status || 'Completed';
            
            // Use 'user123' as default userId if not present
            transaction.userId = transaction.userId || 'user123';
            
            transactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            
            // Update wallet balance
            this.updateWalletBalance(transaction);
            
            return transaction;
        },
        
        getByUserId: function(userId) {
            if (!userId) return [];
            
            const transactions = this.getAll();
            return transactions.filter(tx => tx.userId === userId);
        },
        
        updateWalletBalance: function(transaction) {
            const wallets = JSON.parse(localStorage.getItem('wallets') || '{}');
            const userId = transaction.userId || 'user123';
            
            if (!wallets[userId]) {
                wallets[userId] = {};
            }
            
            // Extract coin name (e.g., "Bitcoin" from "Bitcoin (BTC)")
            let coin = transaction.cryptocurrency;
            if (coin && coin.includes(' (')) {
                coin = coin.split(' (')[0];
            }
            
            if (!coin && transaction.coin) {
                coin = transaction.coin; // For compatibility with different formats
            }
            
            if (!wallets[userId][coin]) {
                wallets[userId][coin] = {
                    quantity: 0,
                    totalInvested: 0
                };
            }
            
            const wallet = wallets[userId][coin];
            
            // Extract amount (e.g., "0.025" from "0.025 BTC")
            let amount = 0;
            if (typeof transaction.amount === 'string' && transaction.amount.includes(' ')) {
                amount = parseFloat(transaction.amount.split(' ')[0]);
            } else if (typeof transaction.amount === 'string') {
                amount = parseFloat(transaction.amount);
            } else if (transaction.quantity) {
                amount = parseFloat(transaction.quantity);
            }
            
            // Extract price from string (e.g., "$1,081.42" to 1081.42)
            let price = 0;
            if (typeof transaction.price === 'string') {
                price = parseFloat(transaction.price.replace(/[$,]/g, ''));
            } else if (transaction.totalPrice) {
                price = parseFloat(transaction.totalPrice);
            }
            
            if (transaction.type === 'Buy') {
                wallet.quantity += amount;
                wallet.totalInvested += price;
            } else if (transaction.type === 'Sell') {
                wallet.quantity -= amount;
                wallet.totalInvested -= price;
            }
            
            // Ensure we don't have negative quantities
            if (wallet.quantity < 0) wallet.quantity = 0;
            if (wallet.totalInvested < 0) wallet.totalInvested = 0;
            
            localStorage.setItem('wallets', JSON.stringify(wallets));
        }
    },
    
    // Wallet methods
    wallets: {
        getUserWallet: function(userId) {
            if (!userId) return {};
            
            const wallets = JSON.parse(localStorage.getItem('wallets') || '{}');
            return wallets[userId] || {};
        },
        
        getTotalBalance: function(userId) {
            if (!userId) return 0;
            
            const wallet = this.getUserWallet(userId);
            let totalBalance = 0;
            
            for (const coin in wallet) {
                if (wallet[coin].totalInvested) {
                    totalBalance += wallet[coin].totalInvested;
                }
            }
            
            return totalBalance;
        },
        
        getFormattedWallet: function(userId) {
            if (!userId) return [];
            
            const wallet = this.getUserWallet(userId);
            const formattedWallet = [];
            
            // Coin icons mapping
            const coinIcons = {
                'Bitcoin': 'fab fa-bitcoin',
                'Ethereum': 'fab fa-ethereum',
                'Dogecoin': 'fas fa-dog',
                'Solana': 'fas fa-sun',
                'Ripple': 'fas fa-water',
                'Cardano': 'fas fa-globe',
                'Polkadot': 'fas fa-dot-circle',
                'Litecoin': 'fas fa-litecoin-sign'
            };
            
            for (const coin in wallet) {
                // Only include coins with positive quantity
                if (wallet[coin].quantity > 0) {
                    // Get current price for calculation (using a more realistic approach)
                    const basePrice = {
                        'Bitcoin': 50000,
                        'Ethereum': 3000,
                        'Dogecoin': 0.25,
                        'Ripple': 1.2,
                        'Cardano': 2.5,
                        'Solana': 150,
                        'Polkadot': 30,
                        'Litecoin': 180
                    }[coin] || 100;
                    
                    // Add some small variance (±2%)
                    const variance = basePrice * 0.02;
                    const currentPrice = basePrice + (Math.random() * variance * 2 - variance);
                    
                    // Calculate actual change based on purchase price and current price
                    const purchasePrice = wallet[coin].totalInvested / wallet[coin].quantity;
                    const totalValue = wallet[coin].quantity * currentPrice;
                    const percentChange = ((currentPrice - purchasePrice) / purchasePrice) * 100;
                    const isPositive = percentChange >= 0;
                    
                    formattedWallet.push({
                        coin: coin,
                        icon: coinIcons[coin] || 'fas fa-coins',
                        quantity: wallet[coin].quantity.toFixed(5),
                        totalPrice: totalValue.toFixed(2),
                        // Format change with + or - sign based on actual calculation
                        change: `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`,
                        changeClass: isPositive ? 'text-success' : 'text-danger'
                    });
                }
            }
            
            return formattedWallet;
        }
    },
    
    // Admin methods
    admin: {
        validateCredentials: function(email, password) {
            // For demo purposes, hardcoded admin credentials
            const adminEmail = "admin@cryptopro.com";
            const adminPassword = "admin123";
            
            if (email === adminEmail && password === adminPassword) {
                return { success: true, token: "admin-token-" + Date.now() };
            } else if (email === adminEmail) {
                return { success: false, message: "Incorrect password" };
            } else {
                return { success: false, message: "User not found" };
            }
        }
    }
};

// Initialize database on script load
Database.init();
