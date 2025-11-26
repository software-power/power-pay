# Power-Pay - Payment Gateway System

**Power computer payment gateway that handles multi-MNO integration**

A comprehensive payment gateway system built with Node.js/Express that handles payment integration with multiple Mobile Network Operators (MNOs) including Stanbic Bank and Selcom.

## Features

- ✅ Multi-MNO support (Stanbic Bank and Selcom)
- ✅ Payment verification and processing
- ✅ Transaction status tracking
- ✅ MySQL database for transaction storage
- ✅ Comprehensive logging with Winston
- ✅ Rate limiting for API protection
- ✅ Request validation with Joi
- ✅ Secure checksum generation and validation
- ✅ RESTful API architecture
- ✅ Transaction history retrieval

## System Architecture

```
┌─────────────────┐
│  Client Systems │ (Inventory, Hospital, etc.)
│  (API Requests) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Payment Gateway│
│   (Node.js)     │
│  - Verification │
│  - Processing   │
│  - Tracking     │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ Stanbic │ │  Selcom  │
│  Bank   │ │   API    │
└─────────┘ └──────────┘
     │           │
     └─────┬─────┘
           ▼
    ┌────────────┐
    │   MySQL    │
    │  Database  │
    └────────────┘
```

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd power-pay
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=payment_gateway

# Stanbic Bank Configuration
STANBIC_API_URL=https://abc-schools.co.tz/api/v1
STANBIC_INSTITUTION_ID=BILLER001
STANBIC_PREFIX=ABC
STANBIC_TOKEN=your_stanbic_token

# Selcom Configuration
SELCOM_API_URL=https://apigw.selcommobile.com
SELCOM_API_KEY=your_selcom_api_key
SELCOM_API_SECRET=your_selcom_api_secret
SELCOM_VENDOR_ID=your_vendor_id
SELCOM_VENDOR_PIN=your_vendor_pin
```

4. **Create database**
```bash
mysql -u root -p
CREATE DATABASE power_pay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

5. **Run database migrations**
```bash
npm run migrate
```

6. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### 1. Verify Payment (Biller Verification)

Verify bill information before processing payment.

**Endpoint:** `POST /api/payments/verify`

**Request Body:**
```json
{
  "reference": "ABC123456",
  "mno_provider": "STANBIC",
  "client_system": "INVENTORY_SYSTEM",
  "client_reference": "INV-2024-001",
  "utility_code": "GEPG"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "TXN-uuid",
  "reference": "ABC123456",
  "mno_provider": "STANBIC",
  "message": "Verification successful",
  "data": {
    "reference": "ABC123456",
    "amount": 25000,
    "payerName": "John Doe",
    "currency": "TZS",
    "paymentDesc": "Utility Bill Payment"
  }
}
```

### 2. Process Payment

Process payment transaction to MNO.

**Endpoint:** `POST /api/payments/process`

**Request Body:**
```json
{
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
  "amount_type": "FULL"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "TXN-uuid",
  "reference": "ABC123456",
  "amount": 25000,
  "mno_provider": "STANBIC",
  "message": "Payment processed successfully",
  "receipt": "3f2a9d5e-7c7b-4e44-8125-6a91c4415a5f",
  "receipt_date": "2025-08-19T13:25:45.123"
}
```

### 3. Query Transaction Status

Check the status of a transaction.

**Endpoint:** `GET /api/payments/status/:transaction_id`

**Response:**
```json
{
  "success": true,
  "transaction_id": "TXN-uuid",
  "reference": "ABC123456",
  "mno_provider": "STANBIC",
  "status": "SUCCESS",
  "amount": 25000,
  "receipt": "3f2a9d5e-7c7b-4e44-8125-6a91c4415a5f",
  "created_at": "2025-08-19T13:20:00.000Z",
  "updated_at": "2025-08-19T13:25:45.000Z"
}
```

### 4. Get Transaction History

Retrieve transaction history for a client system.

**Endpoint:** `GET /api/payments/history/:client_system?limit=100&offset=0`

**Response:**
```json
{
  "success": true,
  "client_system": "HOSPITAL_SYSTEM",
  "count": 50,
  "transactions": [
    {
      "transaction_id": "TXN-uuid",
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

### 5. Get Selcom Balance

Check Selcom float account balance.

**Endpoint:** `GET /api/payments/selcom/balance`

**Response:**
```json
{
  "success": true,
  "balance": "1000000",
  "message": "Balance successful"
}
```

### 6. Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Payment Gateway is running",
  "timestamp": "2025-08-19T13:20:00.000Z"
}
```

