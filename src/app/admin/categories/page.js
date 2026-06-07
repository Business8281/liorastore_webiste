"use client";

import { useEffect, useState } from "react";
import { collection, query, addDoc, deleteDoc, doc, updateDoc, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
    PlusIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    XMarkIcon,
    Bars3Icon
} from "@heroicons/react/24/outline";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [legacyCategories, setLegacyCategories] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productDocs = snapshot.docs.map(doc => doc.data());
      const uniqueProductCats = [...new Set(productDocs.map(p => p.category))].filter(Boolean);
      setLegacyCategories(uniqueProductCats);
    });
    return () => unsubscribe();
  }, []);

  const syncCategories = async (specificCat = null) => {
    setIsSyncing(true);
    try {
        const managedNames = new Set(categories.map(c => c.name.toLowerCase()));
        const missing = specificCat 
            ? [specificCat] 
            : legacyCategories.filter(cat => !managedNames.has(cat.toLowerCase()));
        
        if (missing.length === 0) {
            if (!specificCat) alert("All categories are already managed.");
            return;
        }

        let addedCount = 0;
        const namesRecentlyAdded = new Set();
        
        for (let i = 0; i < missing.length; i++) {
            const catName = missing[i];
            const lowerName = catName.toLowerCase();
            
            // Re-check against current state AND what we just added in this loop
            if (managedNames.has(lowerName) || namesRecentlyAdded.has(lowerName)) continue;

            const slug = lowerName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            await addDoc(collection(db, "categories"), {
                name: catName,
                slug: slug,
                order: categories.length + addedCount,
                description: "Imported legacy category.",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            namesRecentlyAdded.add(lowerName);
            addedCount++;
        }
        if (addedCount > 0) {
            alert(`Successfully synced ${addedCount} categories.`);
        }
    } catch (error) {
        console.error("Sync error:", error);
        alert("Failed to sync categories.");
    } finally {
        setIsSyncing(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!confirm("This will permanently delete duplicate category documents from your database. Proceed?")) return;
    setIsCleaning(true);
    try {
        const nameGroups = {};
        categories.forEach(cat => {
            const name = cat.name.toLowerCase();
            if (!nameGroups[name]) nameGroups[name] = [];
            nameGroups[name].push(cat.id);
        });

        let deletedCount = 0;
        for (const name in nameGroups) {
            const ids = nameGroups[name];
            if (ids.length > 1) {
                // Keep the first one, delete the rest
                const idsToDelete = ids.slice(1);
                for (const id of idsToDelete) {
                    await deleteDoc(doc(db, "categories", id));
                    deletedCount++;
                }
            }
        }
        alert(`Database cleaned! Removed ${deletedCount} duplicate documents.`);
    } catch (error) {
        console.error("Cleanup error:", error);
        alert("Failed to cleanup duplicates.");
    } finally {
        setIsCleaning(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        if (name === "name" && !editingCategory) {
            newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const categoryData = {
            ...formData,
            order: parseInt(formData.order) || 0,
            updatedAt: serverTimestamp()
        };

        if (editingCategory) {
            await updateDoc(doc(db, "categories", editingCategory.id), categoryData);
        } else {
            categoryData.createdAt = serverTimestamp();
            await addDoc(collection(db, "categories"), categoryData);
        }
        
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: "", slug: "", description: "", order: 0 });
    } catch (error) {
        console.error("Error saving category:", error);
        alert(`Failed to save category: ${error.message}`);
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this category? Products assigned to this category will remain as they are but the category will no longer show in filters unless manually updated.")) {
        try {
            await deleteDoc(doc(db, "categories", id));
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Failed to delete category.");
        }
    }
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        order: category.order || 0
    });
    setShowModal(true);
  };

  const { isSystemAdmin } = useAuth(); // Assume useAuth provides this based on context

  return (
    <>
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-headline italic text-on-surface">Categories</h2>
          <p className="text-on-surface-variant font-body mt-2">Organize your curation for seamless discovery.</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={cleanupDuplicates}
                disabled={isCleaning || categories.length <= 1}
                className="text-error/60 hover:text-error px-4 py-2 rounded-xl font-label text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-30"
            >
                {isCleaning ? "Cleaning..." : "Clear DB Duplicates"}
            </button>
            {legacyCategories.some(cat => !categories.map(c => c.name.toLowerCase()).includes(cat.toLowerCase())) && (
                <button 
                    onClick={syncCategories}
                    disabled={isSyncing}
                    className="bg-secondary text-on-secondary px-6 py-4 rounded-xl font-label text-sm uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all border border-secondary/20 shadow-sm disabled:opacity-50"
                >
                    {isSyncing ? "Syncing..." : "Sync Legacy categories"}
                </button>
            )}
            <button 
                onClick={() => { setEditingCategory(null); setFormData({ name: "", slug: "", description: "", order: categories.length }); setShowModal(true); }}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label text-sm uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-shadow"
            >
            <PlusIcon className="w-5 h-5" />
            Add Category
            </button>
        </div>
      </header>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-4 text-xs font-label uppercase tracking-widest text-outline border-b border-outline-variant/20">
          <div className="col-span-5">Category Name</div>
          <div className="col-span-5">Slug</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
            <div className="p-10 text-center text-on-surface-variant animate-pulse">Scanning archives...</div>
        ) : (
            <div className="divide-y divide-outline-variant/10">
                {/* Managed Categories (Filtered for UI duplicates just in case) */}
                {Array.from(new Set(categories.map(c => c.name.toLowerCase()))).map(lowerName => {
                    const category = categories.find(c => c.name.toLowerCase() === lowerName);
                    return (
                        <div key={category.id} className="grid grid-cols-12 px-6 py-6 items-center hover:bg-surface-bright transition-colors group">
                            <div className="col-span-5">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg text-on-surface font-semibold">{category.name}</h3>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[8px] uppercase font-bold tracking-widest border border-green-200">Managed</span>
                                </div>
                            </div>
                            <div className="col-span-5">
                                <span className="text-sm font-body text-on-surface-variant">{category.slug}</span>
                            </div>
                            <div className="col-span-2 text-right flex justify-end gap-3">
                                <button onClick={() => startEdit(category)} className="text-outline hover:text-primary transition-colors">
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(category.id)} className="text-outline hover:text-error transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Unmanaged Legacy Categories */}
                {legacyCategories
                    .filter(legacyCat => !categories.some(c => c.name.toLowerCase() === legacyCat.toLowerCase()))
                    .map((legacyCat, idx) => (
                        <div key={`legacy-${idx}`} className="grid grid-cols-12 px-6 py-6 items-center bg-stone-50/50 hover:bg-stone-100/50 transition-colors group italic">
                            <div className="col-span-5">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg text-stone-400 font-semibold">{legacyCat}</h3>
                                    <span className="px-2 py-0.5 bg-stone-200 text-stone-500 rounded-full text-[8px] uppercase font-bold tracking-widest border border-stone-300">Unmanaged Layout</span>
                                </div>
                            </div>
                            <div className="col-span-5">
                                <span className="text-sm font-body text-stone-300">Pending Migration</span>
                            </div>
                            <div className="col-span-2 text-right flex justify-end gap-3">
                                <button 
                                    onClick={() => syncCategories(legacyCat)}
                                    disabled={isSyncing}
                                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors disabled:opacity-50"
                                >
                                    {isSyncing ? "Syncing..." : "Add Category"}
                                </button>
                            </div>
                        </div>
                    ))}

                {categories.length === 0 && legacyCategories.filter(legacyCat => !categories.some(c => c.name.toLowerCase() === legacyCat.toLowerCase())).length === 0 && (
                    <div className="p-20 text-center text-on-surface-variant">No categories found in archives or products.</div>
                )}
            </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-stone-50">
                    <h3 className="text-2xl font-headline italic">{editingCategory ? "Edit Category" : "New Collection"}</h3>
                    <button onClick={() => setShowModal(false)} className="text-outline hover:text-primary">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Category Name</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none" placeholder="Kitchen Essentials" />
                        </div>
                        <div className="border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Slug (URL Identifier)</label>
                            <input name="slug" value={formData.slug} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none font-body text-sm" placeholder="kitchen-essentials" />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-4">
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant">Cancel</button>
                        <button 
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold shadow-lg hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Syncing...
                                </>
                            ) : "Save Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
}
