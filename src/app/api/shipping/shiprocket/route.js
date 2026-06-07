
import { NextResponse } from 'next/server';
import shiprocket from '@/lib/shiprocket';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req) {
  try {
    const { order } = await req.json();
    
    if (!order) {
      return NextResponse.json({ error: 'Order data is required' }, { status: 400 });
    }

    // 1. Push to Shiprocket
    const shiprocketResponse = await shiprocket.createOrder(order);

    if (shiprocketResponse.order_id) {
      return NextResponse.json({ 
        success: true, 
        shiprocketOrderId: shiprocketResponse.order_id,
        shiprocketShipmentId: shiprocketResponse.shipment_id
      });
    }

    return NextResponse.json({ error: 'Failed to create order in Shiprocket', details: shiprocketResponse }, { status: 500 });

  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('API Shiprocket Error:', errorDetails);
    return NextResponse.json({ 
      error: 'Shiprocket Validation Failed', 
      details: errorDetails 
    }, { status: error.response?.status || 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get('shipmentId');

  if (!shipmentId) {
    return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
  }

  try {
    const trackingData = await shiprocket.getTrackingDetails(shipmentId);
    return NextResponse.json(trackingData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
