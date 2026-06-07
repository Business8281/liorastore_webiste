"use client";

import { useState, useEffect } from "react";
import { collection, query, limit, orderBy, onSnapshot } from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { 
    CalendarIcon, 
    BanknotesIcon, 
    ShoppingCartIcon, 
    ArrowRightIcon, 
    ExclamationTriangleIcon,
    TagIcon,
    HomeIcon
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [lowStockItem, setLowStockItem] = useState(null);
  const [inventoryHealth, setInventoryHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rawOrders, setRawOrders] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);

  useEffect(() => {
    const ordersQ = collection(db, "orders");
    const productsQ = collection(db, "products");
    const recentOrdersQ = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));

    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
        setRawOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
        setRawProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeRecent = onSnapshot(recentOrdersQ, (snapshot) => {
        setRecentOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    });

    return () => {
        unsubscribeOrders();
        unsubscribeProducts();
        unsubscribeRecent();
    };
  }, []);

  useEffect(() => {
    if (rawOrders.length === 0 && rawProducts.length === 0 && !loading) return;

    const totalRevenue = rawOrders.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);
    setStats({
        revenue: totalRevenue,
        orders: rawOrders.length
    });

    // Calculate Last 7 Days Revenue for Chart
    const last7Days = Array(7).fill(0);
    const today = new Date();
    rawOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const diffTime = Math.abs(today - orderDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
            last7Days[6 - diffDays] += parseFloat(order.totalAmount) || 0;
        }
    });
    const maxRev = Math.max(...last7Days) || 1;
    setChartData(last7Days.map(rev => (rev / maxRev) * 80 + 20));

    // Inventory Widgets
    const lowStock = rawProducts.find(p => p.stock < 5);
    setLowStockItem(lowStock);

    const categories = {};
    rawProducts.forEach(p => {
        const cat = p.category || "Uncategorized";
        if (!categories[cat]) categories[cat] = { name: cat, count: 0, stock: 0 };
        categories[cat].count += 1;
        categories[cat].stock += (p.stock || 0);
    });
    setInventoryHealth(Object.values(categories).slice(0, 2).map(c => ({
        ...c,
        icon: c.name === "Cookware" ? TagIcon : HomeIcon,
        health: c.stock > 10 ? "Optimal" : "Monitor"
    })));
  }, [rawOrders, rawProducts]);

  return (
    <>
      {/* Header */}
      <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-headline text-4xl font-bold tracking-tight text-on-background mb-2">Morning, Curator.</h2>
          <p className="font-body text-on-surface-variant max-w-md">The editorial performance of your toxin-free collection is maintained.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container px-4 py-2 rounded-xl flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span className="font-label text-xs uppercase tracking-widest font-bold">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-8 mb-12">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-[0_12px_40px_rgba(28,27,27,0.03)] flex flex-col h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h3 className="font-headline text-2xl font-semibold">Revenue Insight</h3>
              <p className="font-body text-sm text-on-surface-variant">Performance across current editorial cycle</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-[10px] sm:text-xs font-label uppercase font-bold tracking-wider">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary-container"></span>
                <span className="text-[10px] sm:text-xs font-label uppercase font-bold tracking-wider">Orders</span>
              </div>
            </div>
          </div>
          {/* Mock Chart Visualization */}
          <div className="flex-1 flex items-end gap-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              <div className="border-b border-outline-variant/10 w-full h-0"></div>
              <div className="border-b border-outline-variant/10 w-full h-0"></div>
              <div className="border-b border-outline-variant/10 w-full h-0"></div>
              <div className="border-b border-outline-variant/10 w-full h-0"></div>
            </div>
            {chartData.map((h, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-surface-container" : "bg-primary"} rounded-t-lg relative group transition-all`} style={{height: `${h}%`}}>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-on-primary text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
 
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          <div className="bg-primary-container p-6 rounded-xl text-on-primary-container flex-1 flex flex-col justify-between">
            <div className="flex justify-between">
              <BanknotesIcon className="w-6 h-6" />
              <span className="font-label text-xs font-bold bg-white/10 px-2 py-1 rounded-full">{stats.revenue > 0 ? "+12.4%" : "0%"}</span>
            </div>
            <div>
              <p className="font-label text-xs uppercase tracking-widest opacity-70">Total Revenue</p>
              <h4 className="font-headline text-3xl font-bold">{formatPrice(stats.revenue)}</h4>
            </div>
          </div>
          <div className="bg-secondary-container p-6 rounded-xl text-on-secondary-container flex-1 flex flex-col justify-between">
            <div className="flex justify-between">
              <ShoppingCartIcon className="w-6 h-6" />
              <span className="font-label text-xs font-bold bg-black/5 px-2 py-1 rounded-full">{stats.orders > 0 ? "+4.1%" : "0%"}</span>
            </div>
            <div>
              <p className="font-label text-xs uppercase tracking-widest opacity-70">Total Orders</p>
              <h4 className="font-headline text-3xl font-bold">{stats.orders.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>
 
      {/* Recent Orders */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-[0_12px_40px_rgba(28,27,27,0.03)] border border-outline-variant/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="font-headline text-2xl font-semibold">Recent Acquisitions</h3>
            <div className="flex flex-wrap gap-4">
                 <Link href="/admin/orders" className="font-label text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-primary transition-colors flex items-center gap-1">
                    View All <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <button className="font-label text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/20 hover:border-primary pb-0.5 transition-all outline-none">Export Report</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">
                  <th className="pb-4 font-bold">Order ID</th>
                  <th className="pb-4 font-bold">Customer</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-outline-variant/10 group hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => window.location.href = '/admin/orders'}>
                    <td className="py-5 font-medium">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="py-5">{order.customerDetails?.fullName}</td>
                    <td className="py-5">
                      <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                          {order.status}
                      </span>
                    </td>
                    <td className="py-5 font-bold text-right">{formatPrice(order.totalAmount)}</td>
                  </tr>
                ))}
                {!loading && recentOrders.length === 0 && (
                  <tr>
                      <td colSpan="4" className="py-10 text-center text-on-surface-variant">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
 
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-error shadow-sm border border-outline-variant/10">
            <div className="flex items-start justify-between mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-error" />
              <span className="bg-error-container text-on-error-container text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Low Stock</span>
            </div>
            <h4 className="font-headline text-lg font-bold mb-1">{lowStockItem ? lowStockItem.title : "All Stock Optimal"}</h4>
            <p className="font-body text-xs text-on-surface-variant mb-6">
                {lowStockItem ? `Only ${lowStockItem.stock} units remaining in main warehouse.` : "No items currently below threshold."}
            </p>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
              <div className="bg-error h-full" style={{ width: lowStockItem ? `${(lowStockItem.stock / 20) * 100}%` : "0%" }}></div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <h4 className="font-headline text-xl font-bold mb-4">Inventory Health</h4>
            <div className="space-y-6">
                {inventoryHealth.length > 0 ? inventoryHealth.map((cat) => (
                    <div key={cat.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                                <cat.icon className="w-5 h-5 text-stone-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold">{cat.name}</p>
                                <p className="text-[10px] text-on-surface-variant">{(cat.stock / cat.count).toFixed(1)} avg / item</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold">{cat.health}</span>
                    </div>
                )) : (
                    <p className="text-xs text-on-surface-variant italic">Scanning collection...</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
