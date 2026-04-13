// models/index.js
// Central export file for all// models/index.js
module.exports = {
    User: require('./User'),
    Customer: require('./Customer'),
    CustomerAddress: require('./CustomerAddress'),
    Product: require('./Product'),
    ProductVariant: require('./ProductVariant'),
    ProductImage: require('./ProductImage'),
    Category: require('./Category'),
    Cart: require('./Cart'),
    CartItem: require('./CartItem'),
    Order: require('./Order'),
    OrderDetail: require('./OrderDetail'),
    Payment: require('./Payment'),
    Store: require('./Store'),
    ShippingMethod: require('./ShippingMethod'),
    StockMovement: require('./StockMovement')
};
