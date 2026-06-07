"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, doc, setDoc, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPrice } from "@/lib/utils";
import { CreditCardIcon, BanknotesIcon, XCircleIcon, TicketIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, buyNowItem, isHydrated } = useCart();
  const { user, userData, loading: authLoading } = useAuth();

  const checkoutItems = buyNowItem ? [buyNowItem] : cart.items;
  const totalAmount = buyNowItem ? buyNowItem.price * buyNowItem.quantity : cart.totalAmount;
  const [formData, setFormData] = useState({
    fullName: user?.displayName || userData?.fullName || "",
    email: user?.email || "",
    address: userData?.address || "",
    city: userData?.city || "",
    postalCode: userData?.postalCode || "",
    phone: userData?.phone || "",
    state: userData?.state || "Telangana",
    paymentMethod: "razorpay"
  });

  const [isLocalhost, setIsLocalhost] = useState(false);

  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [publicCoupons, setPublicCoupons] = useState([]);
  const [fetchingPublic, setFetchingPublic] = useState(false);

  const discountAmount = appliedCoupon ? (totalAmount * (appliedCoupon.discountPercentage / 100)) : 0;
  const finalAmount = totalAmount - discountAmount;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalhost(
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1" || 
        process.env.NODE_ENV === "development"
      );
    }
  }, []);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) {
      setPaymentError(decodeURIComponent(error));
    }
  }, []);

  useEffect(() => {
    if (isHydrated && checkoutItems.length === 0) {
      router.push("/cart");
    }
  }, [checkoutItems, router, isHydrated]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || userData?.fullName || prev.fullName || "",
        email: user.email || prev.email || "",
        phone: userData?.phone || prev.phone || "",
        address: userData?.address || prev.address || "",
        city: userData?.city || prev.city || "",
        postalCode: userData?.postalCode || prev.postalCode || ""
      }));

      // Try to fetch latest from addresses collection if fields still empty
      const fetchLatestAddress = async () => {
        try {
          const q = query(
            collection(db, "addresses"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const addr = querySnapshot.docs[0].data();
            setFormData(prev => ({
              ...prev,
              address: prev.address || addr.street || "",
              city: prev.city || addr.city || "",
              postalCode: prev.postalCode || addr.postalCode || "",
              phone: prev.phone || addr.phone || "",
              state: prev.state || addr.state || "Telangana"
            }));
          }
        } catch (error) {
          console.error("Error fetching latest address:", error);
        }
      };
      fetchLatestAddress();
    }
  }, [user, userData]);

  // Fetch Public Coupons
  useEffect(() => {
    const fetchPublicCoupons = async () => {
      setFetchingPublic(true);
      try {
        const q = query(
          collection(db, "coupons"),
          where("visibility", "==", "public"),
          where("isActive", "==", true),
          where("isInternal", "==", false)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPublicCoupons(data);
      } catch (err) {
        console.error("Error fetching public coupons:", err);
      } finally {
        setFetchingPublic(false);
      }
    };
    fetchPublicCoupons();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const q = query(collection(db, "coupons"), where("code", "==", couponCode.trim().toUpperCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError("This coupon does not exist.");
        return;
      }

      const couponData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };

      // Validation
      if (!couponData.isActive) {
        setCouponError("This coupon is currently inactive.");
        return;
      }

      if (totalAmount < (couponData.minPurchaseAmount || 0)) {
        setCouponError(`Minimum purchase of ${formatPrice(couponData.minPurchaseAmount)} required.`);
        return;
      }

      if (couponData.targetEmails && couponData.targetEmails.length > 0) {
        const userEmail = user?.email?.toLowerCase();
        if (!userEmail || !couponData.targetEmails.includes(userEmail)) {
          setCouponError("This coupon is not valid for your account.");
          return;
        }
      }

      if (couponData.isInternal) {
        setCouponError("This coupon is reserved for internal use.");
        return;
      }

      setAppliedCoupon(couponData);
      setCouponCode("");
    } catch (error) {
      console.error("Coupon error:", error);
      setCouponError("Failed to verify coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handlePhonePePayment = async () => {
    if (!formData.fullName || !formData.email || !formData.address || !formData.city || !formData.postalCode || !formData.phone || !formData.state) {
      setPaymentError("Please provide all delivery information to complete your purchase.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    setPaymentError(null);

    try {
      const orderNumber = `L-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderRecord = {
        orderNumber,
        userId: user?.uid || "guest",
        customerDetails: formData,
        items: checkoutItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image || item.featuredImage || "",
          type: item.type || 'product',
          isCombo: item.isCombo || false,
          selectedProducts: item.selectedProducts || [],
          freeProducts: item.freeProducts || []
        })),
        totalAmount: finalAmount,
        subtotal: totalAmount,
        discountAmount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        status: "pending",
        shippingStatus: "processing",
        createdAt: new Date().toISOString()
      };

      const response = await fetch("/api/phonepe/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          customerDetails: formData,
          orderRecord: orderRecord
        }),
      });

      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate PhonePe payment");
      }
    } catch (error) {
      console.error("PhonePe error:", error);
      setPaymentError(error.message || "Payment initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (formData.paymentMethod === "phonepe" && isLocalhost) {
      return handlePhonePePayment();
    }

    if (!formData.fullName || !formData.email || !formData.address || !formData.city || !formData.postalCode || !formData.phone || !formData.state) {
      setPaymentError("Please provide all delivery information to complete your purchase.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      // 1. Create Razorpay order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount })
      });
      const orderData = await orderResponse.json();

      if (orderData.error) throw new Error(orderData.error);

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LIORA",
        description: "Home & Kitchen Essentials",
        order_id: orderData.id,
        handler: async function (response) {
          setLoading(true);
          try {
            // 1. Verify Payment Server-Side
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyResponse.json();

            if (!verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            // 2. Generate Order Record
            const orderNumber = `L-${Math.floor(100000 + Math.random() * 900000)}`;
            const orderRecord = {
              orderNumber,
              userId: user?.uid || "guest",
              customerDetails: formData,
              items: checkoutItems.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                image: item.image || item.featuredImage || "",
                type: item.type || 'product',
                isCombo: item.isCombo || false,
                selectedProducts: item.selectedProducts || [],
                freeProducts: item.freeProducts || []
              })),
              totalAmount: finalAmount,
              subtotal: totalAmount,
              discountAmount: discountAmount,
              couponCode: appliedCoupon?.code || null,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              status: "paid",
              shippingStatus: "processing",
              createdAt: new Date().toISOString()
            };

            // 3. Save to Firestore
            await addDoc(collection(db, "orders"), orderRecord);

            // 4. Update Coupon Usage Count
            if (appliedCoupon) {
              try {
                const couponRef = doc(db, "coupons", appliedCoupon.id);
                await updateDoc(couponRef, {
                  usageCount: (appliedCoupon.usageCount || 0) + 1,
                  updatedAt: serverTimestamp()
                });
              } catch (couponUpdateError) {
                console.error("Failed to increment coupon usage:", couponUpdateError);
              }
            }

            // 4. Push to Shiprocket
            try {
              const shiprocketResponse = await fetch('/api/shipping/shiprocket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: orderRecord })
              });
              const shipData = await shiprocketResponse.json();
              if (shipData.success) {
                console.log("Order synced with Shiprocket:", shipData.shiprocketOrderId);
              }
            } catch (shipError) {
              console.error("Logistics sync failed:", shipError);
              // We don't block the user if Shiprocket fails, but admin should be notified
            }

            const shippingAddress = `${orderRecord.customerDetails.address}, ${orderRecord.customerDetails.city}, ${orderRecord.customerDetails.state} - ${orderRecord.customerDetails.postalCode}`;
            const paymentMethod = "Online via Razorpay";

            // 5. Send Customer Confirmation Email
            try {
              await fetch('/api/email/order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: orderRecord.customerDetails.email,
                  status: 'confirmed',
                  customerName: orderRecord.customerDetails.fullName,
                  orderNumber: orderRecord.orderNumber,
                  items: orderRecord.items,
                  totalAmount: orderRecord.totalAmount,
                  discountAmount: orderRecord.discountAmount,
                  couponCode: orderRecord.couponCode,
                  shippingAddress,
                  paymentMethod
                })
              });
            } catch (emailError) {
              console.error("Failed to send customer confirmation email:", emailError);
            }

            // 6. Send Admin Notification Email
            try {
              await fetch('/api/email/order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@liorastore.in',
                  status: 'admin-notification',
                  customerName: orderRecord.customerDetails.fullName,
                  orderNumber: orderRecord.orderNumber,
                  items: orderRecord.items,
                  totalAmount: orderRecord.totalAmount,
                  discountAmount: orderRecord.discountAmount,
                  couponCode: orderRecord.couponCode,
                  shippingAddress,
                  paymentMethod,
                  customerDetails: {
                    email: orderRecord.customerDetails.email,
                    phone: orderRecord.customerDetails.phone,
                    address: orderRecord.customerDetails.address,
                    city: orderRecord.customerDetails.city,
                    state: orderRecord.customerDetails.state,
                    postalCode: orderRecord.customerDetails.postalCode
                  }
                })
              });
            } catch (adminEmailError) {
              console.error("Failed to send admin notification:", adminEmailError);
            }

            // 7. Update User Profile if logged in
            if (user) {
              const userDocRef = doc(db, "users", user.uid);
              await setDoc(userDocRef, {
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                phone: formData.phone,
                state: formData.state,
                updatedAt: new Date().toISOString()
              }, { merge: true });

              // Also add to addresses collection for the dashboard
              const { addAddress } = await import("@/lib/data");
              await addAddress(user.uid, {
                label: "Last Used",
                street: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                phone: formData.phone,
                state: formData.state
              });
            }

            clearCart();
            router.push(`/order-confirmation?orderId=${orderNumber}`);
          } catch (err) {
            console.error("Payment post-processing failed:", err);
            setPaymentError(err.message || "Something went wrong while processing your order.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#24331a"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay script not loaded. Please refresh the page.");
      }
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        setPaymentError(response.error.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBFA]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="font-headline italic text-primary animate-pulse">Initializing Checkout...</p>
      </div>
    );
  }

  return (
    <main className="pt-32 pb-24 max-w-[1440px] mx-auto px-6 md:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column: Checkout Details */}
        <div className="lg:col-span-7">
          <header className="mb-12">
            <h1 className="font-headline text-3xl md:text-5xl italic tracking-tight mb-4">Shipping Details</h1>
            <p className="text-on-surface-variant max-w-md text-sm md:text-base">Finalize your order.</p>
          </header>

          {paymentError && (
            <div className="mb-12 p-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-bold mb-1 uppercase tracking-widest text-[10px]">Payment Failed</p>
                <p className="opacity-80">{paymentError}</p>
                <p className="mt-2 text-[10px] uppercase font-bold tracking-tighter opacity-50">Please verify your details and try again.</p>
              </div>
            </div>
          )}

          <section className="space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Full Name</label>
                <input
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest/30 border-b border-primary px-0 py-3 focus:ring-0 focus:border-primary-container transition-colors"
                  placeholder="Full Name"
                  type="text"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Email Address</label>
                <input
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest/30 border-b border-primary px-0 py-3 focus:ring-0 focus:border-primary-container transition-colors"
                  placeholder="Email Address"
                  type="email"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Street Address</label>
                <input
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest/30 border-b border-primary px-0 py-3 focus:ring-0 focus:border-primary-container transition-colors"
                  placeholder="Street Address"
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">City</label>
                <input
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest/30 border-b border-primary px-0 py-3 focus:ring-0 focus:border-primary-container transition-colors"
                  placeholder="City"
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Postal Code</label>
                <input
                  required
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest/30 border-b border-primary px-0 py-3 focus:ring-0 focus:border-primary-container transition-colors"
                  placeholder="Postal Code"
                  type="text"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Phone Number</label>
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest/30 border-b border-primary px-0 py-3 focus:ring-0 focus:border-primary-container transition-colors"
                  placeholder="Phone Number"
                  type="tel"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">State</label>
                <select
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest/30 border-b border-primary px-0 py-3 focus:ring-0 focus:border-primary-container transition-colors outline-none"
                >
                  <option value="">Select State</option>
                  {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"].map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <section>
              <h2 className="font-headline text-3xl mb-8 italic">Payment Method</h2>
              <div className="grid grid-cols-1 gap-4">
                {isLocalhost && (
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "phonepe" }))}
                    className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${formData.paymentMethod === "phonepe" ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/20 bg-white'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl transition-colors ${formData.paymentMethod === "phonepe" ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                        <CreditCardIcon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <span className="font-label text-sm font-bold uppercase tracking-widest block">PhonePe / UPI</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Fast & Secure via PhonePe</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-4 transition-all ${formData.paymentMethod === "phonepe" ? 'border-primary bg-white' : 'border-outline-variant/20'}`}></div>
                  </button>
                )}

                <button 
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "razorpay" }))}
                  className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${formData.paymentMethod === "razorpay" ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/20 bg-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${formData.paymentMethod === "razorpay" ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      <CreditCardIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <span className="font-label text-sm font-bold uppercase tracking-widest block">Razorpay</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Cards, NetBanking, Wallets</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-4 transition-all ${formData.paymentMethod === "razorpay" ? 'border-primary bg-white' : 'border-outline-variant/20'}`}></div>
                </button>

                <p className="text-[10px] text-center text-on-surface-variant uppercase tracking-widest opacity-60">
                  Select your preferred secure payment gateway.
                </p>
              </div>
            </section>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-32 space-y-8">
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_12px_40px_rgba(28,27,27,0.05)] border border-outline-variant/10">
              <h2 className="font-headline text-3xl mb-8 italic border-b border-outline-variant/20 pb-4">Order Summary</h2>
              <div className="space-y-4 mb-8">
                {checkoutItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">{item.title} x {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-4 border-t border-outline-variant/10">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-medium">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm text-primary animate-in slide-in-from-right-2 duration-300">
                    <span className="font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
                      <TicketIcon className="w-4 h-4" />
                      Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-headline text-2xl italic">Total</span>
                  <span className="font-headline text-2xl tracking-tight">{formatPrice(finalAmount)}</span>
                </div>

                {publicCoupons.length > 0 && !appliedCoupon && (
                  <div className="mt-8 pt-6 border-t border-outline-variant/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary mb-4 font-bold flex items-center gap-2">
                      <TicketIcon className="w-4 h-4" />
                      Available Coupons
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {publicCoupons.map((pc) => (
                        <button
                          key={pc.id}
                          onClick={() => {
                            setCouponCode(pc.code);
                            // Direct application logic for smoother UX
                            const quickApply = async (code) => {
                              setCouponLoading(true);
                              setCouponError(null);
                              try {
                                const q = query(collection(db, "coupons"), where("code", "==", code.trim().toUpperCase()), limit(1));
                                const querySnapshot = await getDocs(q);
                                if (!querySnapshot.empty) {
                                  const cData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                                  if (totalAmount >= (cData.minPurchaseAmount || 0)) {
                                    setAppliedCoupon(cData);
                                    setCouponCode("");
                                  } else {
                                    setCouponError(`Min. purchase of ${formatPrice(cData.minPurchaseAmount)} required.`);
                                  }
                                }
                              } catch (err) {
                                setCouponError("Failed to apply offer.");
                              } finally {
                                setCouponLoading(false);
                              }
                            };
                            quickApply(pc.code);
                          }}
                          className="px-3 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl transition-all group text-left"
                        >
                          <p className="text-[10px] font-bold text-primary group-hover:scale-105 transition-transform">{pc.code}</p>
                          <p className="text-[8px] text-primary/70 uppercase font-bold tracking-tighter italic">{pc.discountPercentage}% OFF</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon Redemption Field */}
              <div className="mb-8 border-t border-b border-outline-variant/10 py-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Coupon Code</label>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={`flex-1 bg-stone-50 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all ${couponError ? 'ring-1 ring-red-500/50' : ''}`}
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <button
                      id="coupon-verify-btn"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {couponLoading ? "..." : "Verify"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/20 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold tracking-tight text-primary">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-primary/70 uppercase font-bold tracking-tighter">{appliedCoupon.discountPercentage}% OFF APPLIED</p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-tighter mt-2 ml-1 animate-in fade-in duration-300">
                    {couponError}
                  </p>
                )}
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-primary text-on-primary py-5 rounded-full font-bold uppercase tracking-[0.2em] text-sm hover:bg-primary-container transition-all shadow-lg active:scale-95 duration-200 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Complete Purchase"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
