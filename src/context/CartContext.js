"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [], totalAmount: 0, totalQuantity: 0 });
    const [buyNowItem, setBuyNowItem] = useState(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from local storage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem("liora_cart");
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
            const savedBuyNow = sessionStorage.getItem("liora_buy_now");
            if (savedBuyNow) {
                setBuyNowItem(JSON.parse(savedBuyNow));
            }
        } catch (error) {
            console.error("Cart hydration failed:", error);
        } finally {
            setIsHydrated(true);
        }
    }, []);

    // Save cart to local storage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("liora_cart", JSON.stringify(cart));
        }
    }, [cart, isHydrated]);

    const addToCart = (product, quantity = 1) => {
        setCart((prevCart) => {
            const existingItemIndex = prevCart.items.findIndex((item) => item.id === product.id);
            let newItems = [...prevCart.items];

            if (existingItemIndex > -1) {
                newItems[existingItemIndex].quantity += quantity;
            } else {
                newItems.push({ 
                    ...product, 
                    quantity,
                    image: product.image || product.featuredImage || product.productImage || (product.images && product.images[0])
                });
            }

            const totalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            return { items: newItems, totalQuantity, totalAmount };
        });
        
        // Auto-open sidebar
        setIsCartOpen(true);
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => {
            const newItems = prevCart.items.filter((item) => item.id !== productId);
            const totalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            return { items: newItems, totalQuantity, totalAmount };
        });
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return removeFromCart(productId);

        setCart((prevCart) => {
            const newItems = prevCart.items.map((item) => 
                item.id === productId ? { ...item, quantity } : item
            );
            const totalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            return { items: newItems, totalQuantity, totalAmount };
        });
    };

    const clearCart = () => {
        setCart({ items: [], totalAmount: 0, totalQuantity: 0 });
        handleSetBuyNowItem(null);
    };

    const handleSetBuyNowItem = (item) => {
        setBuyNowItem(item);
        if (item) {
            sessionStorage.setItem("liora_buy_now", JSON.stringify(item));
        } else {
            sessionStorage.removeItem("liora_buy_now");
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, buyNowItem, setBuyNowItem: handleSetBuyNowItem, isHydrated, isCartOpen, setIsCartOpen }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
