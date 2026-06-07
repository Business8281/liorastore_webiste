import { NextResponse } from "next/server";
import { phonePe } from "@/lib/phonepe";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const refundId = searchParams.get("id");

        if (!refundId) {
            return NextResponse.json({ success: false, error: "Missing required fields: id (refundId)" }, { status: 400 });
        }

        const statusResponse = await phonePe.getRefundStatus(refundId);
        console.log("PhonePe SDK Refund Status Response:", statusResponse);

        const state = statusResponse?.state || statusResponse?.data?.state;
        const code = statusResponse?.code;

        // If the API call to PhonePe was successful generally
        if (statusResponse.success || state === "COMPLETED" || state === "SUCCESS" || state === "PENDING" || state === "FAILED") {
            // Update Firestore if we tracked it
            try {
                const refundQuery = query(
                    collection(db, "refunds"),
                    where("refundId", "==", refundId)
                );
                const querySnapshot = await getDocs(refundQuery);

                if (!querySnapshot.empty) {
                    const refundDoc = querySnapshot.docs[0];
                    await updateDoc(doc(db, "refunds", refundDoc.id), {
                        status: (state || "unknown").toLowerCase(),
                        updatedAt: new Date().toISOString(),
                        phonePeCode: code || ""
                    });
                }
            } catch (dbError) {
                console.error("Firestore Error updating refund record:", dbError);
            }

            return NextResponse.json({
                success: true,
                state: state,
                details: statusResponse
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                error: statusResponse?.message || "Failed to fetch refund status",
                details: statusResponse 
            }, { status: 400 });
        }
    } catch (error) {
        console.error("PhonePe SDK Refund Status error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
