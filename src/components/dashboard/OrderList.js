"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { 
  ShoppingBagIcon, 
  ChevronRightIcon,
  XMarkIcon,
  ArrowPathRoundedSquareIcon,
  BackspaceIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import ReviewModal from "./ReviewModal";

export default function OrderList({ showOnlyActive = false }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'cancelled', 'return_requested', 'replacement_requested'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [userReviews, setUserReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);

  const reasons = {
    cancelled: [
      "Mistake in order details",
      "Found a better alternative",
      "Shipping timeframe is too long",
      "Change of mind / No longer required",
      "Other"
    ],
    return_requested: [
      "Damaged on arrival",
      "Quality doesn't meet expectations",
      "Received the wrong product",
      "Defective tool/craftsmanship",
      "Other"
    ],
    replacement_requested: [
      "Incorrect size/dimensions",
      "Damaged during transit",
      "Technical issue/Manufacturing defect",
      "Wrong variant delivered",
      "Other"
    ]
  };

  useEffect(() => {
    if (!user) return;
    
    const ordersQuery = query(
      collection(db, "orders"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid composite index requirements
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setOrders(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders live:", error);
      setLoading(false);
    });

    // Fetch user reviews to check which items can be reviewed
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("userId", "==", user.uid)
    );
    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
      setUserReviews(snapshot.docs.map(doc => doc.data().productId));
    });

    return () => {
      unsubscribe();
      unsubReviews();
    };
  }, [user]);

  const handleOpenReasonModal = (order, type) => {
    setSelectedOrder(order);
    setModalType(type);
    setReason(reasons[type][0]); // Default to first reason
    setNote("");
    setShowReasonModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !modalType) return;
    
    setUpdatingId(selectedOrder.id);
    setShowReasonModal(false);
    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      await updateDoc(orderRef, {
        status: modalType,
        requestReason: reason,
        customerNote: note,
        updatedAt: new Date().toISOString()
      });

      // Send notification to customer
      await fetch('/api/email/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          status: modalType,
          customerName: selectedOrder.customerDetails?.fullName || user.displayName || 'Valued Customer',
          orderNumber: selectedOrder.orderNumber,
          items: selectedOrder.items,
          totalAmount: selectedOrder.totalAmount,
          discountAmount: selectedOrder.discountAmount || 0,
          couponCode: selectedOrder.couponCode || null,
          shippingAddress: selectedOrder.customerDetails?.address ? `${selectedOrder.customerDetails.address}, ${selectedOrder.customerDetails.city}` : null,
          paymentMethod: selectedOrder.paymentMethod || 'Razorpay',
          requestReason: reason,
          customerNote: note
        })
      });

      // Send alert to Admin
      await fetch('/api/email/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@liorastore.in',
          status: 'admin-notification', // Using existing admin-notification logic
          customerName: selectedOrder.customerDetails?.fullName || user.displayName || 'Valued Customer',
          orderNumber: `${selectedOrder.orderNumber} - [${modalType.toUpperCase()} REQUEST]`,
          items: selectedOrder.items,
          totalAmount: selectedOrder.totalAmount,
          customerDetails: {
            email: user.email,
            phone: selectedOrder.customerDetails?.phone || 'N/A',
            note: `REASON: ${reason} | MSG: ${note}`
          }
        })
      });

      alert(`Your request for ${modalType.replace('_', ' ')} has been submitted.`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Please try again.");
    } finally {
      setUpdatingId(null);
      setSelectedOrder(null);
      setModalType(null);
    }
  };

  const handleOpenReviewModal = (product) => {
    setReviewProduct(product);
    setShowReviewModal(true);
  };

  const onReviewSubmitted = (productId) => {
    setUserReviews(prev => [...prev, productId]);
  };

  if (loading) return <div className="p-12 text-center text-primary font-headline italic animate-pulse">Loading orders...</div>;

  const activeOrder = orders.find(o => !["delivered", "returned", "refunded", "replaced", "cancelled"].includes(o.status));
  const displayOrders = showOnlyActive ? (activeOrder ? [activeOrder] : []) : orders;

  if (displayOrders.length === 0) {
    return (
      <div className="p-12 text-center text-on-surface-variant italic serif-italic bg-surface-container-low rounded-2xl">
        {showOnlyActive ? "No active orders at the moment." : "You haven't placed any orders yet."}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Active Order Highlight */}
      {!showOnlyActive && activeOrder && (
        <section className="bg-primary/5 p-8 rounded-2xl border border-primary/10">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl text-primary flex items-center gap-3">
                <ShoppingBagIcon className="w-5 h-5" />
                Active Order Tracking
              </h3>
              {/* Cancel Button only for specific statuses */}
              {(activeOrder.status === 'paid' || activeOrder.status === 'processing' || activeOrder.status === 'shipped') && (
                <button 
                  onClick={() => handleOpenReasonModal(activeOrder, 'cancelled')}
                  disabled={updatingId === activeOrder.id}
                  className="text-[10px] uppercase tracking-widest font-bold text-red-600 hover:text-red-800 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel Order
                </button>
              )}
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl p-2 shadow-sm flex items-center justify-center overflow-hidden border border-stone-100">
                 <img 
                  src={(activeOrder.items?.[0]?.image || activeOrder.items?.[0]?.featuredImage)} 
                  className="w-full h-full object-contain grayscale" 
                  alt="Order item" 
                />
              </div>
              <div className="flex-1 w-full sm:w-auto">
                 <div className="flex justify-between items-start mb-1">
                   <p className="font-bold text-sm tracking-tight">{activeOrder.orderNumber || `#LR-${activeOrder.id.slice(-6).toUpperCase()}`}</p>
                   <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{activeOrder.status.replace('_', ' ')}</p>
                 </div>
                 <div className="h-1 bg-stone-200 rounded-full overflow-hidden mt-3">
                   <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ 
                      width: activeOrder.status === 'processing' ? '40%' : 
                             activeOrder.status === 'shipped' ? '75%' : 
                             activeOrder.status === 'paid' ? '15%' : '5%' 
                    }}
                  ></div>
                </div>
              </div>
           </div>
        </section>
      )}

      {/* Main Order List */}
      <div className="space-y-4">
        {displayOrders.map((order) => {
          const isMainActive = order.id === activeOrder?.id && !showOnlyActive;
          if (isMainActive) return null; // Skip if already shown as highlight

          return (
            <div key={order.id} className="group bg-surface-container-low p-4 sm:p-6 rounded-2xl space-y-4 sm:space-y-6 hover:bg-surface-container transition-colors border border-stone-100/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-stone-200/50 relative">
                    {(order.items?.[0]?.image || order.items?.[0]?.featuredImage) ? (
                      <img 
                          src={order.items[0].image || order.items[0].featuredImage} 
                          alt={order.items[0].title} 
                          className="w-full h-full object-contain grayscale transition-transform duration-500 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 italic text-[10px] text-stone-400">No Image</div>
                    )}
                    {order.items?.[0]?.isCombo && (
                      <span className="absolute bottom-1 right-1 bg-primary text-white text-[6px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm shadow-sm">Bundle</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight leading-tight">{order.items?.[0]?.title || "Liora Product"}</p>
                    <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-widest">{order.orderNumber || `#LR-${order.id.slice(-5).toUpperCase()}`} • {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto pt-2 md:pt-0 border-t md:border-none border-stone-100">
                  <div className="flex flex-col items-start md:items-end">
                    <span className={`px-2.5 py-0.5 text-[9px] font-label uppercase tracking-widest rounded-full mb-1 ${
                      order.status === 'delivered' ? 'bg-stone-200 text-stone-600' : 
                      ['returned', 'refunded', 'cancelled'].includes(order.status) ? 'bg-red-50 text-red-600' :
                      ['return_requested', 'replacement_requested'].includes(order.status) ? 'bg-amber-50 text-amber-600' :
                      'bg-primary text-on-primary shadow-sm'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                       <p className="font-bold text-sm tracking-tight">{formatPrice(order.totalAmount)}</p>
                       {order.discountAmount > 0 && (
                         <p className="text-[9px] text-primary font-bold uppercase tracking-tighter">Saved {formatPrice(order.discountAmount)}</p>
                       )}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-stone-400 group-hover:text-primary transition-colors hidden md:block" />
                </div>
              </div>

              {/* Action Buttons for Delivered Orders */}
              {order.status === 'delivered' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-stone-200/50">
                  <button 
                    onClick={() => handleOpenReasonModal(order, 'return_requested')}
                    disabled={updatingId === order.id}
                    className="flex-1 min-w-[120px] py-3 bg-white border border-stone-200 text-[10px] uppercase tracking-widest font-bold text-stone-600 rounded-xl hover:border-red-200 hover:text-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    <BackspaceIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Request</span> Return
                  </button>
                  <button 
                    onClick={() => handleOpenReasonModal(order, 'replacement_requested')}
                    disabled={updatingId === order.id}
                    className="flex-1 min-w-[120px] py-3 bg-white border border-stone-200 text-[10px] uppercase tracking-widest font-bold text-stone-600 rounded-xl hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Request</span> Replace
                  </button>
                  {order.items?.map((item, idx) => {
                    const productId = item.id || item.productId;
                    const alreadyReviewed = userReviews.includes(productId);
                    if (alreadyReviewed) {
                      return (
                        <div key={productId || idx} className="flex-1 min-w-[120px] py-3 bg-stone-50 border border-stone-100 text-[10px] uppercase tracking-widest font-bold text-stone-400 rounded-xl flex items-center justify-center gap-2 cursor-default">
                          <StarIcon className="w-4 h-4 fill-secondary text-secondary" />
                          Reviewed {order.items.length > 1 ? `(${item.title.split(' ')[0]})` : ''}
                        </div>
                      );
                    }
                    return (
                      <button 
                        key={productId || idx}
                        onClick={() => handleOpenReviewModal(item)}
                        className="flex-1 min-w-[120px] py-3 bg-secondary text-white text-[10px] uppercase tracking-widest font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/10"
                      >
                        <StarIcon className="w-4 h-4" />
                        Review {order.items.length > 1 ? (item.title.length > 10 ? item.title.substring(0, 10) + '...' : item.title) : 'Item'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Cancel Button for other active orders */}
              {(order.status === 'paid' || order.status === 'processing' || order.status === 'shipped') && (
                <div className="flex gap-4 pt-4 border-t border-stone-200/50">
                  <button 
                    onClick={() => handleOpenReasonModal(order, 'cancelled')}
                    disabled={updatingId === order.id}
                    className="flex-1 py-3 bg-red-50 text-[10px] uppercase tracking-widest font-bold text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reason Selection Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-headline italic tracking-tight text-primary capitalize">
                    {modalType.replace('_', ' ')}
                  </h3>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Please provide a reason to continue</p>
                </div>
                <button onClick={() => setShowReasonModal(false)} className="p-1 hover:bg-stone-100 rounded-full transition-colors">
                  <XMarkIcon className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Select Motif</label>
                  <div className="grid grid-cols-1 gap-2">
                    {reasons[modalType].map((r) => (
                      <button 
                        key={r}
                        onClick={() => setReason(r)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                          reason === r ? 'bg-primary text-white border-primary' : 'bg-stone-50 text-stone-600 border-stone-100 hover:bg-stone-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Additional Details (Optional)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Provide any context that might help our curation team..."
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-primary/20 outline-none h-24 resize-none transition-all placeholder:italic placeholder:text-stone-400"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleStatusUpdate}
                    className="w-full py-4 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-900 transition-all shadow-lg hover:shadow-primary/20"
                  >
                    Confirm {modalType.split('_')[0]}
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
      {/* Review Modal */}
      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        product={reviewProduct}
        user={user}
        onReviewSubmitted={onReviewSubmitted}
      />
    </div>
  );
}
