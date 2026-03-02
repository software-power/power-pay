# Power-Pay v2.1 - MNO Integration Enhancements

## 🆕 What's New

Power-Pay v2.1 adds three key features for flexible MNO integration:

1. **Bypass MNO Option** - Save payment in database WITHOUT sending to MNO
2. **Database Lookup** - MNO can verify transactions using reference number only
3. **Payment Callback** - MNO updates payment status after customer pays

---

## 📋 New Features

### 1. Bypass MNO Posting (Save Without Sending)

**Endpoint:** `POST /api/payments/process`

**Purpose:** Create payment record in Power-Pay database WITHOUT sending request to MNO. Stanbic Bank prefers this - they don't want initial API calls.

**How it works:**
- Client sends payment with `bypass_mno: true`
- Power-Pay saves transaction (status: PENDING)
- **NO request sent to MNO**
- Wait for MNO callback after customer pays

**Request:**
```json
{
  "reference": "ABC123456",
  "amount": 50000,
  "mno_provider": "STANBIC",
  "client_system": "HOSPITAL",
  "payer_name": "John Doe",
  "payer_phone": "+255712345678",
  "payment_desc": "Hospital Bill",
  
  "bypass_mno": true  // ← This skips MNO posting
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "TXN-uuid-here",
  "reference": "ABC123456",
  "amount": 50000,
  "mno_provider": "STANBIC",
  "message": "Payment record created. MNO posting bypassed.",
  "status": "PENDING",
  "note": "Transaction saved in database. No request sent to MNO. Waiting for callback update.",
  "data": {
    "transaction_id": "TXN-uuid-here",
    "reference": "ABC123456",
    "amount": 50000,
    "currency": "TZS",
    "payer_name": "John Doe",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

**Usage:**
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ABC123456",
    "amount": 50000,
    "mno_provider": "STANBIC",
    "client_system": "HOSPITAL",
    "payer_name": "John Doe",
    "bypass_mno": true
  }'
```

**Normal Flow (bypass_mno: false or omitted):**
```json
{
  "reference": "ABC123456",
  "amount": 50000,
  "mno_provider": "STANBIC",
  "payer_name": "John Doe"
  // No bypass_mno field = normal flow, sends to MNO
}
```

---

### 2. Lookup Transaction (Reference Only)

**Endpoint:** `GET /api/payments/lookup?reference=xxx`

**Purpose:** MNO can verify transaction exists in Power-Pay using ONLY the reference number

**Query Parameter:**
- `reference` - Payment reference number (required)

**Example:**
```bash
GET /api/payments/lookup?reference=ABC123456
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction found",
  "data": {
    "transaction_id": "TXN-uuid-here",
    "reference": "ABC123456",
    "amount": 50000,
    "currency": "TZS",
    "payer_name": "John Doe",
    "payer_phone": "+255712345678",
    "payment_desc": "Hospital Bill",
    "status": "PENDING",
    "mno_provider": "STANBIC",
    "client_system": "HOSPITAL",
    "receipt_number": null,
    "payment_date": null,
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Transaction not found in Power-Pay database",
  "reference": "ABC123456"
}
```

**Usage by MNO:**
```bash
# MNO verifies payment exists before processing
curl "http://localhost:3000/api/payments/lookup?reference=ABC123456"
```

---

### 3. Payment Callback (MNO Updates Power-Pay)

**Endpoint:** `POST /api/payments/callback`

**Purpose:** MNO sends confirmation after customer completes payment

**Request Body:**
```json
{
  "reference": "ABC123456",
  "amount": 50000,
  "receipt_number": "RCP-2024-001",
  "status": "SUCCESS",
  "payment_date": "2024-01-20T11:00:00Z",
  "payer_name": "John Doe",
  "payer_phone": "+255712345678",
  "mno_provider": "STANBIC",
  "checksum": "optional-hash",
  "callback_data": {
    "additional": "data from MNO"
  }
}
```

**Fields:**
- `reference` - Payment reference (required, used to find transaction)
- `receipt_number` - MNO receipt/confirmation number
- `status` - Payment status: `SUCCESS`, `FAILED`, or `PENDING`
- `payment_date` - When customer paid
- `checksum` - Optional security hash

