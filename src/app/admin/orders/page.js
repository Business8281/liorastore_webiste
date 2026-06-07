"use client";

import { useEffect, useState } from "react";
import { collection, query, doc, updateDoc, orderBy, onSnapshot, addDoc, getDocs, where, limit } from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";
import { formatPrice } from "@/lib/utils";
import { ArrowDownTrayIcon, MagnifyingGlassIcon, PlusIcon, XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  
  const [manualOrder, setManualOrder] = useState({
    customerDetails: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India"
    },
    items: [],
    paymentStatus: "paid",
    couponCode: "",
    appliedCoupon: null
  });
  const [manualCouponError, setManualCouponError] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, "products"));
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    if (showManualModal) {
      fetchProducts();
    }
  }, [showManualModal]);

  const handleManualItemChange = (productId, quantity) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    setManualOrder(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.id === productId);
      let newItems = [...prev.items];

      if (quantity <= 0) {
        newItems = newItems.filter(item => item.id !== productId);
      } else if (existingItemIndex > -1) {
        newItems[existingItemIndex] = { ...newItems[existingItemIndex], quantity };
      } else {
        newItems.push({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.featuredImage || "",
          quantity: quantity
        });
      }

      return { ...prev, items: newItems };
    });
  };

  const handleSaveManualOrder = async () => {
    if (!manualOrder.customerDetails.fullName || manualOrder.items.length === 0) {
      alert("Please provide customer name and add at least one item.");
      return;
    }

    setIsSaving(true);
    try {
      const subtotal = manualOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = manualOrder.appliedCoupon 
        ? (subtotal * (manualOrder.appliedCoupon.discountPercentage / 100)) 
        : 0;
      const totalAmount = subtotal - discountAmount;
      
      // Look up userId by email
      let userId = "guest";
      if (manualOrder.customerDetails.email) {
          const userQuery = query(collection(db, "users"), where("email", "==", manualOrder.customerDetails.email.toLowerCase()));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
              userId = userSnapshot.docs[0].id;
          }
      }

      const orderData = {
        ...manualOrder,
        userId,
        subtotal,
        totalAmount,
        discountAmount,
        couponCode: manualOrder.appliedCoupon?.code || null,
        status: 'processing',
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orderNumber: `#LR-M${Math.floor(1000 + Math.random() * 9000)}`
      };

      await addDoc(collection(db, "orders"), orderData);
      
      // Send Confirmation Email
      await sendNotification(orderData, 'confirmed');

      // Decrement stock for each item
      for (const item of manualOrder.items) {
        const productRef = doc(db, "products", item.id);
        const product = availableProducts.find(p => p.id === item.id);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await updateDoc(productRef, { 
            stock: newStock,
            updatedAt: new Date().toISOString()
          });
        }
      }

      setShowManualModal(false);
      setManualOrder({
        customerDetails: { fullName: "", email: "", phone: "", address: "", city: "", state: "", postalCode: "", country: "India" },
        items: [],
        paymentStatus: "paid",
        couponCode: "",
        appliedCoupon: null
      });
      setManualCouponError(null);
      alert("Manual order created successfully and inventory updated.");
    } catch (error) {
      console.error("Error saving manual order:", error);
      alert("Failed to save manual order.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendNotification = async (order, status) => {
    try {
      const shippingAddress = order.customerDetails.address ? 
        `${order.customerDetails.address}, ${order.customerDetails.city}, ${order.customerDetails.state || ''} - ${order.customerDetails.postalCode || ''}` : 
        null;

      await fetch('/api/email/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: order.customerDetails.email,
          status,
          customerName: order.customerDetails.fullName,
          orderNumber: order.orderNumber,
          items: order.items,
          totalAmount: order.totalAmount,
          discountAmount: order.discountAmount || 0,
          couponCode: order.couponCode || null,
          shippingAddress,
          paymentMethod: order.paymentMethod || 'UPI via Razorpay'
        })
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", order.id), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Restore stock if cancelled or returned
      if (newStatus === 'cancelled' || newStatus === 'returned') {
        for (const item of order.items) {
          try {
            const productRef = doc(db, "products", item.id);
            // Fetch current stock to be accurate
            const pSnap = await getDocs(query(collection(db, "products"), where("__name__", "==", item.id), limit(1)));
            if (!pSnap.empty) {
                const currentStock = pSnap.docs[0].data().stock || 0;
                await updateDoc(productRef, {
                    stock: currentStock + item.quantity,
                    updatedAt: new Date().toISOString()
                });
            }
          } catch (stockErr) {
            console.error(`Failed to restore stock for ${item.id}:`, stockErr);
          }
        }
      }

      // Send notification for the status change
      await sendNotification(order, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status in the archives.");
    }
  };

  const pushToShiprocket = async (order) => {
    try {
      const response = await fetch('/api/shipping/shiprocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 2. Update Firestore with Shiprocket references (Client-side write since server lacks admin privileges)
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          shiprocketOrderId: result.shiprocketOrderId,
          shiprocketShipmentId: result.shiprocketShipmentId,
          status: 'shipped',
          updatedAt: new Date().toISOString()
        });
        
        // Send Shipping Email
        await sendNotification(order, 'shipped');

        alert(`Success: Order ${order.orderNumber} has been synchronized with Shiprocket. Shipment ID: ${result.shiprocketShipmentId}`);
      } else {
        const detailMsg = result.details ? `\n\nDetails: ${JSON.stringify(result.details)}` : '';
        alert(`Shiprocket Error: ${result.error || 'Failed to sync artifact'}${detailMsg}`);
      }
    } catch (error) {
      console.error("Shiprocket error:", error);
      alert("Critical failure in Shiprocket synchronization.");
    }
  };

  const handleReturn = async (order) => {
    if (confirm(`Initiate return for ${order.orderNumber}?`)) {
        await handleStatusUpdate(order, 'returned');
    }
  };

  const handleRefund = async (order) => {
    if (confirm(`Issue refund for ${order.orderNumber}? This will mark the artifact as archived and refunded.`)) {
        await handleStatusUpdate(order, 'refunded');
    }
  };

  const handleReplace = async (order) => {
    if (confirm(`Initiate replacement for ${order.orderNumber}?`)) {
        await handleStatusUpdate(order, 'replaced');
    }
  };

  const handleCancel = async (order) => {
    if (confirm(`Cancel order ${order.orderNumber}? This will restore stock and mark the order as cancelled.`)) {
        await handleStatusUpdate(order, 'cancelled');
    }
  };

  const statusList = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "processing", label: "Processing" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "return_requested", label: "Return Req." },
    { id: "replacement_requested", label: "Replace Req." },
    { id: "replaced", label: "Replaced" },
    { id: "returned", label: "Returned" },
    { id: "refunded", label: "Refunded" },
    { id: "cancelled", label: "Cancelled" }
  ];

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filter === "all" || o.status === filter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      o.orderNumber?.toLowerCase().includes(searchLower) || 
      o.customerDetails?.fullName?.toLowerCase().includes(searchLower) ||
      o.customerDetails?.email?.toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-4 sm:px-0">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-headline italic tracking-tight text-primary mb-4">Order Management</h2>
          <p className="text-on-surface-variant font-body leading-relaxed max-w-lg text-sm md:text-base">
            Manage the fulfillment process for LIORA products.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button 
            onClick={() => setShowManualModal(true)}
            className="px-6 py-3 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            Create Manual Order
          </button>
          <button className="px-6 py-3 border border-outline-variant/30 text-primary font-label text-xs uppercase tracking-widest rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-2 shrink-0">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      <div className="bg-surface-container-low p-4 md:p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-outline/50 font-body outline-none" 
            placeholder="Search by name, email, or order reference..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group">
            <button 
              className="px-6 py-3 bg-white border border-outline-variant/20 rounded-xl text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-3 hover:bg-stone-50 transition-all min-w-[160px] justify-between shadow-sm"
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
            >
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                {statusList.find(s => s.id === filter)?.label || 'Filter Status'}
              </span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'status' && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setActiveDropdown(null)}></div>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 py-2 z-[101] animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 mb-1 border-b border-stone-50">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Select Lifecycle</p>
                  </div>
                  {statusList.map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => {
                        setFilter(s.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center justify-between group/item ${
                        filter === s.id ? "text-primary bg-primary/5" : "text-stone-500 hover:bg-stone-50 hover:text-primary"
                      }`}
                    >
                      {s.label}
                      {filter === s.id && <div className="w-1 h-1 rounded-full bg-primary"></div>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/10 overflow-visible">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 bg-surface-container-low border-b border-outline-variant/10 rounded-t-3xl">
          <div className="col-span-2 px-4 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-outline font-label">Ref</div>
          <div className="col-span-2 px-4 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-outline font-label">Customer</div>
          <div className="col-span-3 px-4 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-outline font-label">Product</div>
          <div className="col-span-2 px-4 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-outline font-label">Status</div>
          <div className="col-span-1 px-4 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-outline font-label text-center">Value</div>
          <div className="col-span-2 px-4 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-outline font-label text-right">Actions</div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {loading ? (
              <div className="px-8 py-10 text-center text-on-surface-variant animate-pulse font-headline italic text-2xl">Loading orders...</div>
          ) : filteredOrders.map((order) => (
              <div key={order.id} className={`grid grid-cols-1 lg:grid-cols-12 hover:bg-stone-50 transition-colors group last:rounded-b-3xl relative ${activeDropdown === order.id ? 'z-[101]' : 'z-10'}`}>
                  {/* Order Ref & Details */}
                  <div className="col-span-1 lg:col-span-2 px-4 py-6 flex lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-2">
                      <div>
                        <span className="lg:hidden text-[8px] uppercase font-bold text-outline block mb-1">Reference</span>
                        <span className="font-headline font-bold text-lg lg:text-xl text-primary">{order.orderNumber || `#LR-${order.id.slice(-4).toUpperCase()}`}</span>
                        <p className="hidden lg:block text-[10px] text-outline mt-1 font-body">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="lg:hidden">
                        <span className="text-[10px] text-outline font-body">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                  </div>

                  {/* Customer */}
                  <div className="col-span-1 lg:col-span-2 px-4 py-4 lg:py-6 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs shrink-0">
                          {order.customerDetails?.fullName?.[0] || "U"}
                      </div>
                      <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface font-body truncate">{order.customerDetails?.fullName}</p>
                          <p className="text-[10px] text-outline font-body truncate">{order.customerDetails?.city}, {order.customerDetails?.country}</p>
                      </div>
                  </div>

                  {/* Product */}
                  <div className="col-span-1 lg:col-span-3 px-4 py-4 lg:py-6 cursor-pointer border-t border-b lg:border-none border-outline-variant/5 bg-stone-50/50 lg:bg-transparent" onClick={() => setSelectedOrderForDetails(order)}>
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-surface-container rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-outline-variant/10">
                            {(order.items?.[0]?.image || order.items?.[0]?.featuredImage) ? (
                              <img 
                                src={order.items[0].image || order.items[0].featuredImage} 
                                alt={order.items[0].title} 
                                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all scale-110"
                              />
                            ) : (
                              <span className="text-[8px] uppercase tracking-tighter text-outline/40">No Img</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-on-surface truncate uppercase tracking-tight">{order.items?.[0]?.title || "Multiple Items"}</p>
                              {order.items?.length > 1 ? (
                                <p className="text-[8px] text-primary font-bold">+{order.items.length - 1} more items →</p>
                              ) : (
                                <p className="text-[8px] text-primary font-bold">Details →</p>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-2 px-4 py-4 lg:py-6 flex flex-col justify-center">
                    <div className="flex items-center justify-between lg:block">
                        <span className="lg:hidden text-[8px] uppercase font-bold text-outline">Status</span>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                            (order.status === 'processing' || order.status === 'paid') ? 'bg-secondary-container text-on-secondary-container' : 
                            order.status === 'shipped' ? 'bg-primary-fixed text-on-primary-fixed' : 
                            order.status === 'delivered' ? 'bg-primary text-on-primary' :
                            order.status === 'returned' || order.status === 'cancelled' ? 'bg-error-container text-on-error-container' :
                            'bg-stone-200 text-stone-600'
                        }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{order.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                    {order.shiprocketShipmentId && (
                        <div className="mt-2 text-right lg:text-left">
                            <p className="text-[8px] text-outline font-bold uppercase tracking-widest">SID: {order.shiprocketShipmentId}</p>
                        </div>
                    )}
                  </div>

                  {/* Value */}
                  <div className="col-span-1 lg:col-span-1 px-4 py-4 lg:py-6 flex flex-col justify-center border-t lg:border-none border-outline-variant/10">
                      <div className="flex items-center justify-between lg:block lg:text-center">
                        <span className="lg:hidden text-[8px] uppercase font-bold text-outline">Value</span>
                        <div>
                          <p className="text-sm lg:text-base font-bold text-primary font-body">{formatPrice(order.totalAmount)}</p>
                          <p className="text-[10px] text-outline font-body">{order.items.length} items</p>
                        </div>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 lg:col-span-2 px-4 py-6 flex justify-end items-center border-t lg:border-none border-outline-variant/10">
                      <div className="relative inline-block text-left w-full lg:w-auto">
                          <button 
                              onClick={() => setActiveDropdown(activeDropdown === order.id ? null : order.id)}
                              className="w-full lg:w-auto px-6 py-3 bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-stone-900 transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                              Manage
                              <ChevronDownIcon className={`w-3 h-3 transition-transform ${activeDropdown === order.id ? 'rotate-180' : ''}`} />
                          </button>
                                
                          {activeDropdown === order.id && (
                            <>
                                <div 
                                    className="fixed inset-0 z-[90]" 
                                    onClick={() => setActiveDropdown(null)}
                                ></div>
                                <div className={`absolute right-0 z-[100] w-64 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-outline-variant/10 py-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                                    // Open Upwards if it's the last few items
                                    filteredOrders.indexOf(order) > filteredOrders.length - 4 && filteredOrders.length > 4 ? 'bottom-full mb-2' : 'top-full mt-2'
                                }`}>
                                    <div className="px-5 py-2 border-b border-outline-variant/5">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-stone-400 mb-3">Select Lifecycle</p>
                                        <div className="space-y-1">
                                            <button onClick={() => { handleStatusUpdate(order, 'processing'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-stone-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all uppercase tracking-widest">Processing</button>
                                            <button onClick={() => { handleStatusUpdate(order, 'shipped'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-stone-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all uppercase tracking-widest">Shipped</button>
                                            <button onClick={() => { handleStatusUpdate(order, 'delivered'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-stone-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all uppercase tracking-widest">Delivered</button>
                                            <button onClick={() => { handleStatusUpdate(order, 'return_requested'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all uppercase tracking-widest">Return Req.</button>
                                            <button onClick={() => { handleStatusUpdate(order, 'replacement_requested'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all uppercase tracking-widest">Replace Req.</button>
                                            <button onClick={() => { handleStatusUpdate(order, 'replaced'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all uppercase tracking-widest">Replaced</button>
                                            <button onClick={() => { handleStatusUpdate(order, 'returned'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all uppercase tracking-widest">Returned</button>
                                            <button onClick={() => { handleRefund(order); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all uppercase tracking-widest">Refunded</button>
                                        </div>
                                    </div>

                                    {/* Customer Requests */}
                                    {order.customerRequest && (
                                        <div className="px-5 py-3 border-b border-outline-variant/5 bg-amber-50/50">
                                            <p className="text-[9px] uppercase tracking-widest font-black text-amber-600 mb-2 flex items-center gap-1">
                                                <ExclamationTriangleIcon className="w-3 h-3" />
                                                Customer Request
                                            </p>
                                            <div className="space-y-1">
                                                {order.customerRequest === 'return' && (
                                                    <>
                                                        <button onClick={() => { handleStatusUpdate(order, 'returned'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 rounded-lg uppercase tracking-widest transition-colors">Approve Return</button>
                                                        <button onClick={() => { handleStatusUpdate(order, 'delivered'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-lg uppercase tracking-widest transition-colors">Reject Return</button>
                                                    </>
                                                )}
                                                {order.customerRequest === 'replace' && (
                                                    <>
                                                        <button onClick={() => { handleStatusUpdate(order, 'shipped'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 rounded-lg uppercase tracking-widest transition-colors">Approve Replace</button>
                                                        <button onClick={() => { handleStatusUpdate(order, 'delivered'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-lg uppercase tracking-widest transition-colors">Reject Replace</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Actions */}
                                    <div className="px-5 py-3">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-stone-400 mb-3">Administrative</p>
                                        <div className="space-y-1">
                                            {['paid', 'processing'].includes(order.status) && (
                                                <button onClick={() => { handleStatusUpdate(order, 'cancelled'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-lg uppercase tracking-widest transition-colors">Cancel Order</button>
                                            )}
                                            {order.status === 'delivered' && (
                                                <>
                                                    <button onClick={() => { handleStatusUpdate(order, 'returned'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-[10px] font-black text-amber-600 hover:bg-amber-50 rounded-lg uppercase tracking-widest transition-colors">Manual Return</button>
                                                    <button onClick={() => { handleStatusUpdate(order, 'shipped'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-[10px] font-black text-amber-600 hover:bg-amber-50 rounded-lg uppercase tracking-widest transition-colors">Manual Replace</button>
                                                </>
                                            )}
                                            {(order.status === 'returned' || order.status === 'cancelled') && (
                                                <button onClick={() => { handleRefund(order); setActiveDropdown(null); }} className="w-full text-left px-3 py-2.5 text-[10px] font-black text-emerald-600 hover:bg-emerald-50 rounded-lg uppercase tracking-widest transition-colors">Issue Refund</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Logistics */}
                                    <div className="px-3 pt-2 pb-1 border-t border-outline-variant/5">
                                        <button 
                                            onClick={() => { pushToShiprocket(order); setActiveDropdown(null); }}
                                            className="w-full text-left px-3 py-3 text-[10px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl uppercase tracking-widest transition-all flex items-center justify-between group/sr"
                                        >
                                            Logistics (Shiprocket)
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover/sr:animate-ping"></div>
                                        </button>
                                    </div>
                                </div>
                            </>
                          )}
                      </div>
                  </div>
              </div>
          ))}
          {!loading && filteredOrders.length === 0 && (
              <div className="px-8 py-20 text-center text-on-surface-variant font-body">No orders found in this category.</div>
          )}
        </div>
      </div>

      {/* Manual Order Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-stone-50">
              <h3 className="text-2xl font-headline italic">New Manual Order</h3>
              <button onClick={() => setShowManualModal(false)} className="text-outline hover:text-primary">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Customer Details */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b border-stone-100 pb-2 mb-4">Customer Details</h4>
                <div className="space-y-4">
                  <div className="border-b border-primary/20 bg-stone-50/30 p-2 rounded-lg">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Full Name</label>
                    <input 
                      className="w-full bg-transparent border-none rounded-lg px-2 py-1 text-sm focus:ring-0 outline-none font-bold" 
                      placeholder="Steward Name"
                      value={manualOrder.customerDetails.fullName}
                      onChange={(e) => setManualOrder({...manualOrder, customerDetails: {...manualOrder.customerDetails, fullName: e.target.value}})}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-b border-primary/20 bg-stone-50/30 p-2 rounded-lg">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Email</label>
                      <input 
                        className="w-full bg-transparent border-none rounded-lg px-2 py-1 text-sm focus:ring-0 outline-none" 
                        placeholder="email@example.com"
                        value={manualOrder.customerDetails.email}
                        onChange={(e) => setManualOrder({...manualOrder, customerDetails: {...manualOrder.customerDetails, email: e.target.value}})}
                      />
                    </div>
                    <div className="border-b border-primary/20 bg-stone-50/30 p-2 rounded-lg">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Phone</label>
                      <input 
                        className="w-full bg-transparent border-none rounded-lg px-2 py-1 text-sm focus:ring-0 outline-none" 
                        placeholder="+91..."
                        value={manualOrder.customerDetails.phone}
                        onChange={(e) => setManualOrder({...manualOrder, customerDetails: {...manualOrder.customerDetails, phone: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="border-b border-primary/20 bg-stone-50/30 p-2 rounded-lg">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Shipping Address</label>
                    <textarea 
                      className="w-full bg-transparent border-none rounded-lg px-2 py-1 text-sm focus:ring-0 outline-none h-20 resize-none" 
                      placeholder="Complete street address..."
                      value={manualOrder.customerDetails.address}
                      onChange={(e) => setManualOrder({...manualOrder, customerDetails: {...manualOrder.customerDetails, address: e.target.value}})}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-b border-primary/20 bg-stone-50/30 p-2 rounded-lg">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">City</label>
                      <input 
                        className="w-full bg-transparent border-none rounded-lg px-2 py-1 text-sm focus:ring-0 outline-none" 
                        placeholder="City"
                        value={manualOrder.customerDetails.city}
                        onChange={(e) => setManualOrder({...manualOrder, customerDetails: {...manualOrder.customerDetails, city: e.target.value}})}
                      />
                    </div>
                    <div className="border-b border-primary/20 bg-stone-50/30 p-2 rounded-lg">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Postal Code</label>
                        <input 
                          className="w-full bg-transparent border-none rounded-lg px-2 py-1 text-sm focus:ring-0 outline-none" 
                          placeholder="Pincode"
                          value={manualOrder.customerDetails.postalCode}
                          onChange={(e) => setManualOrder({...manualOrder, customerDetails: {...manualOrder.customerDetails, postalCode: e.target.value}})}
                        />
                    </div>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="pt-6 border-t border-outline-variant/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-4">Discount Coupon</h4>
                  <div className="flex gap-2">
                    <input 
                      className={`flex-1 bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none uppercase font-bold ${manualCouponError ? 'ring-1 ring-error/50' : ''}`}
                      placeholder="ENTER CODE"
                      value={manualOrder.couponCode}
                      onChange={(e) => {
                        setManualOrder({...manualOrder, couponCode: e.target.value.toUpperCase()});
                        setManualCouponError(null);
                      }}
                    />
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!manualOrder.couponCode) return;
                        setValidatingCoupon(true);
                        setManualCouponError(null);
                        try {
                          const q = query(collection(db, "coupons"), where("code", "==", manualOrder.couponCode.trim().toUpperCase()), limit(1));
                          const snap = await getDocs(q);
                          if (snap.empty) {
                            setManualCouponError("Incentive not found");
                            return;
                          }
                          const cData = { id: snap.docs[0].id, ...snap.docs[0].data() };
                          if (!cData.isActive) {
                            setManualCouponError("Incentive is inactive");
                            return;
                          }
                          setManualOrder({...manualOrder, appliedCoupon: cData});
                        } catch (err) {
                          setManualCouponError("Validation failed");
                        } finally {
                          setValidatingCoupon(false);
                        }
                      }}
                      className="px-4 py-2 bg-stone-100 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-stone-200 transition-colors"
                    >
                      {validatingCoupon ? "..." : "Verify"}
                    </button>
                  </div>
                  {manualCouponError && <p className="text-[8px] text-error font-bold uppercase tracking-tighter mt-1">{manualCouponError}</p>}
                  {manualOrder.appliedCoupon && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{manualOrder.appliedCoupon.code} Applied</span>
                      </div>
                      <button 
                        onClick={() => setManualOrder({...manualOrder, appliedCoupon: null, couponCode: ""})}
                        className="text-[8px] font-bold uppercase text-error hover:underline"
                      >Remove</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Selection */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-4">Product Selection</h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {availableProducts.map(product => {
                    const selectedItem = manualOrder.items.find(item => item.id === product.id);
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
                            <img src={product.featuredImage} className="w-full h-full object-cover grayscale brightness-110" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-tight">{product.title}</p>
                            <p className="text-[10px] text-primary font-bold">{formatPrice(product.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleManualItemChange(product.id, (selectedItem?.quantity || 0) - 1)}
                            className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-on-surface hover:bg-stone-200"
                          >-</button>
                          <span className="text-[10px] font-bold w-4 text-center">{selectedItem?.quantity || 0}</span>
                          <button 
                            onClick={() => handleManualItemChange(product.id, (selectedItem?.quantity || 0) + 1)}
                            className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-on-surface hover:bg-stone-200"
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Subtotal</span>
                    <span className="text-sm font-medium">
                      {formatPrice(manualOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                    </span>
                  </div>
                  {manualOrder.appliedCoupon && (
                    <div className="flex justify-between items-center mb-4 text-emerald-600">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Incentive ({manualOrder.appliedCoupon.discountPercentage}%)</span>
                      <span className="text-sm font-bold">
                        -{formatPrice(manualOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (manualOrder.appliedCoupon.discountPercentage / 100))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4 pt-4 border-t border-outline-variant/10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Total Value</span>
                    <span className="text-xl font-headline italic text-primary">
                      {formatPrice(
                        manualOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - 
                        (manualOrder.appliedCoupon ? (manualOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (manualOrder.appliedCoupon.discountPercentage / 100)) : 0)
                      )}
                    </span>
                  </div>
                  <button 
                    onClick={handleSaveManualOrder}
                    disabled={isSaving || manualOrder.items.length === 0}
                    className="w-full py-4 bg-primary text-white rounded-xl font-label text-xs uppercase tracking-[0.2em] font-bold shadow-xl hover:bg-emerald-900 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Synchronizing..." : "Initialize Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Order Item Details Modal */}
      {selectedOrderForDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-stone-50">
                    <div>
                        <h3 className="text-2xl font-headline italic">Order Details</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-outline mt-1">{selectedOrderForDetails.orderNumber}</p>
                    </div>
                    {(selectedOrderForDetails.requestReason || selectedOrderForDetails.customerNote) && (
                        <div className="px-6 py-2 bg-amber-50 border border-amber-200 rounded-xl max-w-xs">
                            <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mb-1">Customer Reason</p>
                            <p className="text-[10px] font-bold text-primary italic">"{selectedOrderForDetails.requestReason || 'No category specified'}"</p>
                            {selectedOrderForDetails.customerNote && (
                                <p className="text-[9px] text-stone-600 mt-1 leading-tight">{selectedOrderForDetails.customerNote}</p>
                            )}
                        </div>
                    )}
                    <button onClick={() => setSelectedOrderForDetails(null)} className="text-outline hover:text-primary">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {selectedOrderForDetails.items.map((item, idx) => (
                        <div key={idx} className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-surface-container rounded-lg overflow-hidden border border-stone-100">
                                        <img src={item.image} className="w-full h-full object-cover grayscale" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary text-sm uppercase tracking-tight">{item.title}</p>
                                        <p className="text-[10px] text-outline font-body">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                                    </div>
                                </div>
                                {item.isCombo && (
                                    <span className="bg-primary text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">Combo Bundle</span>
                                )}
                            </div>

                            {/* If it's a combo, show expansion */}
                            {item.isCombo && (
                                <div className="pl-12 space-y-3">
                                    {/* Primary Items */}
                                    {item.selectedProducts?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-bold text-outline uppercase tracking-[0.2em] mb-2">Primary Components</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {item.selectedProducts.map((pId) => {
                                                    const pInfo = availableProducts.find(ap => ap.id === pId);
                                                    return (
                                                        <div key={pId} className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
                                                            {pInfo?.title || `Product (${pId.slice(-4)})`}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Free Items */}
                                    {item.freeProducts?.length > 0 && (
                                        <div className="space-y-2 mt-4 bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                                            <p className="text-[8px] font-bold text-secondary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                                <GiftIcon className="w-3 h-3" />
                                                Complimentary Gifts
                                            </p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {item.freeProducts.map((pId) => {
                                                    const pInfo = availableProducts.find(ap => ap.id === pId);
                                                    return (
                                                        <div key={pId} className="flex items-center gap-2 text-xs text-secondary font-bold">
                                                            <div className="w-1 h-1 rounded-full bg-secondary"></div>
                                                            {pInfo?.title || `Gift (${pId.slice(-4)})`}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-6 lg:p-8 border-t border-stone-100 bg-stone-50 space-y-4">
                    {selectedOrderForDetails.discountAmount > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-outline uppercase tracking-widest font-bold">
                                <span>Subtotal</span>
                                <span>{formatPrice(selectedOrderForDetails.subtotal || selectedOrderForDetails.totalAmount + selectedOrderForDetails.discountAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                                <span>Discount ({selectedOrderForDetails.couponCode})</span>
                                <span>-{formatPrice(selectedOrderForDetails.discountAmount)}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center pt-2 border-t border-stone-200/50 gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Total Settlement</span>
                        <span className="text-3xl lg:text-4xl font-headline italic font-black text-primary">{formatPrice(selectedOrderForDetails.totalAmount)}</span>
                    </div>
                </div>
            </div>
          </div>
      )}
    </>
  );
}
