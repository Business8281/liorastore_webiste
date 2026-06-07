"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    TicketIcon,
    CheckCircleIcon,
    XCircleIcon,
    UsersIcon,
    CurrencyRupeeIcon
} from "@heroicons/react/24/outline";
import { formatPrice } from "@/lib/utils";

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        discountPercentage: 0,
        minPurchaseAmount: 0,
        isActive: true,
        targetEmails: "",
        visibility: "private",
        isInternal: false
    });

    useEffect(() => {
        const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoupons(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching coupons:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : (name === "code" ? value.toUpperCase() : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Process emails into array
            const emailArray = formData.targetEmails
                ? formData.targetEmails.split(",").map(email => email.trim().toLowerCase()).filter(Boolean)
                : [];

            const couponData = {
                code: formData.code.trim().toUpperCase(),
                discountPercentage: parseFloat(formData.discountPercentage) || 0,
                minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
                isActive: formData.isActive,
                targetEmails: emailArray,
                visibility: formData.visibility || "private",
                isInternal: formData.isInternal || false,
                updatedAt: serverTimestamp()
            };

            if (editingCoupon) {
                await updateDoc(doc(db, "coupons", editingCoupon.id), couponData);
            } else {
                couponData.createdAt = serverTimestamp();
                couponData.usageCount = 0;
                await addDoc(collection(db, "coupons"), couponData);
            }

            setShowModal(false);
            setEditingCoupon(null);
            resetForm();
        } catch (error) {
            console.error("Error saving coupon:", error);
            alert(`Failed to save coupon: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            code: "",
            discountPercentage: 0,
            minPurchaseAmount: 0,
            isActive: true,
            targetEmails: "",
            visibility: "private",
            isInternal: false
        });
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "coupons", id));
            } catch (error) {
                console.error("Error deleting coupon:", error);
                alert("Failed to delete coupon.");
            }
        }
    };

    const startEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code || "",
            discountPercentage: coupon.discountPercentage || 0,
            minPurchaseAmount: coupon.minPurchaseAmount || 0,
            isActive: coupon.isActive !== undefined ? coupon.isActive : true,
            targetEmails: coupon.targetEmails ? coupon.targetEmails.join(", ") : "",
            visibility: coupon.visibility || "private",
            isInternal: coupon.isInternal || false
        });
        setShowModal(true);
    };

    const toggleStatus = async (coupon) => {
        try {
            await updateDoc(doc(db, "coupons", coupon.id), {
                isActive: !coupon.isActive,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const metrics = {
        total: coupons.length,
        active: coupons.filter(c => c.isActive).length,
        totalUsage: coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0)
    };

    return (
        <>
            <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-headline italic text-on-surface">Manage Coupons</h2>
                    <p className="text-on-surface-variant font-body mt-2">Manage bespoke discounts and customer appreciation rewards.</p>
                </div>
                <button
                    onClick={() => { setEditingCoupon(null); resetForm(); setShowModal(true); }}
                    className="w-full md:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-label text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Coupon
                </button>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-12">
                <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-outline-variant/10">
                    <p className="text-label text-[10px] uppercase tracking-widest text-secondary mb-2 font-bold">Total Coupons</p>
                    <h3 className="text-3xl font-headline">{metrics.total}</h3>
                </div>
                <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-outline-variant/10">
                    <p className="text-label text-[10px] uppercase tracking-widest text-primary mb-2 font-bold">Active Vouchers</p>
                    <h3 className="text-3xl font-headline">{metrics.active}</h3>
                </div>
                <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-outline-variant/10">
                    <p className="text-label text-[10px] uppercase tracking-widest text-emerald-600 mb-2 font-bold">Total Redemptions</p>
                    <h3 className="text-3xl font-headline">{metrics.totalUsage}</h3>
                </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden lg:grid grid-cols-12 px-6 py-4 text-xs font-label uppercase tracking-widest text-outline border-b border-outline-variant/20 bg-stone-50">
                    <div className="col-span-4">Coupon Details</div>
                    <div className="col-span-2 text-center">Discount</div>
                    <div className="col-span-2 text-center">Min. Purchase</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-on-surface-variant animate-pulse font-headline italic text-xl">Retrieving vouchers...</div>
                ) : (
                    <div className="divide-y divide-outline-variant/10">
                        {coupons.map((coupon) => (
                            <div key={coupon.id} className="grid grid-cols-1 lg:grid-cols-12 px-6 py-6 lg:py-7 items-center hover:bg-surface-bright transition-colors group relative">
                                {/* Coupon Details */}
                                <div className="col-span-1 lg:col-span-4 mb-4 lg:mb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/5 rounded-xl shrink-0">
                                            <TicketIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xl text-on-surface font-black tracking-tight uppercase">{coupon.code}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {coupon.visibility === "public" ? (
                                                    <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Public</span>
                                                ) : (
                                                    <span className="text-[8px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Private</span>
                                                )}
                                                {coupon.isInternal && (
                                                    <span className="text-[8px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-amber-100">Internal</span>
                                                )}
                                                {coupon.targetEmails && coupon.targetEmails.length > 0 && (
                                                    <span className="text-[8px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <UsersIcon className="w-2.5 h-2.5" />
                                                        {coupon.targetEmails.length} Targeted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Discount */}
                                <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5">
                                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Discount</span>
                                    <span className="text-2xl font-headline text-primary italic font-bold">{coupon.discountPercentage}% OFF</span>
                                </div>

                                {/* Min Purchase */}
                                <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5">
                                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Min. Spend</span>
                                    <span className="text-sm font-body text-on-surface-variant font-bold">
                                        {coupon.minPurchaseAmount > 0 ? formatPrice(coupon.minPurchaseAmount) : "Any Amount"}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5">
                                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Current Status</span>
                                    <button
                                        onClick={() => toggleStatus(coupon)}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest border transition-all ${coupon.isActive
                                            ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                                            : "bg-stone-100 text-stone-500 border-stone-200"
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-green-500 animate-pulse' : 'bg-stone-400'}`}></div>
                                        {coupon.isActive ? "Live" : "Inactive"}
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 lg:col-span-2 flex justify-end gap-2 lg:gap-3 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-none border-outline-variant/10 text-outline">
                                    <button 
                                        onClick={() => startEdit(coupon)} 
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 lg:p-2.5 bg-stone-50 lg:bg-transparent rounded-xl hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                        <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest">Edit Details</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(coupon.id)} 
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 lg:p-2.5 bg-red-50 lg:bg-transparent rounded-xl hover:text-error hover:bg-error/5 transition-all text-red-400"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                        <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest">Delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {coupons.length === 0 && (
                            <div className="p-20 text-center text-on-surface-variant font-headline italic text-xl">No coupons curated. Launch your first incentive!</div>
                        )}
                    </div>
                )}
            </section>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-primary/10 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 lg:p-8 border-b border-outline-variant/10 flex justify-between items-center bg-stone-50 shrink-0">
                            <div>
                                <h3 className="text-xl lg:text-2xl font-headline italic text-primary">{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</h3>
                                <p className="text-[10px] text-outline font-label uppercase tracking-widest mt-1">Configure your promotional strategies</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-outline hover:text-primary transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-8 overflow-y-auto flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="border-b border-primary/20 group focus-within:border-primary transition-colors">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Coupon Code</label>
                                        <input
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-transparent py-2 focus:ring-0 outline-none font-black text-xl lg:text-2xl"
                                            placeholder="e.g. LIORA20"
                                        />
                                    </div>
                                    <div className="border-b border-primary/20 group focus-within:border-primary transition-colors">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Discount (%)</label>
                                        <div className="flex items-center">
                                            <input
                                                name="discountPercentage"
                                                type="number"
                                                value={formData.discountPercentage}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-transparent py-2 focus:ring-0 outline-none font-headline italic text-2xl text-primary"
                                                placeholder="20"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-2xl font-headline italic text-primary">%</span>
                                        </div>
                                    </div>
                                    <div className="border-b border-primary/20 group focus-within:border-primary transition-colors">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Min. Purchase Amount</label>
                                        <div className="flex items-center gap-2">
                                            <CurrencyRupeeIcon className="w-5 h-5 text-outline" />
                                            <input
                                                name="minPurchaseAmount"
                                                type="number"
                                                value={formData.minPurchaseAmount}
                                                onChange={handleInputChange}
                                                className="w-full bg-transparent py-2 focus:ring-0 outline-none font-bold"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="border-b border-primary/20 group focus-within:border-primary transition-colors">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Target Customers (Optional)</label>
                                        <textarea
                                            name="targetEmails"
                                            value={formData.targetEmails}
                                            onChange={handleInputChange}
                                            className="w-full bg-transparent py-2 focus:ring-0 outline-none font-body text-sm resize-none h-24"
                                            placeholder="customer1@email.com, customer2@email.com"
                                        />
                                        <p className="text-[9px] text-outline italic mt-1 leading-tight">Separate emails with commas. Leave empty for all customers.</p>
                                    </div>
                                    <div className="p-4 bg-stone-50 rounded-xl border border-outline-variant/10 space-y-4 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${formData.isActive ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-500'}`}>
                                                    {formData.isActive ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-widest">Coupon Status</p>
                                                    <p className="text-[10px] text-outline italic">{formData.isActive ? "Ready for use" : "Deactivated"}</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={formData.isActive}
                                                    onChange={handleInputChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="border-t border-outline-variant/10 pt-4">
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Visibility Type</label>
                                            <div className="flex gap-2">
                                                {["private", "public"].map((v) => (
                                                    <button
                                                        key={v}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, visibility: v})}
                                                        className={`flex-1 py-2.5 rounded-lg text-[9px] uppercase font-black tracking-widest transition-all border ${formData.visibility === v ? 'bg-primary text-on-primary border-primary shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
                                                    >
                                                        {v}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="border-t border-outline-variant/10 pt-4 flex items-center justify-between">
                                            <div className="min-w-0 pr-4">
                                                <p className="text-xs font-bold uppercase tracking-widest">Internal Use</p>
                                                <p className="text-[10px] text-outline italic truncate">{formData.isInternal ? "Admin Dashboard Only" : "Universal Checkout"}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input
                                                    type="checkbox"
                                                    name="isInternal"
                                                    checked={formData.isInternal}
                                                    onChange={handleInputChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row justify-end gap-4 lg:gap-6 items-center">
                                <button type="button" onClick={() => setShowModal(false)} className="order-2 sm:order-1 w-full sm:w-auto px-6 py-3 font-label text-[10px] uppercase tracking-widest font-black text-outline hover:text-primary transition-colors">Rescind changes</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="order-1 sm:order-2 w-full sm:w-auto px-12 py-4 bg-primary text-on-primary rounded-xl font-label text-sm uppercase tracking-widest font-black shadow-xl hover:bg-stone-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                                >
                                    {saving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Archiving...
                                        </>
                                    ) : (
                                        <>
                                            {editingCoupon ? "Apply Artifact Changes" : "Forge New Coupon"}
                                            <TicketIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
