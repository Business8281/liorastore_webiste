"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { 
    Squares2X2Icon, 
    ArchiveBoxIcon, 
    ShoppingBagIcon, 
    UsersIcon, 
    ChartBarIcon, 
    Cog6ToothIcon,
    UserIcon,
    TagIcon,
    GiftIcon,
    TicketIcon,
    Bars3Icon,
    XMarkIcon
} from "@heroicons/react/24/outline";

export default function AdminLayout({ children }) {
    const { isAdmin, adminData, adminLoading, adminLogout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!adminLoading) {
            // Portal access requires a valid admin session
            if (!isAdmin && pathname !== "/admin/login") {
                router.push("/admin/login");
            }
        }
    }, [isAdmin, adminLoading, pathname, router]);

    if (adminLoading) return <div className="min-h-screen flex items-center justify-center font-headline italic">Loading Editorial Portal...</div>;

    if (pathname === "/admin/login") return children;

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-headline italic text-error gap-4">
                <span>Access Restricted. Admin Session Required.</span>
                <button 
                    onClick={() => adminLogout()}
                    className="not-italic font-label text-xs uppercase tracking-widest text-on-surface bg-surface-container px-4 py-2 rounded-lg hover:bg-surface-dim transition-colors"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    const navItems = [
        { name: "Overview", icon: Squares2X2Icon, href: "/admin/dashboard" },
        { name: "Inventory", icon: ArchiveBoxIcon, href: "/admin/inventory" },
        { name: "Categories", icon: TagIcon, href: "/admin/categories" },
        { name: "Combos", icon: GiftIcon, href: "/admin/combos" },
        { name: "Coupons", icon: TicketIcon, href: "/admin/coupons" },
        { name: "Orders", icon: ShoppingBagIcon, href: "/admin/orders" },
        { name: "Customers", icon: UsersIcon, href: "/admin/customers" },
        { name: "Analytics", icon: ChartBarIcon, href: "/admin/analytics" },
        { name: "Settings", icon: Cog6ToothIcon, href: "/admin/settings" },
    ];

    return (
        <div className="flex min-h-screen bg-surface">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-stone-50 border-b border-outline-variant/10 flex items-center justify-between px-6 z-50">
                <h1 className="text-lg font-headline font-bold text-stone-900">LIORA Admin</h1>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-stone-500 hover:text-stone-900"
                >
                    {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                </button>
            </div>

            {/* Backdrop for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SideNavBar */}
            <aside className={`h-screen w-64 fixed left-0 top-0 bg-stone-50 flex flex-col py-6 space-y-2 z-[45] lg:z-40 border-r border-outline-variant/10 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-6 mb-8 pt-4 lg:pt-0">
                    <h1 className="hidden lg:block text-xl font-headline font-bold text-stone-900">LIORA Admin</h1>
                    <p className="font-label font-medium text-[10px] tracking-wide text-stone-500 uppercase mt-1">Editorial Control</p>
                </div>
                <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link 
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-lg transition-all transform duration-200 group ${pathname === item.href ? "bg-stone-200 text-stone-900 font-bold scale-95" : "text-stone-500 hover:bg-stone-100 hover:translate-x-1"}`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            <span className="font-label font-medium text-sm tracking-wide">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="px-4 mt-auto">
                    <button 
                        onClick={() => window.open("/", "_blank")}
                        className="w-full bg-primary text-on-primary py-3 rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-sm"
                    >
                        View Storefront
                    </button>
                    <div className="mt-6 flex items-center px-2 py-4 border-t border-stone-200">
                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden mr-3">
                            <UserIcon className="w-5 h-5 text-stone-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-stone-900">{adminData?.email?.split('@')[0] || "Admin"}</p>
                            <button onClick={adminLogout} className="text-[10px] text-stone-500 hover:text-primary transition-colors uppercase font-bold tracking-tighter">Sign Out</button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 lg:ml-64 bg-surface min-h-screen pb-24 pt-24 lg:pt-12 transition-all">
                {children}
            </main>

        </div>
    );
}
