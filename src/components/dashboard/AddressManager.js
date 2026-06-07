"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
  MapPinIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { 
    addAddress, 
    updateAddress, 
    deleteAddress,
    updateProfile
} from "@/lib/data";

export default function AddressManager() {
  const { user, userData } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ label: "", street: "", city: "", state: "", postalCode: "", phone: "" });

  const statesList = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  useEffect(() => {
    if (!user) return;
    
    const addressesQuery = query(
      collection(db, "addresses"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(addressesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0));
        const dateB = new Date(b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0));
        return dateB - dateA;
      });
      setAddresses(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching addresses live:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
        if (editingAddress) {
            if (editingAddress.id === "primary") {
                await updateProfile(user.uid, {
                    address: addressForm.street,
                    city: addressForm.city,
                    state: addressForm.state,
                    postalCode: addressForm.postalCode,
                    phone: addressForm.phone,
                    fullName: userData.fullName || user.displayName || ""
                });
            } else {
                await updateAddress(editingAddress.id, addressForm);
            }
        } else {
            await addAddress(user.uid, addressForm);
        }
        setShowAddressModal(false);
        setEditingAddress(null);
        setAddressForm({ label: "", street: "", city: "", state: "", postalCode: "", phone: "" });
    } catch (error) {
        alert("Failed to save address.");
    }
  };

  const handleDeleteAddress = async (id) => {
      if (confirm("Are you sure you want to delete this address?")) {
          await deleteAddress(id);
      }
  };

  const handleEditClick = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state || "",
      postalCode: addr.postalCode,
      phone: addr.phone
    });
    setShowAddressModal(true);
  };

  if (loading) return <div className="p-12 text-center text-primary font-headline italic animate-pulse">Syncing your archives...</div>;

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end mb-8">
        <h2 className="font-headline text-3xl text-primary">Saved Workspaces</h2>
        <button 
          onClick={() => {
            setEditingAddress(null);
            setAddressForm({ label: "", street: "", city: "", state: "", postalCode: "", phone: "" });
            setShowAddressModal(true);
          }}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-stone-200 px-4 py-2 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all"
        >
          <PlusIcon className="w-3 h-3" />
          Add Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Primary Account Address (From User Doc) */}
        {userData?.address && (
          <div className="bg-stone-50 p-6 md:p-8 rounded-2xl border border-stone-200 relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-primary/10 p-3 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex gap-2">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/5 px-2 py-1 rounded-full flex items-center">Primary</span>
                <button 
                  onClick={() => {
                    setEditingAddress({ id: "primary", label: "Main Delivery Point" });
                    setAddressForm({
                        label: "Main Delivery Point",
                        street: userData.address,
                        city: userData.city,
                        state: userData.state || "",
                        postalCode: userData.postalCode,
                        phone: userData.phone
                    });
                    setShowAddressModal(true);
                  }}
                  className="p-1.5 text-stone-400 hover:text-primary transition-colors bg-white rounded-full shadow-sm border border-stone-100"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="font-bold text-sm mb-3 tracking-tight">Main Delivery Point</p>
            <div className="text-sm text-stone-500 leading-relaxed font-light space-y-1">
              <p>{userData.address}</p>
              <p>{userData.city}{userData.state ? `, ${userData.state}` : ''}, {userData.postalCode}</p>
              <p className="mt-4 pt-4 border-t border-stone-100 text-stone-400">{userData.phone}</p>
            </div>
          </div>
        )}

        {/* Saved Addresses Collection */}
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-100 relative group transition-all hover:shadow-xl hover:border-primary/20">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-primary/5 p-3 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditClick(addr)}
                  className="p-1.5 text-stone-400 hover:text-primary transition-colors bg-stone-50 rounded-full border border-stone-100"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 text-stone-400 hover:text-red-500 transition-colors bg-stone-50 rounded-full border border-stone-100"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="font-bold text-sm mb-3 tracking-tight">{addr.label}</p>
            <div className="text-sm text-stone-500 leading-relaxed font-light space-y-1">
              <p>{addr.street}</p>
              <p>{addr.city}{addr.state ? `, ${addr.state}` : ''}, {addr.postalCode}</p>
              <p className="mt-4 pt-4 border-t border-stone-50 text-stone-400">{addr.phone}</p>
            </div>
          </div>
        ))}
        
        {/* Add New Visual Card */}
        <div 
          onClick={() => {
            setEditingAddress(null);
            setAddressForm({ label: "", street: "", city: "", state: "", postalCode: "", phone: "" });
            setShowAddressModal(true);
          }}
          className="bg-stone-50/50 p-8 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-all min-h-[200px]"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-300 mb-4 shadow-sm">+</div>
          <p className="font-bold text-sm mb-1 italic">Add Workspace</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest text-center">Establish another delivery node</p>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setShowAddressModal(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-headline text-2xl text-primary">{editingAddress ? "Edit Address" : "New Address"}</h3>
              <button 
                onClick={() => setShowAddressModal(false)} 
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                 <XMarkIcon className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Label (e.g. Home, Office)</label>
                <input 
                  required
                  type="text" 
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-stone-300"
                  placeholder="Design Studio"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Street Address</label>
                <input 
                  required
                  type="text" 
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-stone-300"
                  placeholder="Street name, landmark..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">City</label>
                  <input 
                    required
                    type="text" 
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Postal Code</label>
                  <input 
                    required
                    type="text" 
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">State</label>
                <div className="relative">
                  <select
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none"
                  >
                    <option value="">Select State</option>
                    {statesList.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  placeholder="+91 00000 00000"
                />
              </div>
              <div className="sticky bottom-0 pt-4 bg-white">
                <button 
                  type="submit" 
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {editingAddress ? "Update Entry" : "Establish Point"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
