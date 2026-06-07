import { NextResponse } from "next/server";
import { phonePe } from "@/lib/phonepe";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";

export async function POST(req) {
    try {
        const body = await req.json();

        // PhonePe sends the base64 encoded response inside a "response" field
        const stringResponse = body.response;
        if (!stringResponse) {
            return NextResponse.json({ success: false, message: "Invalid webhook payload" }, { status: 400 });
        }

        // 1. Verify Webhook via SDK
        const xVerify = req.headers.get("x-verify");
        const merchantUsername = process.env.PHONEPE_MERCHANT_USERNAME || "";
        const merchantPassword = process.env.PHONEPE_MERCHANT_PASSWORD || "";

        let callbackResponse = null;
        let verificationStatus = false;

        try {
            // According to StandardCheckoutClient signature: validateCallback(username, password, authorization, responseBody)
            callbackResponse = await phonePe.validateCallback(merchantUsername, merchantPassword, xVerify, stringResponse);

            // The SDK returns a populated object if validation is successful
            if (callbackResponse && callbackResponse.payload) {
                verificationStatus = true;
            }
        } catch (e) {
            console.warn("SDK Webhook validation failed. Checking fallback... Error:", e.message);
            // Fallback manual verify since SDK validateCallback often expects basic auth which might not be set
            const saltKey = process.env.PHONEPE_CLIENT_SECRET;
            const crypto = require("crypto");
            const stringToHash = stringResponse + saltKey;
            const generatedChecksum = crypto.createHash("sha256").update(stringToHash).digest("hex") + "###1";

            if (xVerify === generatedChecksum) {
                verificationStatus = true;
                // If we fell back, we must manually decode
                const decodedString = Buffer.from(stringResponse, 'base64').toString('utf-8');
                const webhookData = JSON.parse(decodedString);
                // Map the JSON to the SDK's expected structure for the rest of our code
                callbackResponse = {
                    payload: {
                        orderId: webhookData.data?.merchantTransactionId,
                        state: webhookData.code === "PAYMENT_SUCCESS" ? "COMPLETED" : "FAILED",
                        transactionId: webhookData.data?.transactionId,
                        // Re-attaching the raw data for fallback scenarios
                        _raw: webhookData
                    }
                };
            }
        }

        if (!verificationStatus || !callbackResponse) {
            console.error("PhonePe Webhook Verification Failed");
            return NextResponse.json({ success: false, message: "Verification failed" }, { status: 401 });
        }

        console.log("PhonePe Webhook Received & Validated:", callbackResponse.payload);

        // Map SDK response structure
        const merchantTransactionId = callbackResponse.payload.orderId || callbackResponse.payload.merchantOrderId;
        const state = callbackResponse.payload.state;

        // 3. Process the Payment Success
        if (state === "COMPLETED" || state === "SUCCESS") {
            // Find in pending_orders first
            const pendingQuery = query(
                collection(db, "pending_orders"),
                where("merchantTransactionId", "==", merchantTransactionId)
            );
            const pendingSnapshot = await getDocs(pendingQuery);

            if (!pendingSnapshot.empty) {
                // It's still in pending, which means the user closed the browser before returning to /status!
                const pendingDoc = pendingSnapshot.docs[0];
                const orderData = pendingDoc.data();

                const finalOrder = {
                    ...orderData,
                    status: "processing",
                    paymentStatus: "paid",
                    paymentMethod: "PhonePe / UPI",
                    phonePeTransactionId: callbackResponse.payload.transactionId || merchantTransactionId,
                    updatedAt: new Date().toISOString()
                };

                // Move to orders
                const orderRef = await addDoc(collection(db, "orders"), finalOrder);
                await deleteDoc(pendingDoc.ref);

                // Send email & sync to Shiprocket silently
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
                try {
                    await Promise.allSettled([
                        fetch(`${appUrl}/api/email/order-status`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: orderRef.id,
                                status: "processing",
                                email: orderData.customerDetails.email,
                                orderData: finalOrder
                            }),
                        }),
                        fetch(`${appUrl}/api/shipping/shiprocket`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: orderRef.id,
                                orderData: finalOrder
                            }),
                        })
                    ]);
                } catch (e) {
                    console.error("Webhook S2S fetch error:", e);
                }
            } else {
                // If it's not in pending, check if they already processed it via the frontend /status page
                const orderQuery = query(
                    collection(db, "orders"),
                    where("merchantTransactionId", "==", merchantTransactionId)
                );
                const orderSnapshot = await getDocs(orderQuery);

                if (!orderSnapshot.empty) {
                    // Update actual order if needed
                    const orderDoc = orderSnapshot.docs[0];
                    if (orderDoc.data().paymentStatus !== "paid") {
                        await updateDoc(doc(db, "orders", orderDoc.id), {
                            paymentStatus: "paid",
                            phonePeTransactionId: callbackResponse.payload.transactionId || merchantTransactionId,
                            updatedAt: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // Respond to PhonePe to acknowledge receipt
        return NextResponse.json({ success: true, message: "Webhook processed" });
    } catch (error) {
        console.error("PhonePe Webhook Processing Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
