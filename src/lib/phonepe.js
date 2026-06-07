import { StandardCheckoutClient, Env } from "@phonepe-pg/pg-sdk-node";

let phonePeInstance = null;

export const getPhonePe = () => {
    if (phonePeInstance) return phonePeInstance;

    const clientId = process.env.PHONEPE_CLIENT_ID || "";
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET || "";
    const clientVersion = 1; // Standard Versioning for the SDK
    
    // Default to PRODUCTION if not specified
    const env = Env.PRODUCTION;

    console.log("Initializing PhonePe StandardCheckoutClient with:", {
        clientId: clientId ? "PRESENT" : "MISSING",
        clientSecret: clientSecret ? "PRESENT" : "MISSING",
        env: "PRODUCTION",
        clientVersion: 1
    });

    if (!clientId || !clientSecret) {
        throw new Error("PhonePe configuration missing: CLIENT_ID or CLIENT_SECRET is not defined in .env");
    }

    try {
        // StandardCheckoutClient is a Singleton in the new SDK
        phonePeInstance = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
        return phonePeInstance;
    } catch (error) {
        console.error("PhonePe SDK Constructor Error:", error);
        throw error;
    }
};

// Proxied methods to allow lazy initialization
export const phonePe = {
    // Standard Checkout V2 specific methods
    createSdkOrder: async (...args) => (await getPhonePe()).createSdkOrder(...args),
    pay: async (...args) => (await getPhonePe()).pay(...args),
    getOrderStatus: async (...args) => (await getPhonePe()).getOrderStatus(...args),
    validateCallback: async (...args) => (await getPhonePe()).validateCallback(...args),
    refund: async (...args) => (await getPhonePe()).refund(...args),
    getRefundStatus: async (...args) => (await getPhonePe()).getRefundStatus(...args)
};



