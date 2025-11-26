# Power-Pay Gateway

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗  ██████╗ ██╗    ██╗███████╗██████╗       ██████╗       ║
║   ██╔══██╗██╔═══██╗██║    ██║██╔════╝██╔══██╗      ██╔══██╗      ║
║   ██████╔╝██║   ██║██║ █╗ ██║█████╗  ██████╔╝█████╗██████╔╝      ║
║   ██╔═══╝ ██║   ██║██║███╗██║██╔══╝  ██╔══██╗╚════╝██╔═══╝       ║
║   ██║     ╚██████╔╝╚███╔███╔╝███████╗██║  ██║      ██║           ║
║   ╚═╝      ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝      ╚═╝           ║
║                                                                   ║
║   Power Computer Payment Gateway - Multi-MNO Support             ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## What is Power-Pay?

Power-Pay is a robust, enterprise-grade payment gateway that seamlessly handles transactions across multiple Mobile Network Operators (MNOs). Built with Node.js and MySQL, it provides a unified API for payment processing, verification, and tracking.

## Key Features

🚀 **Multi-MNO Integration**
   - Stanbic Bank
   - Selcom
   - Easily extensible for additional MNOs

⚡ **High Performance**
   - Connection pooling for database
   - Efficient request handling
   - Rate limiting for protection

🔒 **Security First**
   - Checksum validation (SHA256, MD5, HMAC)
   - Request validation with Joi
   - Helmet.js security headers
   - CORS protection

📊 **Complete Tracking**
   - Transaction history
   - Real-time status queries
   - Comprehensive logging

🎯 **Developer Friendly**
   - RESTful API design
   - Clear documentation
   - Easy integration
   - Example code included

## Supported MNOs

### Stanbic Bank
- Biller verification
- Payment processing
- Automatic checksum generation
- Full error handling

### Selcom
- Utility payments
- Wallet cash-in
- Balance queries
- Transaction status tracking

## Use Cases

✅ Hospital Management Systems
✅ Inventory Management Systems
✅ Educational Institutions
✅ E-commerce Platforms
✅ Subscription Services
✅ Utility Bill Payments
✅ Any system requiring payment processing

## Architecture

```
Client Systems (Hospital, Inventory, etc.)
              ↓
         Power-Pay Gateway
        (Node.js/Express)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Stanbic Bank        Selcom
              ↓
         MySQL Database
    (Transaction Storage)
```

## Quick Stats

- **Language**: Node.js (JavaScript)
- **Framework**: Express.js
- **Database**: MySQL
- **API Style**: RESTful
- **License**: MIT
- **Version**: 1.0.0

## Getting Started

See `QUICK_START.md` for step-by-step setup instructions.

## Documentation

- **README.md** - Complete system documentation
- **QUICK_START.md** - Quick setup guide
- **API_EXAMPLES.md** - API usage examples with cURL and code

## Support

Built for reliability, scalability, and ease of use. Power-Pay handles the complexity of multi-MNO integration so you can focus on your business logic.

---

**Power-Pay** - Powering payment solutions across Tanzania 🇹🇿
