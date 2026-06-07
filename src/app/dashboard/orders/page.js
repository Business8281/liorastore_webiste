"use client";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import OrderList from "@/components/dashboard/OrderList";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timeoutId;
    if (!authLoading) {
      if (!user) {
        timeoutId = setTimeout(() => {
          router.replace("/login");
        }, 3000);
      }
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [user, authLoading, router]);

  if (authLoading || (user === null)) return <div className="min-h-screen flex items-center justify-center font-headline italic">Loading your collection...</div>;

  return (
    <main className="pt-24 pb-20 px-6 max-w-[1440px] mx-auto min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <DashboardSidebar />
        <div className="lg:col-span-9 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-12">
            <h2 className="font-headline text-3xl text-primary">Order History</h2>
            <p className="text-stone-500 text-sm italic serif-italic mt-2">
              A curated timeline of your culinary investments.
            </p>
          </div>
          <OrderList />
        </div>
      </div>
    </main>
  );
}