**Response:**
```json
{
  "success": true,
  "message": "Payment callback processed successfully",
  "transaction_id": "TXN-uuid-here",
  "reference": "ABC123456",
  "status": "SUCCESS"
}
```

**MNO Integration Example:**
```javascript
// After customer pays, MNO sends callback
const axios = require('axios');

async function notifyPowerPay(paymentData) {
  await axios.post('https://power-pay.com/api/payments/callback', {
    reference: paymentData.reference,
    amount: paymentData.amount,
    receipt_number: paymentData.receiptNumber,
    status: 'SUCCESS',
    payment_date: new Date().toISOString(),
    payer_name: paymentData.payerName,
    mno_provider: 'STANBIC'
  });
}
```

---

## 🔄 Complete Workflows

### Workflow 1: Bypass MNO (Stanbic Preference)

```
┌─────────┐                  ┌───────────┐                 ┌──────────┐
│ Client  │                  │ Power-Pay │                 │ Stanbic  │
└────┬────┘                  └─────┬─────┘                 └────┬─────┘
     │                              │                            │
     │ POST /process                │                            │
     │ bypass_mno: true             │                            │
     ├─────────────────────────────>│                            │
     │                              │                            │
     │                              │ Save in DB                 │
     │                              │ status: PENDING            │
     │                              │ (NO call to MNO)           │
     │                              │                            │
     │<─────────────────────────────┤                            │
     │ 200 OK: PENDING              │                            │
     │                              │                            │
     │                              │                            │
     │ ... Customer pays via Stanbic Bank ...                    │
     │                              │                            │
     │                              │<───────────────────────────┤
     │                              │ POST /callback             │
     │                              │ receipt: RCP-001           │
     │                              │ status: SUCCESS            │
     │                              │                            │
     │                              │ Update DB                  │
     │                              │ status: SUCCESS            │
     │                              │                            │
     │                              ├───────────────────────────>│
     │                              │ 200 OK                     │
     │                              │                            │
     │ GET /status/:txn_id          │                            │
     ├─────────────────────────────>│                            │
     │<─────────────────────────────┤                            │
     │ SUCCESS + receipt            │                            │
     │                              │                            │
```

**Key Points:**
- ✅ Client sets `bypass_mno: true`
- ✅ Power-Pay saves transaction
- ✅ **NO call to Stanbic**
- ✅ Stanbic sends callback after payment
- ✅ Power-Pay updates status

### Workflow 2: MNO Lookup Before Processing

```
┌──────────┐                  ┌───────────┐
│ Stanbic  │                  │ Power-Pay │
└────┬─────┘                  └─────┬─────┘
     │                              │
     │ GET /lookup?reference=ABC... │
     ├─────────────────────────────>│
     │                              │
     │                              │ Search DB
     │                              │ by reference
     │                              │
     │<─────────────────────────────┤
     │ 200 OK: Transaction details  │
     │ amount, payer, status        │
     │                              │
     │ Verify amount matches        │
     │ Process customer payment     │
     │                              │
     │ POST /callback               │
     │ status: SUCCESS              │
     ├─────────────────────────────>│
     │                              │
     │<─────────────────────────────┤
     │ 200 OK                       │
     │                              │
```

### Workflow 3: Normal Flow (No Bypass)

```
Client → Power-Pay: POST /process (no bypass_mno)
Power-Pay → MNO: Send payment request
MNO → Power-Pay: Immediate response or PENDING
If PENDING:
  MNO → Power-Pay: POST /callback (when customer pays)
Client → Power-Pay: GET /status (check result)
```

---

## 📊 Database Changes

### New Column: `control_number`

Migration automatically adds this column:

```sql
ALTER TABLE transactions
ADD COLUMN control_number VARCHAR(100) AFTER reference,
ADD INDEX idx_control_number (control_number);
```

**Run migration:**
```bash
npm run migrate
```

---

## 🧪 Testing

