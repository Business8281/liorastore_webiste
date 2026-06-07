import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    limit 
} from "firebase/firestore";
import { db } from "./firebase";

export const getProducts = async (category = null) => {
    try {
        const productsRef = collection(db, "products");
        let q = query(productsRef);
        
        if (category) {
            q = query(productsRef, where("category", "==", category));
        }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const getProductByHandle = async (handle) => {
    try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("handle", "==", handle), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const productDoc = querySnapshot.docs[0];
            return {
                id: productDoc.id,
                ...productDoc.data()
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching product by handle:", error);
        return null;
    }
};

export const getProductById = async (id) => {
    try {
        const productDoc = await getDoc(doc(db, "products", id));
        if (productDoc.exists()) {
            return {
                id: productDoc.id,
                ...productDoc.data()
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching product by id:", error);
        return null;
    }
};

// Wishlist Helpers
export const toggleWishlist = async (userId, product) => {
    try {
        const wishlistRef = collection(db, "wishlist");
        const q = query(wishlistRef, where("userId", "==", userId), where("productId", "==", product.id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Remove from wishlist
            await deleteDoc(doc(db, "wishlist", querySnapshot.docs[0].id));
            return { status: "removed" };
        } else {
            // Add to wishlist
            await addDoc(wishlistRef, {
                userId,
                productId: product.id,
                productTitle: product.title,
                productImage: product.images?.[0] || product.featuredImage || "",
                productPrice: product.price,
                productHandle: product.handle || product.id,
                createdAt: serverTimestamp()
            });
            return { status: "added" };
        }
    } catch (error) {
        console.error("Error toggling wishlist:", error);
        throw error;
    }
};

// Address Helpers
export const addAddress = async (userId, addressData) => {
    try {
        const addressesRef = collection(db, "addresses");
        await addDoc(addressesRef, {
            ...addressData,
            userId,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding address:", error);
        throw error;
    }
};

export const updateAddress = async (addressId, addressData) => {
    try {
        await updateDoc(doc(db, "addresses", addressId), {
            ...addressData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating address:", error);
        throw error;
    }
};

export const deleteAddress = async (addressId) => {
    try {
        await deleteDoc(doc(db, "addresses", addressId));
    } catch (error) {
        console.error("Error deleting address:", error);
        throw error;
    }
};

// Profile Helpers
export const updateProfile = async (userId, profileData) => {
    try {
        await updateDoc(doc(db, "users", userId), {
            ...profileData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};
