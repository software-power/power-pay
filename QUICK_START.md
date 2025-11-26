# Quick Start Guide - Power-Pay Gateway

**Power computer payment gateway that handles multi-MNO**

## Prerequisites Checklist
- [ ] Node.js v14+ installed
- [ ] MySQL 5.7+ installed and running
- [ ] npm or yarn installed

## Setup Steps

### 1. Install Dependencies
```bash
cd power-pay
npm install
```

### 2. Setup Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE power_pay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Minimum required settings:**
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=power_pay

# Get these from Stanbic Bank
STANBIC_API_URL=https://abc-schools.co.tz/api/v1
STANBIC_INSTITUTION_ID=BILLER001
STANBIC_TOKEN=your_token_here
STANBIC_PREFIX=ABC

# Get these from Selcom
SELCOM_API_URL=https://apigw.selcommobile.com
SELCOM_API_KEY=your_api_key
SELCOM_API_SECRET=your_api_secret
SELCOM_VENDOR_ID=your_vendor_id
SELCOM_VENDOR_PIN=your_vendor_pin
```

### 4. Run Database Migrations
```bash
npm run migrate
```

You should see:
```
Database connected successfully
Transactions table created successfully
MNO configurations table created successfully
All migrations completed successfully
```

### 5. Start the Server
```bash
# Development mode (auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║              POWER-PAY GATEWAY SERVER                      ║
║   Power computer payment gateway - Multi-MNO Support       ║
║                                                            ║
║  Status:  ✓ Running                                       ║
║  Port:    3000                                             ║
║  Env:     development                                      ║
╚════════════════════════════════════════════════════════════╝
```

### 6. Test the API
```bash
# Test health check
curl http://localhost:3000/health

# Should return:
# {"success":true,"message":"Power-Pay Gateway is running","timestamp":"..."}
```

## First Payment Test

### Step 1: Verify Payment
```bash
curl -X POST http://localhost:3000/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ABC123456",
    "mno_provider": "STANBIC",
    "client_system": "TEST_SYSTEM"
  }'
```

### Step 2: Process Payment
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

### Step 3: Check Status
```bash
# Use the transaction_id from the process payment response
curl http://localhost:3000/api/payments/status/TXN-xxx-xxx
```

## Integration with Your Systems

### Example: Inventory System Integration

```javascript
const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000/api/payments';

async function processInventoryPayment(orderData) {
  try {
    // 1. Verify the bill first
    const verifyResponse = await axios.post(`${GATEWAY_URL}/verify`, {
      reference: orderData.billReference,
      mno_provider: 'STANBIC',
      client_system: 'INVENTORY_SYSTEM',
      client_reference: orderData.orderId
    });

    if (!verifyResponse.data.success) {
      throw new Error('Bill verification failed');
    }

    // 2. Process the payment
    const paymentResponse = await axios.post(`${GATEWAY_URL}/process`, {
      reference: orderData.billReference,
      amount: orderData.amount,
      mno_provider: 'STANBIC',
      client_system: 'INVENTORY_SYSTEM',
      client_reference: orderData.orderId,
      payer_name: orderData.customerName,
      payer_phone: orderData.customerPhone,
      payment_desc: `Order #${orderData.orderId}`
    });

    return {
      success: true,
      transaction_id: paymentResponse.data.transaction_id,
      receipt: paymentResponse.data.receipt
    };

  } catch (error) {
    console.error('Payment Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Usage
processInventoryPayment({
  orderId: 'ORD-2024-001',
  billReference: 'ABC123456',
  amount: 25000,
  customerName: 'John Doe',
  customerPhone: '+255712345678'
});
```

### Example: Hospital System Integration

```javascript
async function processHospitalPayment(patientData) {
  const GATEWAY_URL = 'http://localhost:3000/api/payments';

  try {
    const response = await axios.post(`${GATEWAY_URL}/process`, {
      reference: patientData.billNumber,
      amount: patientData.totalAmount,
      mno_provider: patientData.paymentMethod, // 'STANBIC' or 'SELCOM'
      client_system: 'HOSPITAL_SYSTEM',
      client_reference: patientData.patientId,
      payer_name: patientData.patientName,
      payer_phone: patientData.phoneNumber,
      payer_email: patientData.email,
      payment_desc: `Hospital Bill - ${patientData.department}`
    });

    if (response.data.success) {
      // Update your hospital database
      await updatePatientBillStatus(
        patientData.patientId,
        'PAID',
        response.data.receipt
      );
    }

    return response.data;
  } catch (error) {
    console.error('Hospital Payment Error:', error);
    throw error;
  }
}
```

## Monitoring & Logs

### View Logs
```bash
# View combined logs
tail -f logs/combined.log

# View error logs only
tail -f logs/error.log

# View real-time logs in development
npm run dev
```

### Check Transaction History
```bash
curl http://localhost:3000/api/payments/history/YOUR_SYSTEM_NAME?limit=10
```

### Monitor Database
```bash
mysql -u root -p power_pay

# View recent transactions
SELECT transaction_id, reference, mno_provider, status, amount, created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

# Check transaction statistics
SELECT 
  mno_provider, 
  status, 
  COUNT(*) as count, 
  SUM(amount) as total 
FROM transactions 
GROUP BY mno_provider, status;
```

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Database connection error
```bash
# Check MySQL is running
systemctl status mysql

# Test MySQL connection
mysql -u root -p -e "SELECT 1"

# Check credentials in .env file
cat .env | grep DB_
```

### MNO API errors
- Verify credentials in .env
- Check network connectivity
- Review logs: `tail -f logs/error.log`
- Contact MNO support

## Production Deployment

### 1. Update Environment
```env
NODE_ENV=production
PORT=3000
# Use production database credentials
# Use production MNO credentials
```

### 2. Use Process Manager
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name power-pay

# View logs
pm2 logs power-pay

# Monitor
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

### 3. Setup Nginx (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Next Steps

1. ✅ Server is running
2. ✅ Database is configured
3. ✅ Basic test completed
4. 🔄 Integrate with your client systems
5. 🔄 Setup production environment
6. 🔄 Configure monitoring/alerts
7. 🔄 Setup backup procedures

## Support & Resources

- **Documentation**: See README.md
- **API Examples**: See API_EXAMPLES.md
- **Logs**: Check `logs/` directory
- **Database**: Check MySQL `payment_gateway` database

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change PORT in .env or kill process |
| Database connection failed | Check MySQL credentials in .env |
| MNO API timeout | Check network, verify credentials |
| Transaction stuck in PENDING | Query status endpoint or check MNO |
| High memory usage | Increase Node.js memory limit |

## Performance Tips

1. Use database indexing (already configured)
2. Enable caching for repeated queries
3. Monitor rate limits
4. Use connection pooling (already configured)
5. Regular database maintenance

Congratulations! Your Power-Pay Gateway is now running. 🎉
