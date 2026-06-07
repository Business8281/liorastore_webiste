const BRAND_COLOR = '#1A332E'; // Liora Primary Dark Green
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://liorastoreproject.web.app';
const LOGO_URL = `${BASE_URL}/logo200BR.png`;

export const getOrderEmailTemplate = (status, customerName, orderNumber, items = [], totalAmount = 0, discountAmount = 0, couponCode = null, shippingAddress = null, paymentMethod = 'UPI via Razorpay', requestReason = null, customerNote = null) => {
  const statusConfig = {
    confirmed: {
      subject: `Order Confirmed - ${orderNumber}`,
      headline: 'Thank you for choosing LIORA.',
      message: 'Your order has been placed and is being prepared for curation. We are honored to be a part of your culinary journey.'
    },
    processing: {
      subject: `Order Processing - ${orderNumber}`,
      headline: 'We Are Preparing Your Order.',
      message: 'Our team is preparing your items. Each item is carefully checked for quality before it is sent to you.'
    },
    shipped: {
      subject: `Your LIORA Products Are on the Way - ${orderNumber}`,
      headline: 'In Transit.',
      message: 'Your order has been entrusted to our logistics partners. A piece of Liora is traveling to your doorstep.'
    },
    delivered: {
      subject: `Order Delivered - ${orderNumber}`,
      headline: 'Arrival Complete.',
      message: 'We trust your new tools have arrived safely. May they serve you for a lifetime of healthy, heartfelt cooking.'
    },
    cancelled: {
      subject: `Order Cancelled - ${orderNumber}`,
      headline: 'Order Update.',
      message: 'Your order has been cancelled and its items have been returned to our inventory. Any processed payments will be refunded to your original method.'
    },
    return_requested: {
      subject: `Return Request Received - ${orderNumber}`,
      headline: 'Return Request Under Review.',
      message: 'We have received your request to return items from your order. Our team will review the details and get back to you with the next steps shortly.'
    },
    replacement_requested: {
      subject: `Replacement Request Received - ${orderNumber}`,
      headline: 'Replacement Request Under Review.',
      message: 'We have received your request for a replacement. We understand the importance of having the perfect tools, and we will process your request as a priority.'
    },
    returned: {
      subject: `Return Approved & Processed - ${orderNumber}`,
      headline: 'Return Complete.',
      message: 'Your return has been approved and the items are now back in our care. We are now processing your refund.'
    },
    refunded: {
      subject: `Refund Finalized - ${orderNumber}`,
      headline: 'Refund Complete.',
      message: 'Your refund has been finalized and issued. Depending on your bank, please allow 5-7 business days for the credit to appear in your account.'
    },
    replaced: {
      subject: `Replacement Dispatched - ${orderNumber}`,
      headline: 'A New Start.',
      message: 'Your replacement item has been curated and is on its way to you. We appreciate your patience as we make everything right.'
    }
  };

  const config = statusConfig[status] || statusConfig.confirmed;

  return {
    subject: config.subject,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6; background-color: #ffffff; border: 1px solid #f0f0f0;">
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #f5f5f5;">
          <img src="${LOGO_URL}" alt="Liora Logo" style="height: 40px; width: auto; display: block; margin: 0 auto;" />
          <p style="font-family: 'Helvetica', sans-serif; font-size: 9px; letter-spacing: 0.3em; color: #999; text-transform: uppercase; margin-top: 15px;">Home & Kitchen Essentials</p>
        </div>

        <div style="margin-bottom: 40px; text-align: left;">
          <h2 style="font-size: 28px; color: ${BRAND_COLOR}; margin-bottom: 20px; font-weight: normal; font-style: italic;">${config.headline}</h2>
          <p style="font-size: 15px; color: #444; margin-bottom: 10px;">Greetings ${customerName},</p>
          <p style="font-size: 15px; color: #666; font-style: italic;">${config.message}</p>
          
          ${requestReason ? `
            <div style="margin-top: 25px; padding: 20px; background-color: #fcfbf9; border-left: 4px solid ${BRAND_COLOR}; border-radius: 4px;">
              <p style="font-family: 'Helvetica', sans-serif; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Reason Provided</p>
              <p style="font-size: 14px; color: ${BRAND_COLOR}; font-weight: bold; margin: 0;">${requestReason}</p>
              ${customerNote ? `<p style="font-size: 13px; color: #666; margin: 8px 0 0 0; line-height: 1.4;">"${customerNote}"</p>` : ''}
            </div>
          ` : ''}
        </div>

        <div style="margin-bottom: 40px;">
          <p style="font-family: 'Helvetica', sans-serif; font-size: 11px; font-weight: bold; color: ${BRAND_COLOR}; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid ${BRAND_COLOR}; padding-bottom: 8px; display: inline-block;">Order Details: ${orderNumber}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            ${items && items.length > 0 ? items.map(item => `
              <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #f5f5f5; width: 70px;">
                  <img src="${item.image || item.featuredImage || ''}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; background-color: #f9f9f9;" />
                </td>
                <td style="padding: 15px 10px; border-bottom: 1px solid #f5f5f5;">
                  <p style="font-size: 14px; font-weight: bold; margin: 0; color: #333;">${item.title}</p>
                  <p style="font-size: 12px; color: #888; margin: 4px 0 0 0;">Quantity: ${item.quantity} &times; ₹${item.price}</p>
                </td>
                <td style="padding: 15px 0; border-bottom: 1px solid #f5f5f5; text-align: right; vertical-align: middle;">
                  <p style="font-size: 14px; font-weight: bold; margin: 0; color: ${BRAND_COLOR};">₹${item.price * item.quantity}</p>
                </td>
              </tr>
            `).join('') : ''}
          </table>

          <div style="background-color: #fcfbf9; padding: 25px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="color: #777;">Item Subtotal</span>
              <span style="color: #333;">₹${totalAmount + discountAmount}</span>
            </div>
            ${discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #10b981;">
                <span>Coupon (${couponCode})</span>
                <span>-₹${discountAmount}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-weight: bold; font-size: 18px; color: ${BRAND_COLOR};">
              <span>Final Total</span>
              <span>₹${totalAmount}</span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; border-top: 1px solid #f5f5f5; padding-top: 30px;">
          <div style="padding-right: 15px;">
            <p style="font-family: 'Helvetica', sans-serif; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Delivery Address</p>
            <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.6;">
              ${shippingAddress ? `
                <strong>${customerName}</strong><br/>
                ${shippingAddress}
              ` : 'Address details in account.'}
            </p>
          </div>
          <div>
            <p style="font-family: 'Helvetica', sans-serif; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Method of Payment</p>
            <p style="font-size: 13px; color: #555; margin: 0;">${paymentMethod}</p>
          </div>
        </div>

        <div style="text-align: center; font-family: 'Helvetica', sans-serif; font-size: 10px; color: #bbb; border-top: 1px solid #f5f5f5; padding-top: 30px; letter-spacing: 0.05em;">
          <p style="margin-bottom: 8px;">© 2026 LIORA | No coatings. No chemicals. Just pure craftsmanship.</p>
          <p>Hyderabad, Telangana, India</p>
          <div style="margin-top: 20px;">
            <a href="${BASE_URL}" style="color: #999; text-decoration: none; margin: 0 10px;">Home</a>
            <a href="${BASE_URL}/shop" style="color: #999; text-decoration: none; margin: 0 10px;">The Collection</a>
          </div>
        </div>
      </div>
    `
  };
};

export const getAdminNotificationEmailTemplate = (orderNumber, customerName, items = [], totalAmount = 0, customerDetails = {}, discountAmount = 0, couponCode = null) => {
  const shippingAddress = customerDetails.address ? 
    `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state || ''} - ${customerDetails.postalCode || ''}` : 
    null;

  return {
    subject: `New Order Received - ${orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #333; line-height: 1.6; background-color: #fcfbf9;">
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="${LOGO_URL}" alt="Liora Logo" style="height: 40px; width: auto; display: block; margin: 0 auto;" />
          <p style="font-size: 10px; letter-spacing: 0.2em; color: #999; text-transform: uppercase; margin-top: 12px;">Admin Notification</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #f0f0f0;">
          <h2 style="font-size: 22px; color: ${BRAND_COLOR}; margin-bottom: 20px; font-weight: normal;">New Order Alert</h2>
          <p style="font-size: 14px; color: #555; margin-bottom: 25px;">A new order has been placed on LioraStore.</p>
          
          <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f5f5f5;">
            <p style="font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 10px 0;">Customer Details</p>
            <p style="font-size: 14px; margin: 0;"><strong>${customerName}</strong></p>
            <p style="font-size: 13px; color: #666; margin: 4px 0;">${customerDetails.email || 'N/A'}</p>
            <p style="font-size: 13px; color: #666; margin: 4px 0;">${customerDetails.phone || 'N/A'}</p>
          </div>

          <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f5f5f5;">
            <p style="font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 10px 0;">Shipping Address</p>
            <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.5;">${shippingAddress || 'Address not provided.'}</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <p style="font-size: 11px; font-weight: bold; color: #999; text-transform: uppercase; margin: 0 0 10px 0;">Products Selected</p>
            ${items && items.length > 0 ? items.map(item => `
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <img src="${item.image || item.featuredImage || ''}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 12px; background-color: #f9f9f9;" />
                <div style="flex: 1;">
                  <p style="font-size: 13px; font-weight: bold; margin: 0;">${item.title} &times; ${item.quantity}</p>
                  <p style="font-size: 12px; color: #888; margin: 0;">Value: ₹${item.price * item.quantity}</p>
                </div>
              </div>
            `).join('') : ''}
          </div>

          <div style="border-top: 2px solid ${BRAND_COLOR}; padding-top: 15px; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; color: ${BRAND_COLOR};">
              <span>Final Total</span>
              <span>₹${totalAmount}</span>
            </div>
            ${discountAmount > 0 ? `<p style="font-size: 11px; color: #10b981; margin: 5px 0 0 0;">Coupon Used: ${couponCode} (-₹${discountAmount})</p>` : ''}
          </div>
        </div>

        <div style="text-align: center; font-size: 11px; color: #999; padding-top: 20px;">
          <p>Automated notification from store system.</p>
        </div>
      </div>
    `
  };
};

