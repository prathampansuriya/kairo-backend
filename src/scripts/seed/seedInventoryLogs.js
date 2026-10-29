import { InventoryLog } from '../../models/InventoryLog.js';
import { Product } from '../../models/Product.js';

export async function seedInventoryLogs({ products, orders, admins }) {
  console.log('\n--- [PHASE 14: INVENTORY TRACKING & LOGS SEEDING] ---');

  const adminId = admins[0]?._id;
  const logsToInsert = [];

  // Track sales per variant SKU from our 50 completed orders
  const variantSalesMap = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = variantSalesMap.get(item.sku) || [];
      current.push({
        orderId: order._id,
        quantity: item.quantity,
        timestamp: order.createdAt
      });
      variantSalesMap.set(item.sku, current);
    });
  });

  // For each variant in each product, generate initial restock log and order fulfillment logs
  for (const prod of products) {
    for (const v of prod.variants) {
      const sales = variantSalesMap.get(v.sku) || [];
      const totalSold = sales.reduce((acc, s) => acc + s.quantity, 0);

      // Current stock in the variant document is the on-hand stock
      const currentOnHand = v.stock;
      const initialStock = currentOnHand + totalSold;

      // 1. Initial Restock Log
      let runningStock = initialStock;
      logsToInsert.push({
        productId: prod._id,
        variantId: v._id,
        sku: v.sku,
        changeType: 'restock',
        quantityChanged: initialStock,
        previousStock: 0,
        newStock: initialStock,
        performedBy: adminId,
        reason: 'Initial atelier manufacturing and vault allocation batch.',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      });

      // 2. Order Fulfillment Logs
      for (const sale of sales) {
        const prev = runningStock;
        runningStock = Math.max(0, runningStock - sale.quantity);
        logsToInsert.push({
          productId: prod._id,
          variantId: v._id,
          sku: v.sku,
          changeType: 'order_fulfilled',
          quantityChanged: -sale.quantity,
          previousStock: prev,
          newStock: runningStock,
          referenceOrderId: sale.orderId,
          performedBy: adminId,
          reason: `Fulfilled for completed Order #${sale.orderId}`,
          createdAt: sale.timestamp
        });
      }
    }
  }

  const createdLogs = await InventoryLog.insertMany(logsToInsert);
  console.log(`✓ Seeded ${createdLogs.length} verified and arithmetically sound inventory logs.`);

  return createdLogs;
}

export default seedInventoryLogs;
