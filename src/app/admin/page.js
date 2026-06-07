"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
    const router = useRouter();
    const { isAdmin, adminLoading } = useAuth();

    useEffect(() => {
        if (!adminLoading) {
            if (isAdmin) {
                router.push("/admin/dashboard");
            } else {
                router.push("/admin/login");
            }
        }
    }, [isAdmin, adminLoading, router]);

    // Show a loading state while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center font-headline italic text-stone-400">
            Redirecting to Portal...
        </div>
    );
}
