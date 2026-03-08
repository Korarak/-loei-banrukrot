# API Endpoints Documentation

## 🔐 Authentication

### User (Staff/Owner) Authentication
- `POST /api/auth/register` - Register new staff/owner
- `POST /api/auth/login` - Login staff/owner

### Customer Authentication
- `POST /api/auth/register-customer` - Register new customer
- `POST /api/auth/login-customer` - Login customer

---

## 📦 Products

### Public
- `GET /api/products` - Get all products (with pagination, search, filter)
- `GET /api/products/:id` - Get product by ID

### Protected (Staff/Owner)
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (owner only)
- `PATCH /api/products/variants/:id/stock` - Update variant stock

---

## 🛒 Cart (Customer Only)

- `GET /api/cart` - Get customer's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

---

## 📋 Orders

### Customer
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get customer's orders
- `GET /api/orders/:id` - Get order details

### Staff/Owner
- `GET /api/orders/all/list` - Get all orders (with filters)
- `PATCH /api/orders/:id/status` - Update order status

---

## 🏪 POS (Staff/Owner Only)

- `POST /api/pos/sales` - Create POS sale (walk-in)
- `GET /api/pos/sales` - Get POS sales history
- `GET /api/pos/sales/:saleReference` - Get sale receipt

---

## 🔧 System

- `GET /api/status` - Health check

---

## 📝 Request Examples

### Register Customer
```json
POST /api/auth/register-customer
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0812345678"
}
```

### Create Product
```json
POST /api/products
Authorization: Bearer <token>
{
  "productName": "iPhone 15 Pro",
  "description": "Latest iPhone",
  "brand": "Apple",
  "categoryId": 1,
  "variants": [
    {
      "sku": "IPH15-BLK-256",
      "option1Value": "Black",
      "option2Value": "256GB",
      "price": 42900,
      "stockAvailable": 10
    }
  ],
  "images": [
    {
      "imagePath": "/images/iphone15-black.jpg",
      "isPrimary": true
    }
  ]
}
```

### Add to Cart
```json
POST /api/cart/items
Authorization: Bearer <customer_token>
{
  "variantId": "692c73342ba44a69a86cf455",
  "quantity": 2
}
```

### Create Order
```json
POST /api/orders
Authorization: Bearer <customer_token>
{
  "shippingAddressId": "692c73342ba44a69a86cf460",
  "paymentMethod": "Card"
}
```

### POS Sale
```json
POST /api/pos/sales
Authorization: Bearer <staff_token>
{
  "items": [
    {
      "variantId": "692c73342ba44a69a86cf455",
      "quantity": 1
    }
  ],
  "paymentMethod": "Cash",
  "storeId": "692c73342ba44a69a86cf470"
}
```
