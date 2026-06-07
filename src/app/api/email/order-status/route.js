import { NextResponse } from 'next/server';
import { sendOrderEmail } from '@/lib/nodemailer';
import { getOrderEmailTemplate, getAdminNotificationEmailTemplate } from '@/lib/email-templates';

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, status, customerName, orderNumber, items, totalAmount, discountAmount, couponCode, shippingAddress, paymentMethod, requestReason, customerNote } = body;

    if (!to || !status || !customerName || !orderNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let subject, html;
    
    if (status === 'admin-notification') {
      const { customerDetails = {} } = body;
      ({ subject, html } = getAdminNotificationEmailTemplate(orderNumber, customerName, items, totalAmount, customerDetails, discountAmount, couponCode));
    } else {
      ({ subject, html } = getOrderEmailTemplate(status, customerName, orderNumber, items, totalAmount, discountAmount, couponCode, shippingAddress, paymentMethod, requestReason, customerNote));
    }

    const result = await sendOrderEmail({ to, subject, html });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
