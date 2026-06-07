import { NextResponse } from "next/server";
import { phonePe } from "@/lib/phonepe";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { randomUUID } from "crypto";

export async function POST(req) {
    try {
        const body = await req.json();
        const { merchantOrderId, amount, reason } = body;

        if (!merchantOrderId || !amount) {
            return NextResponse.json({ success: false, error: "Missing required fields: merchantOrderId, amount" }, { status: 400 });
        }

        const refundId = `RF${Date.now()}${randomUUID().split("-")[0]}`;

        // Import the builder dynamically
        const { RefundRequest } = await import('@phonepe-pg/pg-sdk-node');

        const request = RefundRequest.builder()
            .amount(Math.round(amount * 100)) // Amount in paise
            .merchantRefundId(refundId)
            .originalMerchantOrderId(merchantOrderId)
            .build();

        const response = await phonePe.refund(request);

        console.log("PhonePe SDK Refund Response:", response);

        const state = response?.state || response?.data?.state;

        if (state === "COMPLETED" || state === "PENDING" || state === "SUCCESS") {
            // Save refund record to Firestore
            try {
                await addDoc(collection(db, "refunds"), {
                    refundId,
                    merchantOrderId,
                    originalAmount: amount, // Keeping this in ruppes for ease of use in DB
                    refundAmount: amount,
                    status: state.toLowerCase(),
                    reason: reason || "User requested refund",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } catch (dbError) {
                console.error("Firestore Error creating refund record:", dbError);
            }

            return NextResponse.json({
                success: true,
                state: state,
                refundId: refundId
            });
        } else {
             return NextResponse.json({ 
                success: false, 
                error: response?.message || "Refund failed",
                details: response 
            }, { status: 400 });
        }
    } catch (error) {
        console.error("PhonePe SDK Refund error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
