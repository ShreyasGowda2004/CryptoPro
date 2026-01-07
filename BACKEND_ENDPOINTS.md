# Backend API Endpoints for CryptoPro Wallet Synchronization

This document outlines the required API endpoints for synchronizing wallet data across devices in the CryptoPro platform. These endpoints should be implemented in the backend API at https://cryptopro.onrender.com.

## Required Endpoints

### 1. Buy Transaction
**Endpoint:** `/buy`  
**Method:** POST  
**Authentication:** Required (Bearer Token)  
**Request Body:**
```json
{
  "coin": "Bitcoin",
  "symbol": "BTC",
  "quantity": 0.05,
  "price": 48000,
  "totalPrice": 2400,
  "type": "Buy",
  "date": "2024-05-25T14:30:00.000Z",
  "status": "Completed"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Transaction successful",
  "transaction": {
    "id": "tx123456",
    "userId": "user123",
    "coin": "Bitcoin",
    "symbol": "BTC",
    "quantity": 0.05,
    "price": 48000,
    "totalPrice": 2400,
    "type": "Buy",
    "date": "2024-05-25T14:30:00.000Z",
    "status": "Completed"
  }
}
```

### 2. Sell Transaction
**Endpoint:** `/sell`  
**Method:** POST  
**Authentication:** Required (Bearer Token)  
**Request Body:**
```json
{
  "coin": "Bitcoin",
  "symbol": "BTC",
  "quantity": 0.05,
  "price": 48000,
  "totalPrice": 2400,
  "type": "Sell",
  "date": "2024-05-25T14:30:00.000Z",
  "status": "Completed"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Transaction successful",
  "transaction": {
    "id": "tx123457",
    "userId": "user123",
    "coin": "Bitcoin",
    "symbol": "BTC",
    "quantity": 0.05,
    "price": 48000,
    "totalPrice": 2400,
    "type": "Sell",
    "date": "2024-05-25T14:30:00.000Z",
    "status": "Completed"
  }
}
```

### 3. Get Wallet Data
**Endpoint:** `/wallet`  
**Method:** GET  
**Authentication:** Required (Bearer Token)  
**Response:**
```json
{
  "success": true,
  "walletData": [
    {
      "coin": "Bitcoin",
      "icon": "fab fa-bitcoin",
      "quantity": "0.15000",
      "totalPrice": 7200,
      "change": "+2.5%",
      "changeClass": "text-success"
    },
    {
      "coin": "Ethereum",
      "icon": "fab fa-ethereum",
      "quantity": "1.20000",
      "totalPrice": 3600,
      "change": "-1.2%",
      "changeClass": "text-danger"
    }
  ],
  "totalBalance": 10800
}
```

### 4. Get User Transactions
**Endpoint:** `/transactions`  
**Method:** GET  
**Authentication:** Required (Bearer Token)  
**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "tx123456",
      "userId": "user123",
      "coin": "Bitcoin",
      "symbol": "BTC",
      "quantity": 0.05,
      "price": 48000,
      "totalPrice": 2400,
      "type": "Buy",
      "date": "2024-05-25T14:30:00.000Z",
      "status": "Completed"
    },
    {
      "id": "tx123457",
      "userId": "user123",
      "coin": "Ethereum",
      "symbol": "ETH",
      "quantity": 1.2,
      "price": 3000,
      "totalPrice": 3600,
      "type": "Buy",
      "date": "2024-05-24T10:15:00.000Z",
      "status": "Completed"
    }
  ]
}
```

## Implementation Notes

1. All transactions should be stored in a database tied to the user's account, not local storage.
2. The backend should calculate wallet balances based on the transaction history.
3. The wallet data should update in real-time for all devices using the same account.
4. Error handling should include appropriate status codes and descriptive messages.
5. Authentication should be required for all endpoints to ensure data security.
6. The backend should validate transaction data to prevent invalid transactions (e.g., selling more than available balance).

## Testing

To test these endpoints:

1. Implement the endpoints in the backend API.
2. Test buy and sell transactions from different devices using the same account.
3. Verify that wallet data and transaction history are synchronized across all devices.
4. Check that error handling works correctly for invalid transactions.

## Migration

For migrating existing local storage data to the server:

1. Create a migration endpoint to accept bulk transaction data upload.
2. Add a migration function to the frontend to send existing local storage data to the server.
3. Clear local storage after successful migration to prevent duplication. 