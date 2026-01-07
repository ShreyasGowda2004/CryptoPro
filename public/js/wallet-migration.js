/**
 * CryptoPro Wallet Migration Utility
 * This file handles the migration of wallet data from localStorage to server-side storage
 */

// Use a function to get API base URL instead of declaring a global variable
function getApiBaseUrl() {
    return window.CorsHelper?.API_BASE_URL || 'https://cryptopro.onrender.com';
}

/**
 * Migrates the user's wallet data from localStorage to the server
 * @returns {Promise<boolean>} True if migration was successful, false otherwise
 */
async function migrateWalletDataToServer() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Authentication token not found. User must be logged in to migrate wallet data.');
        return false;
    }

    try {
        // Show migration status to user
        const migrationStatus = document.createElement('div');
        migrationStatus.className = 'migration-status';
        migrationStatus.innerHTML = `
            <div class="migration-overlay"></div>
            <div class="migration-modal">
                <h3><i class="fas fa-sync-alt fa-spin me-2"></i>Migrating Wallet Data</h3>
                <p>Please wait while we migrate your wallet data to our servers...</p>
                <div class="progress mb-3">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                </div>
                <p id="migration-message">Preparing migration...</p>
            </div>
        `;
        document.body.appendChild(migrationStatus);

        // Update progress
        const progressBar = migrationStatus.querySelector('.progress-bar');
        const message = migrationStatus.querySelector('#migration-message');
        progressBar.style.width = '10%';
        message.textContent = 'Reading wallet data...';

        // Get wallet data from localStorage
        const userData = JSON.parse(localStorage.getItem('cryptoPro_users')) || {};
        const userEmail = JSON.parse(atob(token.split('.')[1])).email;
        const userId = Object.keys(userData).find(id => userData[id].email === userEmail);
        
        if (!userId) {
            message.textContent = 'No user data found.';
            setTimeout(() => document.body.removeChild(migrationStatus), 2000);
            return false;
        }

        // Get wallet and transactions
        progressBar.style.width = '30%';
        message.textContent = 'Extracting wallet data...';
        
        const walletsData = JSON.parse(localStorage.getItem('cryptoPro_wallets')) || {};
        const transactionsData = JSON.parse(localStorage.getItem('cryptoPro_transactions')) || {};
        
        const userWallet = walletsData[userId] || {};
        const userTransactions = Object.values(transactionsData)
            .filter(tx => tx.userId === userId);

        if (Object.keys(userWallet).length === 0 && userTransactions.length === 0) {
            progressBar.style.width = '100%';
            message.textContent = 'No wallet data to migrate. Your account is ready to use!';
            setTimeout(() => document.body.removeChild(migrationStatus), 2000);
            return true;
        }

        // Prepare data for sending to server
        progressBar.style.width = '50%';
        message.textContent = 'Preparing data for server...';
        
        const migrationData = {
            wallet: userWallet,
            transactions: userTransactions
        };

        // Send data to server
        progressBar.style.width = '70%';
        message.textContent = 'Sending data to server...';
        
        const response = await fetch(`${getApiBaseUrl()}/migrate-wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(migrationData)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to migrate wallet data');
        }

        // Migration successful
        progressBar.style.width = '100%';
        message.textContent = 'Migration successful! Your wallet data is now available on all devices.';
        
        // Clear local storage wallet data after successful migration
        // Don't clear users data as it's needed for other functionality
        localStorage.removeItem('cryptoPro_wallets');
        localStorage.removeItem('cryptoPro_transactions');
        
        // Remove migration status after a delay
        setTimeout(() => document.body.removeChild(migrationStatus), 3000);
        return true;
    } catch (error) {
        console.error('Error during wallet migration:', error);
        const migrationStatus = document.querySelector('.migration-status');
        if (migrationStatus) {
            const message = migrationStatus.querySelector('#migration-message');
            message.textContent = `Migration failed: ${error.message}. Please try again later.`;
            message.style.color = 'red';
            
            // Remove migration status after a delay
            setTimeout(() => document.body.removeChild(migrationStatus), 5000);
        }
        return false;
    }
}

/**
 * Check if the user needs to migrate wallet data
 * @returns {Promise<boolean>} True if migration is needed
 */
async function checkIfMigrationNeeded() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Check if we have wallet data in localStorage
    const walletsData = JSON.parse(localStorage.getItem('cryptoPro_wallets')) || {};
    const transactionsData = JSON.parse(localStorage.getItem('cryptoPro_transactions')) || {};
    
    const userEmail = JSON.parse(atob(token.split('.')[1])).email;
    const userData = JSON.parse(localStorage.getItem('cryptoPro_users')) || {};
    const userId = Object.keys(userData).find(id => userData[id].email === userEmail);
    
    if (!userId) return false;
    
    const userWallet = walletsData[userId] || {};
    const userTransactions = Object.values(transactionsData)
        .filter(tx => tx.userId === userId);
    
    // If we have data in localStorage, check if it's been migrated
    if (Object.keys(userWallet).length > 0 || userTransactions.length > 0) {
        try {
            // Check if the server already has wallet data for this user
            const response = await fetch(`${getApiBaseUrl()}/check-migration`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                // If the server responds that no migration is needed, or data already migrated
                return !result.migrated;
            }
            
            // If we can't check with the server, assume migration is needed
            return true;
        } catch (error) {
            console.error('Error checking migration status:', error);
            // If we can't check with the server, assume migration is needed
            return true;
        }
    }
    
    // No localStorage data to migrate
    return false;
}

/**
 * Initialize migration check on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Skip login and registration pages for migration check
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === 'index.html') {
        return;
    }
    
    if (await checkIfMigrationNeeded()) {
        // Show migration prompt
        const migrationPrompt = document.createElement('div');
        migrationPrompt.className = 'migration-prompt';
        migrationPrompt.innerHTML = `
            <div class="migration-overlay"></div>
            <div class="migration-modal">
                <h3><i class="fas fa-cloud-upload-alt me-2"></i>Wallet Migration Required</h3>
                <p>We've upgraded CryptoPro with cross-device wallet synchronization!</p>
                <p>To continue using the app, please migrate your existing wallet data to our secure servers.</p>
                <div class="d-grid gap-2">
                    <button id="migrate-now-btn" class="btn btn-primary">
                        <i class="fas fa-sync-alt me-2"></i>Migrate Now
                    </button>
                    <button id="migrate-later-btn" class="btn btn-outline-secondary">
                        <i class="fas fa-clock me-2"></i>Remind Me Later
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(migrationPrompt);
        
        // Add event listeners
        document.getElementById('migrate-now-btn').addEventListener('click', async () => {
            document.body.removeChild(migrationPrompt);
            await migrateWalletDataToServer();
        });
        
        document.getElementById('migrate-later-btn').addEventListener('click', () => {
            document.body.removeChild(migrationPrompt);
            // Set a reminder for later
            localStorage.setItem('migration_reminder', Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
        });
    }
    
    // Check for migration reminder
    const migrationReminder = localStorage.getItem('migration_reminder');
    if (migrationReminder && parseInt(migrationReminder) < Date.now()) {
        localStorage.removeItem('migration_reminder');
        
        // Check if migration is still needed
        if (await checkIfMigrationNeeded()) {
            // Show reminder again
            const reminderBtn = document.createElement('button');
            reminderBtn.className = 'btn btn-warning position-fixed bottom-0 end-0 m-3';
            reminderBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Migrate Wallet Data';
            reminderBtn.addEventListener('click', async () => {
                reminderBtn.remove();
                await migrateWalletDataToServer();
            });
            document.body.appendChild(reminderBtn);
        }
    }
}); 