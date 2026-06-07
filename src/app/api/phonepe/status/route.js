import { NextResponse } from "next/server";
import { phonePe } from "@/lib/phonepe";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";

export async function GET(req) {
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    
    try {
        const { searchParams } = new URL(req.url);
        const merchantTransactionId = searchParams.get("id");

        if (!merchantTransactionId) {
            const redirectUrl = new URL("/checkout?error=missing_transaction_id", baseUrl).toString();
            return NextResponse.redirect(redirectUrl);
        }

        // 1. Check Status via SDK
        const statusResponse = await phonePe.getOrderStatus(merchantTransactionId);
        console.log("PhonePe SDK Status Response:", statusResponse);

        // Verification logic for SDK v2: The documentation says response.state contains the status directly
        // Fallbacks included in case it's nested under data
        const state = statusResponse?.state || statusResponse?.data?.state;
        const code = statusResponse?.code;
        
        const isSuccessful = 
            state === "COMPLETED" || 
            state === "SUCCESS" || 
            code === "PAYMENT_SUCCESS";

        if (isSuccessful) {
            // Find and finalize order
            const pendingQuery = query(
                collection(db, "pending_orders"),
                where("merchantTransactionId", "==", merchantTransactionId)
            );
            const querySnapshot = await getDocs(pendingQuery);

            if (querySnapshot.empty) {
                console.error("No pending order found for transaction:", merchantTransactionId);
                const redirectUrl = new URL("/order-confirmation?status=already_processed", baseUrl).toString();
                return NextResponse.redirect(redirectUrl);
            }

            const pendingDoc = querySnapshot.docs[0];
            const orderData = pendingDoc.data();

            // Create final order
            const finalOrder = {
                ...orderData,
                status: "processing",
                paymentStatus: "paid",
                paymentMethod: "PhonePe / UPI",
                phonePeTransactionId: statusResponse.data?.transactionId || merchantTransactionId,
                updatedAt: new Date().toISOString()
            };

            const orderRef = await addDoc(collection(db, "orders"), finalOrder);
            await deleteDoc(pendingDoc.ref);

            // Trigger Post-Payment tasks
            try {
                await Promise.allSettled([
                    fetch(new URL('/api/email/order-status', baseUrl).toString(), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId: orderRef.id,
                            status: "processing",
                            email: orderData.customerDetails.email,
                            orderData: finalOrder
                        }),
                    }),
                    fetch(new URL('/api/shipping/shiprocket', baseUrl).toString(), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId: orderRef.id,
                            orderData: finalOrder
                        }),
                    })
                ]);
            } catch (postTaskError) {
                console.error("Post-payment error (PhonePe):", postTaskError);
            }

            const successRedirect = new URL(`/order-confirmation?id=${orderRef.id}`, baseUrl).toString();
            return NextResponse.redirect(successRedirect);
        } else {
            console.warn("PhonePe Payment failed or pending (SDK):", statusResponse);
            const errorCode = statusResponse.data?.state || statusResponse.code || 'FAILED';
            const failRedirect = new URL(`/checkout?error=payment_failed&code=${errorCode}`, baseUrl).toString();
            return NextResponse.redirect(failRedirect);
        }
    } catch (error) {
        console.error("PhonePe SDK Status error:", error);
        const errorRedirect = new URL("/checkout?error=internal_server_error", baseUrl).toString();
        return NextResponse.redirect(errorRedirect);
    }
}



