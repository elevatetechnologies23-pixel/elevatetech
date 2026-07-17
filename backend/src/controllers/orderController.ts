import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import AuditLog from '../models/AuditLog';
import License from '../models/License';
import { AppError } from '../app';
import { notifyAdmins } from '../utils/notifications';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, couponCode, shippingAddress, paymentMethod, email, phoneNumber } = req.body;

    if (!items || items.length === 0) {
      return next(new AppError('No order items provided', 400));
    }

    let subTotal = 0;
    let gstTotal = 0;
    const orderItems = [];

    // Verify stock and compute pricing details
    for (const item of items) {
      console.log('ORDER_ITEM_DEBUG:', JSON.stringify(item));
      const product = await Product.findById(item.id);
      console.log('PRODUCT_FOUND:', product ? product.name : 'null');
      if (!product) {
        return next(new AppError(`Product not found: ${item.name}`, 404));
      }

      if (product.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for product: ${product.name}`, 400));
      }

      // Decrement product inventory levels
      product.stock -= item.quantity;
      await product.save();

      const itemPriceExclGst = product.basePrice;
      const itemGst = itemPriceExclGst * (product.gstPercentage / 100) * item.quantity;
      const itemTotal = (itemPriceExclGst + (itemPriceExclGst * (product.gstPercentage / 100))) * item.quantity;

      subTotal += itemPriceExclGst * item.quantity;
      gstTotal += itemGst;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: itemPriceExclGst,
        gstAmount: itemGst,
        totalPrice: itemTotal,
        sku: product.sku,
        variantName: item.variantName || ''
      });
    }

    // Coupon discount logic
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        // Date verification
        const now = new Date();
        if (now >= coupon.startDate && now <= coupon.endDate) {
          if (!coupon.minPurchase || subTotal >= coupon.minPurchase) {
            if (coupon.discountType === 'percentage') {
              discountAmount = subTotal * (coupon.discountValue / 100);
            } else {
              discountAmount = coupon.discountValue;
            }

            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }

            coupon.usageCount += 1;
            await coupon.save();
          }
        }
      }
    }

    const shippingCharge = subTotal > 5000 ? 0 : 150; // Free shipping over 5000
    const grandTotal = subTotal + gstTotal + shippingCharge - discountAmount;

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000).toString();
    const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000).toString();

    const order = await Order.create({
      user: req.user?._id,
      orderNumber,
      invoiceNumber,
      items: orderItems,
      subTotal,
      gstTotal,
      discountAmount,
      couponApplied: couponCode || undefined,
      shippingCharge,
      grandTotal,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid', // Auto-pay mock for upi/card in testing
      orderStatus: 'placed',
      email: email || req.user?.email,
      phoneNumber: phoneNumber || (req.user as any)?.phone || '',
      invoiceUrl: `/api/v1/orders/invoice/${orderNumber}/download`
    });

    // Write audit logs
    await AuditLog.create({
      user: req.user?._id,
      action: 'ORDER_PLACE',
      details: `Placed order ${order.orderNumber} for total INR ${order.grandTotal}`
    });

    // If order contains billing software, generate license automatically!
    for (const item of orderItems) {
      if (item.name.toLowerCase().includes('billing software') || item.sku.toLowerCase().includes('bill')) {
        const licenseKey = 'LIC-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                           Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                           Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                           Math.random().toString(36).substring(2, 6).toUpperCase();
        
        await License.create({
          licenseKey,
          productName: item.name,
          assignedTo: req.user?._id,
          orderId: order._id,
          maxActivations: 3,
          activeActivations: 0,
          status: 'active',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
        });
      }
    }

    // Notify all admin users about the new order
    await notifyAdmins(
      'New Order Placed',
      `Order ${order.orderNumber} placed by customer for INR ${order.grandTotal.toLocaleString('en-IN')}`,
      '/admin/orders'
    );

    res.status(201).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user?._id }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Access check: User must own the order or be admin/employee
    if (req.user?.role === 'customer' && order.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized', 403));
    }

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, cancellationReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (status === 'cancelled') {
      if (!cancellationReason || !cancellationReason.trim()) {
        return next(new AppError('Cancellation reason is required to cancel this order', 400));
      }
      order.cancellationReason = cancellationReason;

      // Revert product inventory levels if not already cancelled
      if (order.orderStatus !== 'cancelled') {
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      }
    }

    order.orderStatus = status;
    await order.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'ORDER_STATUS_UPDATE',
      details: `Updated order ${order.orderNumber} status to ${status}`
    });

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN: Update payment status of an order
export const updatePaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentStatus } = req.body;

    const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_paid'];
    if (!paymentStatus || !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return next(new AppError(`Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`, 400));
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const previousStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    await order.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'PAYMENT_STATUS_UPDATE',
      details: `Order ${order.orderNumber} payment status changed from "${previousStatus}" → "${paymentStatus}" by admin`
    });

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cancellationReason } = req.body;
    if (!cancellationReason || !cancellationReason.trim()) {
      return next(new AppError('Cancellation reason is required to cancel this order', 400));
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Verify ownership
    if (order.user.toString() !== req.user?._id.toString()) {
      return next(new AppError('You do not have permission to cancel this order', 403));
    }

    // Verify status (cannot cancel shipped/delivered/already cancelled)
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return next(new AppError('Order has already been shipped or delivered and cannot be cancelled', 400));
    }
    if (order.orderStatus === 'cancelled') {
      return next(new AppError('Order is already cancelled', 400));
    }

    // Revert product inventory levels
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Cancel order status
    order.orderStatus = 'cancelled';
    order.cancellationReason = cancellationReason;
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }
    await order.save();

    // Audit logs
    await AuditLog.create({
      user: req.user?._id,
      action: 'ORDER_CANCEL',
      details: `Cancelled order ${order.orderNumber} by user`
    });

    // Notify all admin users about the cancellation
    await notifyAdmins(
      'Order Cancelled by Customer',
      `Order ${order.orderNumber} was cancelled. Reason: "${order.cancellationReason}"`,
      '/admin/orders'
    );

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).populate('user', 'name email');
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.setHeader('Content-Type', 'text/html');

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155;">
          <div style="font-weight: 700; color: #0f172a;">${item.name}</div>
          ${item.variantName ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">Variant: ${item.variantName}</div>` : ''}
          <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">SKU: ${item.sku}</div>
        </td>
        <td style="padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; text-align: center;">${item.quantity}</td>
        <td style="padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; text-align: right;">INR ${item.price.toLocaleString('en-IN')}</td>
        <td style="padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; text-align: right;">18%</td>
        <td style="padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; text-align: right; font-weight: 600;">INR ${item.totalPrice.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const businessDetailsHtml = (order as any).businessDetails && ((order as any).businessDetails as any).gstin
      ? `<div style="margin-top: 8px; font-size: 11px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 6px 10px; border-radius: 6px; display: inline-block;">
           <strong>Business Invoice (ITC Claimable)</strong><br/>
           Company: ${((order as any).businessDetails as any).companyName}<br/>
           GSTIN: ${((order as any).businessDetails as any).gstin}
         </div>`
      : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.orderNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px 20px;
      background: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      background: white;
      max-width: 800px;
      margin: 0 auto;
      padding: 48px;
      border-radius: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 32px;
      margin-bottom: 32px;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 26px;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .logo-area p {
      margin: 6px 0 0 0;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      margin: 0;
      font-size: 22px;
      color: #0284c7;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .invoice-meta p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #475569;
      line-height: 1.4;
    }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-bottom: 40px;
    }
    .details h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin: 0 0 10px 0;
      font-weight: 700;
    }
    .details p {
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 4px 0;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    th {
      text-align: left;
      padding: 14px 16px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      font-weight: 700;
    }
    .text-right {
      text-align: right !important;
    }
    .summary {
      display: flex;
      justify-content: flex-end;
    }
    .summary-table {
      width: 320px;
      margin-bottom: 0;
    }
    .summary-table td {
      padding: 10px 0;
      border: none;
      font-size: 13px;
      color: #475569;
    }
    .summary-table tr.total td {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #f1f5f9;
      padding-top: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 64px;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
      line-height: 1.5;
    }
    .actions {
      max-width: 800px;
      margin: 0 auto 24px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      background: #0f172a;
      color: white;
      border: none;
      padding: 10px 22px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #1e293b;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .actions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn" onclick="window.close()" style="background: transparent; color: #64748b; border: 1px solid #e2e8f0;">&larr; Close Window</button>
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 11px; color: #94a3b8; max-width: 240px; text-align: right; line-height: 1.3;">
        Note: If print button fails, open this URL in Chrome/Edge to print or save.
      </span>
      <button class="btn" onclick="downloadHTML()" style="background: #0284c7;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        Download HTML
      </button>
      <button class="btn" onclick="handlePrint()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Print / Save PDF
      </button>
    </div>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div class="logo-area">
        <h1>ENTERPRISE ELECTRONICS</h1>
        <p>GSTIN: 29AAAAA0000A1Z5 | Corporate B2B Procurements</p>
      </div>
      <div class="invoice-meta">
        <h2>TAX INVOICE</h2>
        <p><strong>Invoice No:</strong> ${order.invoiceNumber}</p>
        <p><strong>Order Ref:</strong> ${order.orderNumber}</p>
        <p><strong>Date:</strong> ${order.createdAt.toLocaleDateString('en-IN')}</p>
      </div>
    </div>

    <div class="details">
      <div>
        <h3>Billed To</h3>
        <p style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${(order.user as any).name}</p>
        <p>${(order.user as any).email}</p>
        ${businessDetailsHtml}
      </div>
      <div>
        <h3>Shipping Address</h3>
        <p>${order.shippingAddress.street}</p>
        <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}</p>
        <p>${order.shippingAddress.country}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">GST Rate</th>
          <th class="text-right">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary">
      <table class="summary-table">
        <tr>
          <td>Base Subtotal:</td>
          <td class="text-right">INR ${order.subTotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>GST Tax Amount (Excl.):</td>
          <td class="text-right">INR ${order.gstTotal.toLocaleString('en-IN')}</td>
        </tr>
        ${order.discountAmount > 0 ? `
        <tr style="color: #166534; font-weight: 600;">
          <td>Coupon Discount:</td>
          <td class="text-right">-INR ${order.discountAmount.toLocaleString('en-IN')}</td>
        </tr>` : ''}
        <tr>
          <td>Logistics / Delivery:</td>
          <td class="text-right">INR ${order.shippingCharge.toLocaleString('en-IN')}</td>
        </tr>
        <tr class="total">
          <td>Grand Total:</td>
          <td class="text-right">INR ${order.grandTotal.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p style="font-weight: 600; color: #475569; margin-bottom: 4px;">Thank you for shopping with us!</p>
      <p style="margin: 0;">This is a computer-generated tax invoice and does not require a physical signature.</p>
    </div>
  </div>

  <script>
    function handlePrint() {
      try {
        window.print();
      } catch (err) {
        alert("The print dialog could not be opened automatically. If you are viewing this page inside an embedded editor window or previewer, please copy the page URL and paste it into a standard browser tab (like Google Chrome or Microsoft Edge) to print or save as PDF.");
      }
    }

    function downloadHTML() {
      try {
        const docClone = document.documentElement.cloneNode(true);
        const actionsPanel = docClone.querySelector('.actions');
        if (actionsPanel) actionsPanel.remove();
        
        const blob = new Blob([docClone.outerHTML], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "Invoice-${order.orderNumber}.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        alert("Failed to download HTML invoice offline file. Please try printing or saving as PDF.");
      }
    }
  </script>
</body>
</html>
    `;

    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, subTotal } = req.body;
    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return next(new AppError('Invalid coupon code', 404));
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return next(new AppError('Coupon has expired', 400));
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return next(new AppError('Coupon usage limit reached', 400));
    }

    if (coupon.minPurchase && subTotal < coupon.minPurchase) {
      return next(new AppError(`Minimum purchase of INR ${coupon.minPurchase} required for this coupon`, 400));
    }

    res.status(200).json({
      status: 'success',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount
      }
    });
  } catch (error) {
    next(error);
  }
};
