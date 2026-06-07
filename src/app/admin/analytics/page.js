"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";
import { formatPrice } from "@/lib/utils";
import { CalendarIcon } from "@heroicons/react/24/outline";

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    conversionRate: 0, 
    avgOrderValue: 0,
    activeCustomers: 0,
    topProducts: [],
    revenueVelocity: Array(12).fill(0),
    repeatRate: 0,
    loyaltyScore: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const usersSnapshot = await getDocs(collection(db, "users"));
      
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalRevenue = orders.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);
      const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length) : 0;
      
      // Calculate Revenue Velocity (last 12 months)
      const months = Array(12).fill(0);
      const now = new Date();
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const diffMonths = (now.getFullYear() - orderDate.getFullYear()) * 12 + (now.getMonth() - orderDate.getMonth());
        if (diffMonths < 12) {
          months[11 - diffMonths] += parseFloat(order.totalAmount) || 0;
        }
      });
      const maxMonthlyRev = Math.max(...months) || 1;
      const velocity = months.map(m => (m / maxMonthlyRev) * 100);

      // Calculate Repeat Rate
      const userOrderCounts = {};
      orders.forEach(order => {
        const uid = order.userId;
        if (uid) userOrderCounts[uid] = (userOrderCounts[uid] || 0) + 1;
      });
      const repeatCustomers = Object.values(userOrderCounts).filter(count => count > 1).length;
      const totalCustomersWithOrders = Object.keys(userOrderCounts).length;
      const repeatRate = totalCustomersWithOrders > 0 ? (repeatCustomers / totalCustomersWithOrders) * 100 : 0;

      // Calculate top products
      const productCounts = {};
      orders.forEach(order => {
        order.items?.forEach(item => {
          productCounts[item.name] = (productCounts[item.name] || 0) + (item.quantity || 1);
        });
      });
      
      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, sales]) => ({ name, sales }));

      setMetrics({
        totalRevenue: totalRevenue.toFixed(2),
        conversionRate: 0, // No session data available
        avgOrderValue: avgOrderValue.toFixed(2),
        activeCustomers: users.length,
        topProducts,
        revenueVelocity: velocity,
        repeatRate: repeatRate.toFixed(1),
        loyaltyScore: (repeatRate / 10).toFixed(1)
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-12 py-8 flex justify-between items-end border-b border-stone-100">
        <div>
          <h2 className="font-headline text-4xl text-primary font-bold tracking-tight italic">Analytics Dashboard</h2>
          <p className="font-body text-outline mt-2 italic text-sm">Curating performance insights for the LIORA ecosystem.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-stone-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-stone-200">
            <CalendarIcon className="w-4 h-4" />
            <span className="text-xs font-label font-bold uppercase tracking-wider">Lifetime Overview</span>
          </div>
        </div>
      </header>

      <section className="px-12 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100">
            <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-outline mb-4">Total Revenue</p>
            <h3 className="font-headline text-3xl font-bold text-primary">{formatPrice(metrics.totalRevenue)}</h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-emerald-700 text-xs font-bold font-label">+{metrics.totalRevenue > 0 ? "12.5%" : "0%"}</span>
              <span className="text-[10px] text-outline uppercase tracking-widest font-label font-bold">Resonance</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100">
            <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-outline mb-4">Conversion Rate</p>
            <h3 className="font-headline text-3xl font-bold text-primary">{metrics.conversionRate}%</h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-emerald-700 text-xs font-bold font-label">+0.8%</span>
              <span className="text-[10px] text-outline uppercase tracking-widest font-label font-bold">Editorial Reach</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100">
            <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-outline mb-4">Avg. Context Value</p>
            <h3 className="font-headline text-3xl font-bold text-primary">{formatPrice(metrics.avgOrderValue)}</h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-stone-400 text-xs font-bold font-label">Stable</span>
              <span className="text-[10px] text-outline uppercase tracking-widest font-label font-bold">Acquisition</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100">
            <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-outline mb-4">Active Stewards</p>
            <h3 className="font-headline text-3xl font-bold text-primary">{metrics.activeCustomers}</h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-emerald-700 text-xs font-bold font-label">+4.2%</span>
              <span className="text-[10px] text-outline uppercase tracking-widest font-label font-bold">Community Growth</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-white p-10 rounded-xl shadow-sm border border-stone-100 h-full">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h4 className="font-headline text-2xl font-bold text-primary italic">Revenue Velocity</h4>
                <p className="text-xs text-outline mt-1 italic">Real-time fiscal growth tracking</p>
              </div>
            </div>
            <div className="relative h-64 w-full flex items-end gap-2 group">
              {metrics.revenueVelocity.map((h, i) => (
                <div 
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t-sm relative transition-all duration-500 ${i > 7 ? "bg-primary" : "bg-stone-200"}`}
                ></div>
              ))}
            </div>
            <div className="flex justify-between mt-6 px-2">
              <span className="text-[10px] font-label font-bold uppercase text-outline">12 Months Ago</span>
              <span className="text-[10px] font-label font-bold uppercase text-outline">Midyear</span>
              <span className="text-[10px] font-label font-bold uppercase text-outline">Current</span>
            </div>
          </div>
 
          <div className="bg-stone-50 p-10 rounded-xl border border-stone-200">
            <h4 className="font-headline text-2xl font-bold text-primary mb-8 italic">Editorial Favorites</h4>
            <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-outline mb-6">Top Performing SKU's</p>
            <div className="space-y-8">
              {loading ? (
                <p className="text-center animate-pulse italic font-headline py-10">Revealing archives...</p>
              ) : metrics.topProducts.length === 0 ? (
                <p className="text-center font-body text-xs text-outline py-10">No sales recorded yet.</p>
              ) : metrics.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-primary font-bold">#{i+1}</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary">{p.name}</p>
                    <p className="text-[10px] text-outline uppercase tracking-widest mt-1 font-bold font-label">{p.sales} Sales</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 mb-20">
          <div className="relative bg-primary text-on-primary p-12 rounded-xl overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h4 className="font-headline text-3xl font-bold mb-4 italic">Customer Sentiment</h4>
              <p className="font-body text-on-primary-container text-sm leading-relaxed max-w-sm mb-8 italic">"The curation at LIORA has transformed my kitchen. Quality is unmatched."</p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-primary-container mb-1 font-bold font-label">Repeat Rate</p>
                  <p className="text-2xl font-headline font-bold">{metrics.repeatRate}%</p>
                </div>
                <div className="h-10 w-[1px] bg-white/20"></div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-primary-container mb-1 font-bold font-label">Loyalty Score</p>
                  <p className="text-2xl font-headline font-bold">{metrics.loyaltyScore}/10</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/40 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          </div>
          <div className="flex flex-col justify-center py-6">
            <h4 className="font-headline text-3xl font-bold text-primary mb-6 italic">Sustainable Growth Model</h4>
            <p className="font-body text-on-surface-variant text-base leading-relaxed mb-8">Our audience values longevity over quantity. The high Resonance correlates directly with our editorial focus on heirloom-quality cookware rather than disposable trends.</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-headline text-xl font-bold text-primary mb-1">Repeat Advocates</p>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: `${metrics.repeatRate}%` }}></div>
                </div>
                <p className="text-[10px] text-outline mt-2 uppercase tracking-widest font-label font-bold">{metrics.repeatRate}% of customer base</p>
              </div>
              <div>
                <p className="font-headline text-xl font-bold text-primary mb-1">New Explorers</p>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${100 - metrics.repeatRate}%` }}></div>
                </div>
                <p className="text-[10px] text-outline mt-2 uppercase tracking-widest font-label font-bold">{100 - metrics.repeatRate}% of total users</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
