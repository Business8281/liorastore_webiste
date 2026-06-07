import { NextResponse } from "next/server";
import { phonePe } from "@/lib/phonepe";

export async function POST(req) {
    try {
        const body = await req.json();
        const { amount, customerDetails, callbackUrl, orderRecord } = body;

        const merchantTransactionId = `MT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // 1. Prepare Base URL for absolute links
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

        // 1. Prepare Payment Request using SDK Builders
        // The V2 SDK requires requests to be built using its internal Builder classes
        const { StandardCheckoutPayRequest } = await import('@phonepe-pg/pg-sdk-node');

        const redirectUrlFull = new URL(`/api/phonepe/status?id=${merchantTransactionId}`, baseUrl).toString();

        const payRequest = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(Math.round(amount * 100)) // Amount in paise
            .redirectUrl(redirectUrlFull)
            .build();

        // 2. Save pending order to Firestore
        const finalOrderRecord = {
            ...orderRecord,
            merchantTransactionId: merchantTransactionId,
            status: "pending",
            createdAt: new Date().toISOString()
        };

        try {
            const { db } = await import("@/lib/firebase");
            const { collection, addDoc } = await import("firebase/firestore");
            await addDoc(collection(db, "pending_orders"), finalOrderRecord);
        } catch (dbError) {
            console.error("Firestore Error in PhonePe route:", dbError);
        }

        // 3. Initiate Payment via SDK
        // V2 StandardCheckoutClient pay method
        try {
            const response = await phonePe.pay(payRequest);
            
            if (response && response.redirectUrl) {
                return NextResponse.json({
                    success: true,
                    url: response.redirectUrl,
                });
            } else {
                 console.error("PhonePe SDK V2 pay failure:", response);
                 return NextResponse.json({ 
                    success: false, 
                    error: "Failed to initiate payment. Redirect URL not present in SDK response.",
                    details: response 
                }, { status: 400 });
            }
        } catch (phonePeError) {
             console.error("PhonePe SDK Exception:", phonePeError.message || phonePeError);
             return NextResponse.json({ 
                success: false, 
                error: phonePeError.message || "Payment initiation failed",
                details: phonePeError 
            }, { status: 400 });
        }
    } catch (error) {
        console.error("PhonePe SDK Global error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}


