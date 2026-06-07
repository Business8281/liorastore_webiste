
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function POST(req) {
  try {
    const token = req.headers.get('x-shiprocket-webhook-token');
    
    // Basic token validation if needed
    if (process.env.SHIPROCKET_WEBHOOK_TOKEN && token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
        return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
    }

    const payload = await req.json();
    const { order_id, status, awb } = payload;

    if (!order_id) {
       return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
    }

    // Map Shiprocket status to LIORA status
    // Status can be: 'AWB Assigned', 'Label Generated', 'Pickup Scheduled', 'Out for Pickup', 'Pickuped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'RTO Initiated', 'RTO Delivered'
    let lioraStatus = 'shipped';
    if (status.toLowerCase().includes('delivered')) {
        lioraStatus = 'delivered';
    } else if (status.toLowerCase().includes('cancelled')) {
        lioraStatus = 'cancelled';
    } else if (status.toLowerCase().includes('rto')) {
        lioraStatus = 'returned';
    }

    // Find the order in Firestore by orderNumber or shiprocketOrderId
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', order_id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.warn(`Webhook: Order ${order_id} not found in Firestore`);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();
    await updateDoc(doc(db, 'orders', orderDoc.id), {
        status: lioraStatus,
        shippingStatus: status, // Store raw shiprocket status for reference
        awbNumber: awb,
        updatedAt: new Date().toISOString()
    });

    // 2. Send Email Notification for status change
    try {
        const { sendOrderEmail } = await import('@/lib/nodemailer');
        const { getOrderEmailTemplate } = await import('@/lib/email-templates');
        const { subject, html } = getOrderEmailTemplate(
            lioraStatus, 
            orderData.customerDetails.fullName, 
            orderData.orderNumber, 
            orderData.items, 
            orderData.totalAmount
        );
        await sendOrderEmail({ to: orderData.customerDetails.email, subject, html });
    } catch (emailError) {
        console.error('Webhook Email Error:', emailError.message);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
