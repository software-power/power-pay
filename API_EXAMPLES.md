# Power-Pay Gateway - API Test Requests

**Power computer payment gateway that handles multi-MNO**

## Base URL
```
http://localhost:3000
```

## 1. Health Check

### Request
```bash
curl -X GET http://localhost:3000/health
```

### Expected Response
```json
{
  "success": true,
  "message": "Power-Pay Gateway is running",
  "timestamp": "2025-08-19T13:20:00.000Z"
}
```

---

## 2. Stanbic Bank - Verify Payment

### Request
```bash
curl -X POST http://localhost:3000/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ABC123456",
    "mno_provider": "STANBIC",
    "client_system": "INVENTORY_SYSTEM",
    "client_reference": "INV-2024-001"
  }'
```

### Expected Response
```json
{
  "success": true,
  "transaction_id": "TXN-abc-123",
  "reference": "ABC123456",
  "mno_provider": "STANBIC",
  "message": "Verification successful",
  "data": {
    "reference": "ABC123456",
    "amount": 25000,
    "institutionId": "BILLER001",
    "payerName": "John Doe",
    "accId": "001",
    "amountType": "FULL",
    "currency": "TZS",
    "paymentDesc": "Utility Bill Payment",
    "payerPhone": "+255712345678"
  }
}
```

---

## 3. Stanbic Bank - Process Payment

### Request
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ABC123456",
    "amount": 25000,
    "mno_provider": "STANBIC",
    "client_system": "HOSPITAL_SYSTEM",
    "client_reference": "HOS-2024-001",
    "payer_name": "John Doe",
    "payer_phone": "+255712345678",
    "payer_email": "john@example.com",
    "payment_desc": "Hospital Bill Payment",
    "channel": "API",
    "currency": "TZS",
    "amount_type": "FULL",
    "acc_opt": "001"
  }'
```

### Expected Response
```json
{
  "success": true,
  "transaction_id": "TXN-abc-456",
  "reference": "ABC123456",
  "amount": 25000,
  "mno_provider": "STANBIC",
  "message": "Payment processed successfully",
  "receipt": "3f2a9d5e-7c7b-4e44-8125-6a91c4415a5f",
  "receipt_date": "2025-08-19T13:25:45.123",
  "data": {
    "statusCode": 200,
    "message": "Payment processed successfully",
    "data": {
      "reference": "ABC123456",
      "receipt": "3f2a9d5e-7c7b-4e44-8125-6a91c4415a5f",
      "receiptDate": "2025-08-19T13:25:45.123"
    }
  }
}
```

---

## 4. Selcom - Verify Payment (Utility Lookup)

### Request
```bash
curl -X POST http://localhost:3000/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "991234567891",
    "mno_provider": "SELCOM",
    "client_system": "INVENTORY_SYSTEM",
    "utility_code": "GEPG"
  }'
```

### Expected Response
```json
{
  "success": true,
  "transaction_id": "TXN-sel-123",
  "reference": "991234567891",
  "mno_provider": "SELCOM",
  "message": "DAWASA\nName MNYANGA\nControl# 991234567891\nTZS 5,000",
  "data": [
    {
      "name": "MNYANGA",
      "amount": "5000",
      "institution": "DAWASA",
      "type": "PART",
      "desc": "Bill Charges 2019-2"
    }
  ]
}
```

---

## 5. Selcom - Process Payment (Utility Payment)

### Request
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "991234567891",
    "amount": 5000,
    "mno_provider": "SELCOM",
    "client_system": "HOSPITAL_SYSTEM",
    "utility_code": "GEPG",
    "payer_name": "MNYANGA",
    "payer_phone": "+255712345678",
    "payment_desc": "DAWASA Bill Payment"
  }'
```

### Expected Response
```json
{
  "success": true,
  "transaction_id": "TXN-sel-456",
  "reference": "991234567891",
  "amount": 5000,
  "mno_provider": "SELCOM",
  "message": "Transaction successful",
  "receipt": "F10002",
  "data": {
    "transid": "TXN-sel-456",
    "reference": "0270720833",
    "resultcode": "000",
    "result": "SUCCESS",
    "message": "Airtime recharge\nReference 0270720833\nPhone 0773820XXX\nAmount TZS 5,000\nVendor XYZVENDOR\n\nPowered by Selcom"
  }
}
```

---

## 6. Query Transaction Status

### Request
```bash
curl -X GET "http://localhost:3000/api/payments/status/TXN-abc-456"
```

### Expected Response
```json
{
  "success": true,
  "transaction_id": "TXN-abc-456",
  "reference": "ABC123456",
  "mno_provider": "STANBIC",
  "status": "SUCCESS",
  "amount": 25000,
  "receipt": "3f2a9d5e-7c7b-4e44-8125-6a91c4415a5f",
  "created_at": "2025-08-19T13:20:00.000Z",
  "updated_at": "2025-08-19T13:25:45.000Z"
}
```

---

## 7. Get Transaction History

### Request
```bash
curl -X GET "http://localhost:3000/api/payments/history/HOSPITAL_SYSTEM?limit=10&offset=0"
```

### Expected Response
```json
{
  "success": true,
  "client_system": "HOSPITAL_SYSTEM",
  "count": 10,
  "transactions": [
    {
      "transaction_id": "TXN-abc-456",
      "reference": "ABC123456",
      "mno_provider": "STANBIC",
      "transaction_type": "PAYMENT",
      "amount": 25000,
      "status": "SUCCESS",
      "receipt": "3f2a9d5e-7c7b-4e44-8125-6a91c4415a5f",
      "created_at": "2025-08-19T13:20:00.000Z"
    }
  ]
}
```

---

## 8. Get Selcom Balance

### Request
```bash
curl -X GET http://localhost:3000/api/payments/selcom/balance
```

### Expected Response
```json
{
  "success": true,
  "balance": "1000000",
  "message": "Balance successful"
}
```

---

## Error Response Examples

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "reference",
      "message": "\"reference\" is required"
    },
    {
      "field": "amount",
      "message": "\"amount\" must be a positive number"
    }
  ]
}
```

### 404 Not Found - Transaction Not Found
```json
{
  "success": false,
  "message": "Transaction not found"
}
```

### 429 Too Many Requests - Rate Limit
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## Testing with Postman

1. Import these requests into Postman
2. Set base URL variable: `{{baseUrl}} = http://localhost:3000`
3. Create environment variables for testing:
   - `stanbic_reference`
   - `selcom_reference`
   - `transaction_id`

## Testing with JavaScript/Node.js

```javascript
const axios = require('axios');

const baseURL = 'http://localhost:3000';

// Verify Payment
async function verifyPayment() {
  try {
    const response = await axios.post(`${baseURL}/api/payments/verify`, {
      reference: 'ABC123456',
      mno_provider: 'STANBIC',
      client_system: 'TEST_SYSTEM'
    });
    console.log('Verify Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Process Payment
async function processPayment() {
  try {
    const response = await axios.post(`${baseURL}/api/payments/process`, {
      reference: 'ABC123456',
      amount: 25000,
      mno_provider: 'STANBIC',
      client_system: 'TEST_SYSTEM',
      payer_name: 'John Doe',
      payer_phone: '+255712345678'
    });
    console.log('Payment Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Query Status
async function queryStatus(transactionId) {
  try {
    const response = await axios.get(
      `${baseURL}/api/payments/status/${transactionId}`
    );
    console.log('Status Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run tests
(async () => {
  await verifyPayment();
  const payment = await processPayment();
  if (payment?.transaction_id) {
    await queryStatus(payment.transaction_id);
  }
})();
```