## MNO-Specific Configuration

### Stanbic Bank Integration

The system generates checksums for Stanbic Bank API calls:
- Checksum = sha256(token + md5(reference))
- All requests include: reference, institutionId, checksum, token

**Error Codes:**
- 200: Successful
- 201: Invalid token
- 202: Invalid checksum
- 203: Invalid payment reference
- 204: Payment reference expired
- 205: Duplicate transaction
- 206: Already paid (verification)
- 207: Already paid (posting)

### Selcom Integration

The system generates HMAC SHA256 signatures for Selcom API:
- Uses timestamp, signed fields, and API secret
- Supports utility payments, wallet cashin, balance queries

**Result Codes:**
- 000: SUCCESS
- 111, 927: INPROGRESS
- 999: AMBIGUOUS
- Others: FAILED

## Database Schema

### Transactions Table
```sql
- id: INT (Primary Key)
- transaction_id: VARCHAR(100) (Unique)
- reference: VARCHAR(100)
- mno_provider: ENUM('STANBIC', 'SELCOM')
- transaction_type: ENUM('VERIFICATION', 'PAYMENT')
- client_system: VARCHAR(100)
- amount: DECIMAL(15, 2)
- currency: VARCHAR(3)
- payer_name: VARCHAR(255)
- payer_phone: VARCHAR(20)
- payer_email: VARCHAR(255)
- status: ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'TIMEOUT')
- receipt_number: VARCHAR(100)
- mno_request: JSON
- mno_response: JSON
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### MNO Configurations Table
```sql
- id: INT (Primary Key)
- mno_provider: VARCHAR(50)
- api_url: VARCHAR(255)
- api_key: VARCHAR(255)
- api_secret: VARCHAR(255)
- institution_id: VARCHAR(100)
- is_active: BOOLEAN
- config_data: JSON
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Security Features

1. **Rate Limiting**: Prevents API abuse
   - General: 100 requests per 15 minutes
   - Payments: 50 requests per 15 minutes
   - Queries: 200 requests per 15 minutes

2. **Checksum Validation**: Ensures request integrity
3. **Helmet.js**: Adds security headers
4. **CORS**: Configurable cross-origin policies
5. **Request Validation**: Joi schema validation

## Logging

The system uses Winston for logging:
- **Development**: Console output with colors
- **Production**: File-based logging
  - `logs/error.log`: Error-level logs
  - `logs/combined.log`: All logs

## Error Handling

All API responses follow a consistent format:
```json
{
  "success": boolean,
  "message": string,
  "error": string (optional),
  "data": object (optional)
}
```

## Testing

Example using cURL:

**Verify Payment:**
```bash
curl -X POST http://localhost:3000/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ABC123456",
    "mno_provider": "STANBIC",
    "client_system": "TEST_SYSTEM"
  }'
```

**Process Payment:**
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ABC123456",
    "amount": 25000,
    "mno_provider": "STANBIC",
    "client_system": "TEST_SYSTEM",
    "payer_name": "John Doe",
    "payer_phone": "+255712345678"
  }'
```

## Project Structure

```
power-pay/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   └── PaymentController.js # Payment business logic
│   ├── database/
│   │   └── migrations/          # Database migrations
│   ├── middleware/
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   └── Transaction.js       # Transaction model
│   ├── routes/
│   │   └── payments.js          # API routes
│   ├── services/
│   │   ├── StanbicService.js    # Stanbic Bank integration
│   │   └── SelcomService.js     # Selcom integration
│   ├── utils/
│   │   ├── checksum.js          # Checksum utilities
│   │   └── logger.js            # Winston logger
│   ├── app.js                   # Express app
│   └── server.js                # Server entry point
├── logs/                        # Log files
├── .env.example                 # Environment template
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## Extending the System

### Adding a New MNO

1. Create a new service file in `src/services/`
2. Implement verification and payment methods
3. Add MNO configuration in `.env`
4. Update `PaymentController.js` to route to new MNO
5. Update validation schemas if needed

### Adding Custom Client Authentication

1. Create authentication middleware in `src/middleware/`
2. Add API key management in database
3. Apply middleware to routes

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"
```

### Port Already in Use
```bash
# Change PORT in .env file or kill process
lsof -ti:3000 | xargs kill -9
```

### MNO API Errors
- Check API credentials in `.env`
- Verify network connectivity
- Review logs in `logs/` directory

## Support

For issues and questions:
- Check logs in `logs/` directory
- Review API documentation
- Contact MNO support for integration issues

## License

MIT License

## Version

1.0.0-alpha
