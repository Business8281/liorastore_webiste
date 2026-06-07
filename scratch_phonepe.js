const crypto = require('crypto');

async function testV1(merchantId, saltKey, url) {
    console.log(`\nTesting V1 Pay at: ${url} with Merchant ID: ${merchantId}`);
    try {
        const payload = {
            merchantId: merchantId,
            merchantTransactionId: "MT1234567890",
            merchantUserId: "MUID123",
            amount: 1000,
            redirectUrl: "https://webhook.site/redirect",
            redirectMode: "REDIRECT",
            callbackUrl: "https://webhook.site/callback",
            mobileNumber: "9999999999",
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
        const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
        const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
        const checksum = sha256 + "###1";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
                "X-MERCHANT-ID": merchantId, // Sending this just in case
                "accept": "application/json",
            },
            body: JSON.stringify({ request: base64Payload })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text.substring(0, 300)}`);
    } catch (e) {
         console.error(e.message);
    }
}

async function testV2(clientId, clientSecret, url) {
    console.log(`\nTesting V2 OAuth Token at: ${url} with Client ID: ${clientId}`);
    try {
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('client_version', 'v1');
        params.append('grant_type', 'client_credentials');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text.substring(0, 300)}`);
    } catch (e) {
        console.error(e.message);
    }
}

async function runAll() {
    const saltOrSecret = "39798565-1939-41bf-a5bf-bfbb9edc3ad3";
    const oldId = "SU2604151929097372180440";
    const newId = "M230V2Y0KIYKN";

    // Test V1 Checksum with oldId
    await testV1(oldId, saltOrSecret, "https://api.phonepe.com/apis/hermes/pg/v1/pay");
    // Test V1 Checksum with newId
    await testV1(newId, saltOrSecret, "https://api.phonepe.com/apis/hermes/pg/v1/pay");

    // Test V2 OAuth token with oldId 
    await testV2(oldId, saltOrSecret, "https://api.phonepe.com/apis/pg/v1/oauth/token");
    // Test V2 OAuth token with newId
    await testV2(newId, saltOrSecret, "https://api.phonepe.com/apis/pg/v1/oauth/token");
}

runAll();
