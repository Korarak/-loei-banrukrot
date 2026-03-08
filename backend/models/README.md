# MongoDB Schema Documentation

## 📊 Database Structure

This MongoDB database schema is designed for an **E-commerce + POS System** with 12 collections (models).

## 🗂️ Collections Overview

### 1. **Users** - Backend Staff
- **Purpose:** Store owners and staff who manage the system
- **Key Fields:** username, email, passwordHash, role (owner/staff)
- **Indexes:** username, email

### 2. **Customers** - Frontend Users
- **Purpose:** Customers who purchase products
- **Key Fields:** firstName, lastName, email, passwordHash, phone
- **Indexes:** email, phone

### 3. **CustomerAddresses** - Shipping Addresses
- **Purpose:** Store customer delivery addresses
- **Key Fields:** recipientName, streetAddress, district, province, zipCode, isDefault
- **Relationships:** References Customer

### 4. **Stores** - POS Branches
- **Purpose:** Multiple store locations for POS system
- **Key Fields:** storeName, locationAddress, isActive

### 5. **Products** - Product Catalog
- **Purpose:** Main product information
- **Key Fields:** productName, description, categoryId, brand
- **Indexes:** productName, categoryId, isActive

### 6. **ProductVariants** - SKUs
- **Purpose:** Product variations with different options/prices
- **Key Fields:** sku, option1Value, option2Value, price, stockAvailable
- **Relationships:** References Product
- **Indexes:** sku (unique), productId

### 7. **ProductImages** - Product Photos
- **Purpose:** Store product image paths
- **Key Fields:** imagePath, isPrimary, sortOrder
- **Relationships:** References Product

### 8. **Carts** - Shopping Carts
- **Purpose:** Customer shopping carts
- **Key Fields:** customerId (unique), dateCreated, lastUpdated
- **Relationships:** References Customer

### 9. **CartItems** - Cart Line Items
- **Purpose:** Items in shopping carts
- **Key Fields:** cartId, variantId, quantity
- **Relationships:** References Cart and ProductVariant
- **Unique Constraint:** (cartId + variantId)

### 10. **Orders** - Purchase Orders
- **Purpose:** Both online and POS orders
- **Key Fields:** 
  - customerId (nullable for walk-in)
  - source (online/pos)
  - saleReference (POS receipt number)
  - totalAmount, orderStatus
- **Relationships:** References Customer, CustomerAddress, Store, User (cashier)
- **Indexes:** customerId, orderDate, source, orderStatus

### 11. **OrderDetails** - Order Line Items
- **Purpose:** Products in each order with historical pricing
- **Key Fields:** orderId, variantId, quantity, pricePerUnit, subtotal
- **Relationships:** References Order and ProductVariant

### 12. **Payments** - Payment Transactions
- **Purpose:** Payment records (supports multiple payments per order)
- **Key Fields:** orderId, paymentMethod, amountPaid, referenceNo
- **Payment Methods:** Cash, Card, Transfer, QR, ShopeePay, Other
- **Relationships:** References Order and Customer

## 🔗 Relationships

```
Customer → CustomerAddresses (1:N)
Customer → Carts (1:1)
Customer → Orders (1:N)

Product → ProductVariants (1:N)
Product → ProductImages (1:N)

Cart → CartItems (1:N)
ProductVariant → CartItems (1:N)

Order → OrderDetails (1:N)
Order → Payments (1:N)
ProductVariant → OrderDetails (1:N)

Store → Orders (1:N)
User → Orders (1:N) [as cashier]
```

## 📝 Usage Example

```javascript
// Import all models
const { Product, ProductVariant, Order, Customer } = require('./models');

// Create a product
const product = await Product.create({
    productName: 'iPhone 15 Pro',
    description: 'Latest iPhone model',
    brand: 'Apple',
    isActive: true
});

// Create variants
await ProductVariant.create({
    productId: product._id,
    sku: 'IPH15-BLK-256',
    option1Value: 'Black',
    option2Value: '256GB',
    price: 42900,
    stockAvailable: 10
});

// Query with population
const orders = await Order.find({ source: 'online' })
    .populate('customerId')
    .populate('shippingAddressId');
```

## 🎯 Key Features

✅ **Dual System Support:** Works for both E-commerce and POS  
✅ **Flexible Orders:** Nullable fields for walk-in customers  
✅ **Historical Pricing:** OrderDetails store price at time of purchase  
✅ **Multiple Payments:** Supports split payments  
✅ **Inventory Tracking:** Stock management via ProductVariants  
✅ **Performance Optimized:** Strategic indexes on frequently queried fields
