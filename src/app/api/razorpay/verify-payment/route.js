import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing required verification fields" }, { status: 400 });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            return NextResponse.json({ success: true, message: "Payment verified successfully" });
        } else {
            console.error("Razorpay signature mismatch:", {
                expected: expectedSignature,
                received: razorpay_signature
            });
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }
    } catch (error) {
        console.error("Razorpay verification error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
