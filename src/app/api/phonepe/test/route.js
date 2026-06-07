import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req) {
    const testUrls = [];

    async function testV2Sandbox(clientId) {
        const clientSecret = "39798565-1939-41bf-a5bf-bfbb9edc3ad3";
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('client_version', 'v1');
        params.append('grant_type', 'client_credentials');

        let url = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });
            return { clientId, mode: "V2_SANDBOX", url, status: res.status, response: await res.text() };
        } catch (e) {
            return { clientId, mode: "V2_SANDBOX", url, error: e.message };
        }
    }

    async function testV1Sandbox(merchantId) {
        const saltKey = "39798565-1939-41bf-a5bf-bfbb9edc3ad3";
        const payload = {
            merchantId: merchantId, merchantTransactionId: "MT" + Date.now(),
            merchantUserId: "MUID123", amount: 1000, redirectUrl: "https://x.com",
            redirectMode: "REDIRECT", callbackUrl: "https://x.com",
            mobileNumber: "9999999999", paymentInstrument: { type: "PAY_PAGE" }
        };
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
        const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
        const checksum = crypto.createHash("sha256").update(stringToHash).digest("hex") + "###1";
        
        let url = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": checksum,
                    "accept": "application/json",
                },
                body: JSON.stringify({ request: base64Payload })
            });
            return { merchantId, mode: "V1_SANDBOX", url, status: res.status, response: await res.text() };
        } catch (e) {
             return { merchantId, mode: "V1_SANDBOX", url, error: e.message };
        }
    }

    testUrls.push(await testV2Sandbox("SU2604151929097372180440"));
    testUrls.push(await testV2Sandbox("M230V2Y0KIYKN"));
    testUrls.push(await testV1Sandbox("SU2604151929097372180440"));
    testUrls.push(await testV1Sandbox("M230V2Y0KIYKN"));

    return NextResponse.json(testUrls);
}
