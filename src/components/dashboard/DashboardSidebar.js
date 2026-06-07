"use client";

import { useAuth } from "@/context/AuthContext";
import { 
  UserIcon, 
  ShoppingBagIcon, 
  HeartIcon, 
  MapPinIcon, 
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardSidebar() {
  const { userData, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { label: "Account Overview", icon: UserIcon, href: "/dashboard" },
    { label: "Orders", icon: ShoppingBagIcon, href: "/dashboard/orders" },
    { label: "Wishlist", icon: HeartIcon, href: "/dashboard/wishlist" },
    { label: "Addresses", icon: MapPinIcon, href: "/dashboard/addresses" },
  ];

  return (
    <aside className="lg:col-span-3">
      {/* Mobile-Friendly Header */}
      <div className="mb-8 lg:mb-12">
        <h1 className="font-headline text-3xl lg:text-4xl mb-1 lg:mb-2 text-primary">
          {userData?.fullName?.split(' ')[0] || "Valued Customer"}
        </h1>
        <p className="text-stone-400 font-label uppercase tracking-widest text-[9px] lg:text-xs">
          Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
        </p>
      </div>

      {/* Responsive Navigation: Horizontal Scroll on Mobile, Vertical on Desktop */}
      <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 space-x-6 lg:space-x-0 lg:space-y-4 items-center lg:items-start border-b lg:border-none border-stone-100 lg:mb-0 mb-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 lg:gap-4 py-2 lg:py-1 text-left transition-all whitespace-nowrap border-b-2 lg:border-b-0 lg:border-l-2 lg:pl-4 -mb-[2px] lg:mb-0 ${
                isActive 
                ? "text-primary font-bold border-primary scale-105 lg:scale-100" 
                : "text-stone-400 hover:text-primary border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] lg:text-sm uppercase tracking-widest lg:tracking-wide">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Mobile-only Logout (inline with nav) */}
        <button 
          onClick={logout} 
          className="lg:hidden flex items-center gap-3 py-2 text-stone-400 hover:text-red-500 transition-colors whitespace-nowrap border-b-2 border-transparent"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest">Logout</span>
        </button>
      </nav>
      
      {/* Desktop-only Logout (at bottom) */}
      <div className="hidden lg:block mt-12 pt-10 border-t border-stone-100">
        <button 
          onClick={logout} 
          className="flex items-center gap-4 text-stone-400 hover:text-red-500 transition-colors pl-4 py-2 text-left border-l-2 border-transparent group"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm tracking-wide font-medium uppercase text-[10px] tracking-[0.2em]">Logout</span>
        </button>
      </div>
    </aside>
  );
}
