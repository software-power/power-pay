# API Collections Import Guide

## 📦 Available Collections

Power-Pay Gateway includes ready-to-use API collections for both **Postman** and **Insomnia** with comprehensive dummy data for testing.

---

## 🚀 Postman Collection

### Import Instructions

#### Method 1: Import File
1. Open **Postman**
2. Click **Import** button (top left)
3. Click **Upload Files**
4. Select `Power-Pay_Postman_Collection.json`
5. Click **Import**

#### Method 2: Drag & Drop
1. Open **Postman**
2. Drag `Power-Pay_Postman_Collection.json` into Postman window
3. Click **Import**

### What's Included

✅ **50+ Requests** organized in folders:
- **Health & Status** (2 requests)
- **Stanbic Bank** (3 requests)
- **Selcom** (6 requests)
- **Transaction Management** (5 requests)
- **Test Scenarios** (10+ requests)
  - Complete Payment Flow
  - Error Scenarios
  - Bulk Testing

### Environment Setup

The collection includes variables:
- `base_url` - API base URL (default: http://localhost:3000)
- `transaction_id` - Auto-captured from responses

**To configure:**
1. Click **Environments** (left sidebar)
2. Select **Power-Pay Environment**
3. Update `base_url` if needed
4. Save

### Using the Collection

#### 1. Start with Health Check
```
Health & Status → Health Check
```
This verifies your server is running.

#### 2. Try a Complete Flow
```
Test Scenarios → Complete Payment Flow - Hospital
  → 1. Verify Hospital Bill
  → 2. Process Hospital Payment
  → 3. Check Payment Status
```
The `transaction_id` is automatically captured and used!

#### 3. Test Individual MNOs

**Stanbic Bank:**
```
Stanbic Bank → Process Payment - Stanbic
```

**Selcom:**
```
Selcom → Process Payment - Selcom (GEPG)
```

### Auto-Capture Transaction IDs

The collection includes **Test Scripts** that automatically:
- Capture `transaction_id` from responses
- Store it in environment variables
- Use it in subsequent requests

**Example:** After running "Process Payment", you can immediately run "Query Transaction Status" and it will use the correct `transaction_id`.

---

## 🎨 Insomnia Collection

### Import Instructions

#### Method 1: Import from File
1. Open **Insomnia**
2. Click **Create** → **Import From** → **File**
3. Select `Power-Pay_Insomnia_Collection.json`
4. Click **Scan** then **Import**

#### Method 2: Application Menu
1. Open **Insomnia**
2. Go to **Application** menu → **Preferences** → **Data**
3. Click **Import Data** → **From File**
4. Select `Power-Pay_Insomnia_Collection.json`
5. Click **Import**

### What's Included

✅ **50+ Requests** organized in folders:
- **Health & Status**
- **Stanbic Bank**
- **Selcom**
- **Transaction Management**
- **Test Scenarios**
  - Complete Payment Flow
  - Error Scenarios
  - Bulk Testing Data

### Environment Setup

The collection includes 3 environments:
- **Base Environment** - Default settings
- **Development** - Local development (localhost:3000)
- **Production** - Production API URL

**To configure:**
1. Click environment dropdown (top right)
2. Select **Development**
3. Click **Manage Environments**
4. Update `base_url` if needed

### Using the Collection

#### 1. Select Environment
Click the environment dropdown and select **Development**

#### 2. Test Health
```
Health & Status → Health Check
```

#### 3. Run Complete Flow
```
Test Scenarios → Complete Payment Flow - Hospital
  → 1. Verify Hospital Bill
  → 2. Process Hospital Payment
  → 3. Check Payment Status
```

---

## 📋 Dummy Data Reference

### Stanbic Bank Test Data

| Field | Value |
|-------|-------|
| Reference | ABC123456, ABC789012, ABC998877 |
| Amount | 25000 - 150000 TZS |
| Payer Names | John Doe Mwamba, Mary Kamwendo, Sarah Mtamba |
| Phone Numbers | +255712345678, +255787654321, +255732109876 |
| Client Systems | HOSPITAL_SYSTEM, INVENTORY_SYSTEM |

### Selcom Test Data

| Utility Code | Reference | Amount | Description |
|--------------|-----------|--------|-------------|
| GEPG | 991234567891 | 15000 | Government payment |
| LUKU | 43000718765 | 20000 | Electricity tokens |
| DSTV | 01234567891 | 35000 | TV subscription |
| AZAMTV | 012345678912 | 28000 | TV subscription |

### Test Scenarios Included

#### 1. Complete Payment Flow
- Verify bill
- Process payment
- Check status
- All using same reference

#### 2. Error Scenarios
- Missing required fields
- Invalid MNO provider
- Invalid transaction ID
- Negative amounts

#### 3. Bulk Testing
- Multiple hospital payments
- Inventory orders
- Utility payments
- Different client systems

---

## 🧪 Testing Workflow

### Recommended Testing Order

1. **Health Check**
   ```
   Health & Status → Health Check
   ✓ Server is running
   ```

2. **Simple Verification**
   ```
   Stanbic Bank → Verify Payment - Stanbic
   ✓ Bill verification works
   ```

3. **Payment Processing**
   ```
   Stanbic Bank → Process Payment - Stanbic
   ✓ Payment processing works
   ```

4. **Status Query**
   ```
   Transaction Management → Query Transaction Status
   ✓ Status tracking works
   ```

5. **History Retrieval**
   ```
   Transaction Management → Get Transaction History - Hospital
   ✓ History retrieval works
   ```

6. **Complete Flow Test**
   ```
   Test Scenarios → Complete Payment Flow - Hospital
   ✓ End-to-end flow works
   ```

7. **Error Handling**
   ```
   Test Scenarios → Error Scenarios → [Run all]
   ✓ Validation works
   ```

---

## 🔧 Customizing Requests

### Changing Base URL

**Postman:**
1. Click **Environments**
2. Select **Power-Pay Environment**
3. Update `base_url` value
4. Save

**Insomnia:**
1. Click environment dropdown
2. Click **Manage Environments**
3. Update `base_url` in selected environment
4. Save

### Adding Your Own Data

Edit any request body:

**Postman:**
1. Select request
2. Click **Body** tab
3. Modify JSON
4. Click **Send**

**Insomnia:**
1. Select request
2. Modify JSON in body section
3. Click **Send**

### Saving as New Request

**Postman:**
1. Right-click request
2. Select **Duplicate**
3. Rename and modify

**Insomnia:**
1. Right-click request
2. Select **Duplicate**
3. Rename and modify

---

## 📊 Expected Responses

### Success Response (200)
```json
{
  "success": true,
  "transaction_id": "TXN-uuid-here",
  "reference": "ABC123456",
  "amount": 50000,
  "mno_provider": "STANBIC",
  "message": "Payment processed successfully",
  "receipt": "receipt-uuid"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "amount",
      "message": "\"amount\" is required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Transaction not found"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## 💡 Pro Tips

### Postman Tips

1. **Use Collection Runner** for bulk testing
   - Click **Runner** icon
   - Select **Power-Pay Gateway API**
   - Choose folder to run
   - Click **Run**

2. **Generate Code** from requests
   - Click **Code** icon (< >)
   - Select language
   - Copy code

3. **Monitor API** automatically
   - Click **...** on collection
   - Select **Monitor Collection**
   - Schedule runs

### Insomnia Tips

1. **Use Keyboard Shortcuts**
   - `Ctrl/Cmd + Enter` - Send request
   - `Ctrl/Cmd + K` - Quick search
   - `Ctrl/Cmd + E` - Switch environment

2. **Generate Code Snippets**
   - Click **Generate Code**
   - Select language
   - Copy code

3. **Use Request Chaining**
   - Reference responses: `_.transaction_id`
   - Environment variables: `{{ _.base_url }}`

---

## 🆘 Troubleshooting

### Connection Refused
**Problem:** Cannot connect to server
**Solution:**
1. Verify server is running: `npm start`
2. Check `base_url` in environment
3. Verify port 3000 is not blocked

### 404 Not Found
**Problem:** Endpoint not found
**Solution:**
1. Check `base_url` format (no trailing slash)
2. Verify server is running latest code
3. Check endpoint path

### Invalid Credentials
**Problem:** MNO authentication fails
**Solution:**
1. Check `.env` file for correct credentials
2. Verify Stanbic/Selcom keys are valid
3. Check logs: `tail -f logs/error.log`

### Transaction Not Found
**Problem:** Status query returns 404
**Solution:**
1. Use `transaction_id` from payment response
2. Check database: `SELECT * FROM transactions`
3. Verify transaction was created

---

## 📚 Additional Resources

- **API Documentation:** See `README.md`
- **Quick Start:** See `QUICK_START.md`
- **Examples:** See `API_EXAMPLES.md`
- **Logs:** Check `logs/` directory

---

## 🎉 Ready to Test!

You now have:
- ✅ 50+ ready-to-use API requests
- ✅ Realistic dummy data
- ✅ Auto-captured transaction IDs
- ✅ Complete test scenarios
- ✅ Error handling tests
- ✅ Both Postman and Insomnia collections

**Start testing your Power-Pay Gateway now!** 🚀

---

**Power-Pay Gateway v1.0.0**
Complete API Testing Collections