### Test 1: Bypass MNO
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST001",
    "amount": 10000,
    "mno_provider": "STANBIC",
    "client_system": "TEST",
    "payer_name": "Test User",
    "bypass_mno": true
  }'

# Expected: 200 OK, status: PENDING, note about no MNO call
```

### Test 2: Lookup
```bash
curl "http://localhost:3000/api/payments/lookup?reference=TEST001"

# Expected: 200 OK with transaction details
```

### Test 3: Callback
```bash
curl -X POST http://localhost:3000/api/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST001",
    "receipt_number": "RCP-TEST-001",
    "status": "SUCCESS",
    "payment_date": "2024-01-20T12:00:00Z"
  }'

# Expected: 200 OK, transaction updated to SUCCESS
```

### Test 4: Normal Flow (No Bypass)
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST002",
    "amount": 10000,
    "mno_provider": "STANBIC",
    "payer_name": "Test User"
  }'

# Expected: Sends to MNO, gets immediate response
```

---

## 📖 API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/process` | POST | Process payment (add `bypass_mno:true` to skip MNO) |
| `/api/payments/lookup` | GET | Database lookup by reference |
| `/api/payments/callback` | POST | MNO webhook for updates |

---

## 🎯 Key Benefits

### For Stanbic Bank
✅ No initial API call required
✅ Just save in database
✅ Callback updates after payment

### For All MNOs
✅ Can verify transactions by reference
✅ Simple callback endpoint
✅ No complex integrations

### For Clients
✅ Flexible workflow options
✅ Automatic status updates
✅ Simple API

---

**Power-Pay v2.1** - Simple & Flexible MNO Integration 🚀

## 🆕 What's New

Power-Pay v2.1 adds three critical features for better MNO integration:

1. **Direct Post to MNO** - Skip verification step, post payment directly
2. **Database-Only Lookup** - MNO can verify transactions in Power-Pay without external calls
3. **Payment Callback/Webhook** - MNO updates payment status after customer pays

---

## 📋 New Endpoints

### 1. Process Payment with Direct Post

**Endpoint:** `POST /api/payments/process-direct`

**Purpose:** Post payment directly to MNO without verification step (for Stanbic Bank preference)

**Request Body:**
```json
{
  "reference": "ABC123456",
  "control_number": "992001234567",
  "amount": 50000,
  "mno_provider": "STANBIC",
  "client_system": "HOSPITAL_SYSTEM",
  "payer_name": "John Doe",
  "payer_phone": "+255712345678",
  "payer_email": "john@example.com",
  "payment_desc": "Hospital Bill Payment",
  "direct_post": true
}
```

**Key Fields:**
- `control_number` - Payment control number from client (required for direct post)
- `direct_post` - Set to `true` to skip verification

**Response:**
```json
{
  "success": true,
  "transaction_id": "TXN-uuid-here",
  "reference": "ABC123456",
  "control_number": "992001234567",
  "amount": 50000,
  "mno_provider": "STANBIC",
  "message": "Payment posted directly to MNO. Awaiting callback for confirmation.",
  "status": "PENDING",
  "note": "Transaction will be updated via callback from MNO"
}
```

**Usage:**
```bash
curl -X POST http://localhost:3000/api/payments/process-direct \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ABC123456",
    "control_number": "992001234567",
    "amount": 50000,
    "mno_provider": "STANBIC",
    "client_system": "HOSPITAL",
    "payer_name": "John Doe",
    "direct_post": true
  }'
```

---

### 2. Lookup Transaction (Database Only)

**Endpoint:** `GET /api/payments/lookup`

**Purpose:** MNO can verify transaction exists in Power-Pay database without contacting external APIs

**Query Parameters:**
- `transaction_id` - Power-Pay transaction ID (e.g., TXN-uuid)
- `reference` - Payment reference number
- `control_number` - Payment control number

*At least one parameter is required*

