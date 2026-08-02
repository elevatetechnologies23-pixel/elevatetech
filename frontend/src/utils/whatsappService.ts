/**
 * Helper utility for instant WhatsApp license keys, tax invoice, and support ticket message formatting.
 */

// Clean phone number (defaults to enterprise helpdesk if no phone provided)
const formatPhone = (phone?: string) => {
  if (!phone) return '919922567375';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
};

// 1. Share License Key on WhatsApp
export const shareLicenseOnWhatsApp = (
  phone?: string, 
  licenseKey?: string, 
  productName?: string, 
  validUntil?: string
) => {
  const targetPhone = formatPhone(phone);
  const formattedDate = validUntil ? new Date(validUntil).toLocaleDateString('en-IN') : '1 Year Valid';
  
  const text = encodeURIComponent(
`🔑 *Elevate Technology — Software License Key*

Dear Client,
Here is your official software license key:

📌 *Product:* ${productName || 'Enterprise Billing POS Software'}
🔑 *License Key:* ${licenseKey || 'LIC-XXXX-XXXX-XXXX'}
📅 *Valid Until:* ${formattedDate}

Need activation assistance? Contact tech support: +91 9922567375`
  );

  window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
};

// 2. Share GST Invoice / Order Summary on WhatsApp
export const shareInvoiceOnWhatsApp = (
  phone?: string, 
  orderNumber?: string, 
  grandTotal?: number,
  itemNames?: string
) => {
  const targetPhone = formatPhone(phone);
  
  const text = encodeURIComponent(
`🧾 *Elevate Technology — Official Order Tax Invoice*

Hello! Here are your order details:

📦 *Order Ref:* ${orderNumber || 'ORD-UNKNOWN'}
🛒 *Items:* ${itemNames || 'Hardware & Software Package'}
💰 *Total Amount:* INR ${grandTotal?.toLocaleString('en-IN') || '0'}
📄 *Invoice Download:* https://elevatetechnology.com/dashboard

Thank you for choosing Elevate Technology!`
  );

  window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
};

// 3. Share Support Ticket Response on WhatsApp
export const shareTicketOnWhatsApp = (
  phone?: string, 
  ticketNumber?: string, 
  subject?: string
) => {
  const targetPhone = formatPhone(phone);
  
  const text = encodeURIComponent(
`💬 *Elevate Technology — Support Ticket Update*

Hello!
Your support ticket status has been updated:

🏷️ *Ticket Number:* ${ticketNumber || 'TCK-UNKNOWN'}
📌 *Subject:* ${subject || 'Technical Enquiry'}
🌐 *View Portal:* https://elevatetechnology.com/dashboard

Our 24/7 technical team is here to assist you!`
  );

  window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
};
