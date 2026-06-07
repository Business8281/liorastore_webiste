"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";
import { formatPrice } from "@/lib/utils";
import { MagnifyingGlassIcon, UserPlusIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

export default function AdminCustomersPage() {
  const [rawUsers, setRawUsers] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    highTier: 0
  });

  useEffect(() => {
    const usersQ = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const ordersQ = collection(db, "orders");

    const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      setRawUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
      setRawOrders(snapshot.docs.map(doc => doc.data()));
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
    };
  }, []);

  useEffect(() => {
    if (rawUsers.length === 0 && rawOrders.length === 0 && !loading) return;

    // Calculate spending per user
    const spendingMap = {};
    rawOrders.forEach(order => {
      const uid = order.userId;
      if (uid) {
        spendingMap[uid] = (spendingMap[uid] || 0) + (parseFloat(order.totalAmount) || 0);
      }
    });

    const processedCustomers = rawUsers.map(user => ({
      ...user,
      totalSpent: spendingMap[user.id] || 0
    }));

    setCustomers(processedCustomers);
    
    setMetrics({
      total: processedCustomers.length,
      active: processedCustomers.filter(u => u.lastLogin || spendingMap[u.id]).length,
      highTier: processedCustomers.filter(u => (spendingMap[u.id] || 0) > 50000).length
    });
    
    if (rawUsers.length > 0 || rawOrders.length > 0) {
        setLoading(false);
    }
  }, [rawUsers, rawOrders]);

  return (
    <>
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-8 mb-12 lg:mb-16">
        <div className="max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-headline italic tracking-tight text-on-surface mb-4">Customer Directory</h2>
          <p className="text-body text-outline max-w-md leading-relaxed">
            Curate and manage your community of toxin-free lifestyle enthusiasts. Monitor lifetime engagement and editorial resonance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input className="w-full sm:w-64 pl-10 pr-4 py-3 bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm rounded-xl transition-all outline-none" placeholder="Search by name or email" type="text"/>
          </div>
          <button className="px-8 py-3 bg-primary text-on-primary rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-900 shadow-lg transition-all">
            <UserPlusIcon className="w-5 h-5" />
            Invite Steward
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-outline-variant/10 transition-transform hover:scale-[1.01]">
          <p className="text-label text-[10px] uppercase tracking-widest text-secondary mb-2 font-bold">Total Community</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-headline italic">{metrics.total}</h3>
            <p className="text-[10px] text-green-700 font-bold flex items-center gap-1">
              <ArrowTrendingUpIcon className="w-3 h-3" />
              {metrics.total > 0 ? "+12%" : "0%"}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-outline-variant/10 transition-transform hover:scale-[1.01]">
          <p className="text-label text-[10px] uppercase tracking-widest text-secondary mb-2 font-bold">Active Stewards</p>
          <h3 className="text-3xl font-headline italic">{metrics.active}</h3>
          <p className="text-[10px] text-outline mt-2 font-bold tracking-tighter">AUTHENTICATED ACTIVITY</p>
        </div>
        <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-outline-variant/10 bg-primary/5 transition-transform hover:scale-[1.01]">
          <p className="text-label text-[10px] uppercase tracking-widest text-primary mb-2 font-bold">High-Tier Collectors</p>
          <h3 className="text-3xl font-headline italic text-primary">{metrics.highTier}</h3>
          <p className="text-[10px] text-primary/70 mt-2 font-bold tracking-tighter uppercase">Spending over {formatPrice(50000)}</p>
        </div>
      </section>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="px-6 lg:px-8 py-5 border-b border-surface-container flex justify-between items-center bg-stone-50/50">
          <h4 className="font-headline text-xl italic text-primary">Resident Roster</h4>
          <span className="hidden lg:block text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Directory Archives</span>
        </div>
        
        {/* Optimized Header (Desktop only) */}
        <div className="hidden lg:grid grid-cols-12 px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline border-b border-outline-variant/10 bg-stone-50/30">
          <div className="col-span-5">Steward Profile</div>
          <div className="col-span-2 text-center">Role</div>
          <div className="col-span-2 text-center">Patronage</div>
          <div className="col-span-3 text-right">Engagement</div>
        </div>

        <div className="divide-y divide-outline-variant/5">
          {loading ? (
            <div className="p-20 text-center text-on-surface-variant animate-pulse font-headline italic text-2xl">Scanning directory...</div>
          ) : customers.length === 0 ? (
            <div className="p-20 text-center text-on-surface-variant font-body">No community members registered yet.</div>
          ) : customers.map((customer) => (
            <div key={customer.id} className="grid grid-cols-1 lg:grid-cols-12 px-6 lg:px-8 py-6 lg:py-8 items-center hover:bg-surface-bright transition-colors group relative">
              {/* Customer Photo & Meta */}
              <div className="col-span-1 lg:col-span-5 flex items-center gap-4 lg:gap-6 mb-4 lg:mb-0">
                <div className="w-12 lg:w-16 aspect-square rounded-full bg-stone-100 overflow-hidden ring-2 ring-stone-50 shrink-0">
                  <img 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                      src={customer.photoURL || "https://lh3.googleusercontent.com/a/default-user=s96-c"} 
                      alt={customer.displayName} 
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-lg lg:text-xl font-bold text-on-surface truncate tracking-tight">{customer.displayName || "Anonymous Steward"}</p>
                  <p className="text-xs text-outline truncate font-body">{customer.email}</p>
                  {customer.phone && <p className="text-[10px] text-outline mt-0.5 tracking-widest">{customer.phone}</p>}
                </div>
              </div>

              {/* Role & Status Badge */}
              <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5">
                <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Privileges</span>
                <span className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-full border ${
                    customer.role === 'admin' 
                    ? 'bg-primary text-on-primary border-primary shadow-sm' 
                    : 'bg-stone-50 text-outline border-stone-200'
                }`}>
                    {customer.role || 'Member'}
                </span>
              </div>

              {/* Total Spending */}
              <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5 text-right lg:text-center">
                <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Patronage</span>
                <div>
                    <p className="text-lg font-headline italic font-bold text-primary">{formatPrice(customer.totalSpent || 0)}</p>
                    <p className="text-[9px] text-outline font-bold uppercase tracking-tighter">Lifetime Value</p>
                </div>
              </div>

              {/* Joined & Activity Status */}
              <div className="col-span-1 lg:col-span-3 flex justify-between lg:justify-end items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5 text-right">
                <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Activity</span>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${customer.lastLogin ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`}></span>
                        <p className="text-[10px] text-on-surface font-bold uppercase tracking-widest">
                            {customer.lastLogin ? `Online ${new Date(customer.lastLogin).toLocaleDateString()}` : "Dormant"}
                        </p>
                    </div>
                    <p className="text-[9px] text-outline font-medium">EST. {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(undefined, {month: 'short', year: 'numeric'}) : 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