**Example Requests:**
```bash
# By transaction ID
GET /api/payments/lookup?transaction_id=TXN-123456-abcd

# By reference
GET /api/payments/lookup?reference=ABC123456

# By control number
GET /api/payments/lookup?control_number=992001234567
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction found",
  "data": {
    "transaction_id": "TXN-uuid-here",
    "reference": "ABC123456",
    "control_number": "992001234567",
    "amount": 50000,
    "currency": "TZS",
    "payer_name": "John Doe",
    "payer_phone": "+255712345678",
    "payer_email": "john@example.com",
    "payment_desc": "Hospital Bill Payment",
    "status": "PENDING",
    "mno_provider": "STANBIC",
    "client_system": "HOSPITAL_SYSTEM",
    "receipt_number": null,
    "payment_date": null,
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

**Error Response (Not Found):**
```json
{
  "success": false,
  "message": "Transaction not found in Power-Pay database"
}
```

**Usage by MNO:**
```bash
# MNO verifies transaction before processing
curl http://localhost:3000/api/payments/lookup?control_number=992001234567
```

---

### 3. Payment Callback (MNO Webhook)

**Endpoint:** `POST /api/payments/callback`

**Purpose:** MNO sends payment confirmation after customer completes payment

**Request Body:**
```json
{
  "transaction_id": "TXN-uuid-here",
  "reference": "ABC123456",
  "control_number": "992001234567",
  "amount": 50000,
  "receipt_number": "RCP-2024-001",
  "status": "SUCCESS",
  "payment_date": "2024-01-20T11:00:00Z",
  "payer_name": "John Doe",
  "payer_phone": "+255712345678",
  "mno_provider": "STANBIC",
  "checksum": "optional-security-hash",
  "callback_data": {
    "additional": "mno specific data"
  }
}
```

**Key Fields:**
- `transaction_id`, `reference`, or `control_number` - At least one required to identify transaction
- `receipt_number` - MNO receipt/confirmation number
- `status` - Payment status: `SUCCESS`, `FAILED`, or `PENDING`
- `payment_date` - When customer completed payment
- `checksum` - Optional security hash for verification

**Response:**
```json
{
  "success": true,
  "message": "Payment callback processed successfully",
  "transaction_id": "TXN-uuid-here",
  "reference": "ABC123456",
  "status": "SUCCESS"
}
```

**MNO Integration:**
```javascript
// MNO sends callback after customer pays
const axios = require('axios');

async function sendPaymentCallback(paymentData) {
  await axios.post('https://power-pay-api.com/api/payments/callback', {
    control_number: paymentData.controlNumber,
    amount: paymentData.amount,
    receipt_number: paymentData.receiptNumber,
    status: 'SUCCESS',
    payment_date: new Date().toISOString(),
    payer_name: paymentData.payerName,
    payer_phone: paymentData.payerPhone,
    mno_provider: 'STANBIC'
  });
}
```

---

## 🔄 Complete Workflow Examples

### Workflow 1: Direct Post (Stanbic Preference)

```
1. Client generates control number
   └─> control_number: "992001234567"

2. Client posts directly to Power-Pay
   POST /api/payments/process-direct
   └─> direct_post: true
   └─> Power-Pay creates transaction (status: PENDING)
   └─> Power-Pay posts to Stanbic
   
3. Stanbic generates bill for customer
   └─> Customer pays via mobile/bank
   
4. Stanbic sends callback to Power-Pay
   POST /api/payments/callback
   └─> receipt_number: "RCP-2024-001"
   └─> status: "SUCCESS"
   
5. Power-Pay updates transaction
   └─> status: SUCCESS
   └─> Client can query status
```

### Workflow 2: MNO Verification (Before Processing)

```
1. MNO receives payment request with control number
   └─> control_number: "992001234567"

2. MNO verifies transaction exists in Power-Pay
   GET /api/payments/lookup?control_number=992001234567
   └─> Returns transaction details
   └─> MNO confirms amount, payer, etc.
   
3. MNO processes payment
   └─> Customer pays
   
4. MNO sends confirmation to Power-Pay
   POST /api/payments/callback
   └─> Power-Pay updates transaction
```

### Workflow 3: Standard Flow (With Verification)

```
1. Client verifies bill exists
   POST /api/payments/verify
   └─> Gets bill details from MNO
   
2. Client processes payment
   POST /api/payments/process
   └─> Power-Pay contacts MNO
   └─> Gets immediate response or PENDING
   
3. If PENDING, wait for callback
   POST /api/payments/callback
   └─> MNO updates status when customer pays
   
4. Client queries status
   GET /api/payments/status/:transaction_id
   └─> Gets current status
```

---

## 📊 Database Changes

### New Column: `control_number`

Added to `transactions` table:

```sql
ALTER TABLE transactions
ADD COLUMN control_number VARCHAR(100) AFTER reference,
ADD INDEX idx_control_number (control_number);
```

**Migration:** Automatically applied via `004_add_control_number.js`

**Run migration:**
```bash
npm run migrate
```

---

## 🔐 Security Considerations

### 1. Callback Authentication

**Option A: IP Whitelist**
```javascript
// In middleware
const allowedIPs = ['41.93.x.x', '196.x.x.x']; // MNO IPs
if (!allowedIPs.includes(req.ip)) {
  return res.status(403).json({ message: 'Forbidden' });
}
```

**Option B: Checksum Validation**
```javascript
// Validate checksum from MNO
const expectedChecksum = generateChecksum(req.body, SECRET_KEY);
if (req.body.checksum !== expectedChecksum) {
  return res.status(401).json({ message: 'Invalid checksum' });
}
```

### 2. Duplicate Prevention

Power-Pay automatically prevents duplicate callbacks:
- Searches by `transaction_id`, `reference`, OR `control_number`
- Updates existing transaction
- Logs all callback attempts

---

## 📝 Configuration

### Environment Variables

No new environment variables required. Existing config works for all new features.

---

## 🧪 Testing

### Test Direct Post
```bash
curl -X POST http://localhost:3000/api/payments/process-direct \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST001",
    "control_number": "992000000001",
    "amount": 1000,
    "mno_provider": "STANBIC",
    "client_system": "TEST",
    "payer_name": "Test User",
    "direct_post": true
  }'
```

### Test Lookup
```bash
curl "http://localhost:3000/api/payments/lookup?control_number=992000000001"
```

### Test Callback
```bash
curl -X POST http://localhost:3000/api/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "control_number": "992000000001",
    "amount": 1000,
    "receipt_number": "TEST-RECEIPT-001",
    "status": "SUCCESS",
    "payment_date": "2024-01-20T12:00:00Z",
    "payer_name": "Test User"
  }'
```

---

## 📖 API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/process-direct` | POST | Post payment directly without verification |
| `/api/payments/lookup` | GET | Database-only transaction lookup for MNO |
| `/api/payments/callback` | POST | MNO webhook for payment confirmation |
| `/api/payments/verify` | POST | Verify payment with MNO (existing) |
| `/api/payments/process` | POST | Process with verification (existing) |
| `/api/payments/status/:id` | GET | Query transaction status (existing) |

---

## 🎯 Benefits

### For Stanbic Bank
✅ Direct posting without verification step
✅ Control number tracking
✅ Callback updates for async payments

### For MNO Providers
✅ Can verify transactions in Power-Pay before processing
✅ Webhook endpoint for payment confirmations
✅ No external API calls for verification

### For Clients
✅ Faster payment processing
✅ Better status tracking
✅ Automatic updates via callbacks

---

## 🆘 Troubleshooting

### Callback Not Received
1. Check MNO has correct webhook URL
2. Verify MNO IP is not blocked
3. Check logs: `tail -f logs/combined.log`
4. Test manually with curl

### Transaction Not Found in Lookup
1. Verify transaction was created
2. Check control_number is correct
3. Query database directly:
```sql
SELECT * FROM transactions WHERE control_number = '992001234567';
```

### Direct Post Fails
1. Verify `direct_post: true` in request
2. Ensure control_number is provided
3. Check MNO API credentials
4. Review error logs

---

## 📦 Update Instructions

### For Existing Installations

```bash
# 1. Pull latest code
cd power-pay
git pull

# 2. Install any new dependencies
npm install

# 3. Run migrations
npm run migrate

# 4. Restart server
npm restart
```

---

**Power-Pay v2.1** - Enhanced MNO Integration
Built for flexibility and reliability 🚀
