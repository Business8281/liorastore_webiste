"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { adminDb as db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    PhotoIcon,
    MagnifyingGlassIcon,
    GiftIcon,
    CheckIcon
} from "@heroicons/react/24/outline";

export default function CombosPage() {
    const [combos, setCombos] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCombo, setEditingCombo] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dbCategories, setDbCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        price: "",
        originalPrice: "",
        stock: "",
        description: "",
        tags: "",
        selectedProducts: [], // Array of product IDs
        freeProducts: [] // Array of product IDs
    });

    useEffect(() => {
        // Listen to Combos
        const unsubscribeCombos = onSnapshot(query(collection(db, "combos")), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCombos(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching combos:", error);
            setLoading(false);
        });

        // Listen to Inventory Products for selection
        const unsubscribeProducts = onSnapshot(query(collection(db, "products")), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInventory(data);
        });

        // Listen to Categories
        const unsubscribeCategories = onSnapshot(query(collection(db, "categories"), orderBy("name", "asc")), (snapshot) => {
            const data = [...new Set(snapshot.docs.map(doc => doc.data().name))];
            setDbCategories(data);
        });

        return () => {
            unsubscribeCombos();
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleProductSelection = (productId) => {
        setFormData(prev => {
            const isSelected = prev.selectedProducts.includes(productId);
            const newSelected = isSelected
                ? prev.selectedProducts.filter(id => id !== productId)
                : [...prev.selectedProducts, productId];

            // If unselected, also remove from free products
            const newFree = prev.freeProducts.filter(id => newSelected.includes(id));

            return { ...prev, selectedProducts: newSelected, freeProducts: newFree };
        });
    };

    const toggleFreeProduct = (productId) => {
        setFormData(prev => {
            const isFree = prev.freeProducts.includes(productId);
            const newFree = isFree
                ? prev.freeProducts.filter(id => id !== productId)
                : [...prev.freeProducts, productId];

            return { ...prev, freeProducts: newFree };
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, { url: reader.result, isNew: true, file }]);
                setImageFiles(prev => [...prev, file]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        const itemToRemove = imagePreviews[index];
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (itemToRemove.isNew) {
            setImageFiles(prev => prev.filter(f => f !== itemToRemove.file));
        }
    };

    const uploadImage = async (file) => {
        const storageRef = ref(storage, `combos/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.selectedProducts.length === 0) {
            alert("Please select at least one product for this combo.");
            return;
        }
        setUploading(true);

        try {
            const newUploads = imagePreviews.filter(p => p.isNew);
            const existingUrls = imagePreviews.filter(p => !p.isNew).map(p => p.url);

            const uploadedUrls = await Promise.all(
                newUploads.map(p => uploadImage(p.file))
            );

            const generateHandle = (title) => {
                return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            };

            const allImages = [...existingUrls, ...uploadedUrls].slice(0, 10);
            const featuredImage = allImages[0] || "";
            const handle = generateHandle(formData.title);

            const comboData = {
                ...formData,
                handle,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
                stock: parseInt(formData.stock) || 0,
                tags: typeof formData.tags === 'string' ? formData.tags.split(",").map(t => t.trim()) : formData.tags,
                featuredImage,
                images: allImages,
                createdAt: editingCombo?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingCombo) {
                await updateDoc(doc(db, "combos", editingCombo.id), comboData);
            } else {
                await addDoc(collection(db, "combos"), comboData);
            }

            setShowModal(false);
            setEditingCombo(null);
            resetForm();
        } catch (error) {
            console.error("Critical Failure in saving combo:", error);
            alert(`Failed to save combo: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            category: "",
            price: "",
            originalPrice: "",
            stock: "",
            description: "",
            tags: "",
            selectedProducts: [],
            freeProducts: []
        });
        setImageFiles([]);
        setImagePreviews([]);
    };

    const startEdit = (combo) => {
        setEditingCombo(combo);
        setImagePreviews(combo.images?.map(url => ({ url, isNew: false })) || []);
        setFormData({
            title: combo.title || "",
            category: combo.category || "",
            price: combo.price?.toString() || "",
            originalPrice: combo.originalPrice?.toString() || "",
            stock: combo.stock?.toString() || "0",
            description: combo.description || "",
            tags: Array.isArray(combo.tags) ? combo.tags.join(", ") : (combo.tags || ""),
            selectedProducts: combo.selectedProducts || [],
            freeProducts: combo.freeProducts || []
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this combo?")) {
            await deleteDoc(doc(db, "combos", id));
        }
    };

    const filteredInventory = inventory.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-headline italic text-on-surface">Combo Collections</h2>
                    <p className="text-on-surface-variant font-body mt-2">Curate luxury bundles with complimentary artifacts.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingCombo(null); setShowModal(true); }}
                    className="w-full md:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-label text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create Combo
                </button>
            </header>

            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden lg:grid grid-cols-12 px-6 py-4 text-xs font-label uppercase tracking-widest text-outline border-b border-outline-variant/20 bg-stone-50">
                    <div className="col-span-5">Combo Details</div>
                    <div className="col-span-2 text-center">Items</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-1 text-center">Stock</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-on-surface-variant animate-pulse font-headline italic text-xl">Fetching curated sets...</div>
                ) : (
                    <div className="divide-y divide-outline-variant/10">
                        {combos.map((combo) => (
                            <div key={combo.id} className="grid grid-cols-1 lg:grid-cols-12 px-6 py-6 lg:py-8 items-center hover:bg-surface-bright transition-colors group relative">
                                {/* Combo Details */}
                                <div className="col-span-1 lg:col-span-5 flex items-center gap-4 lg:gap-6 mb-4 lg:mb-0">
                                    <div className="w-16 lg:w-20 aspect-square bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                                        <img src={combo.featuredImage} alt={combo.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg lg:text-xl text-on-surface font-bold truncate tracking-tight">{combo.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">{combo.category}</span>
                                            {combo.stock > 0 ? (
                                                <span className="lg:hidden px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full text-[8px] font-bold uppercase tracking-widest">Active</span>
                                            ) : (
                                                <span className="lg:hidden px-2 py-0.5 bg-error-container text-on-error-container rounded-full text-[8px] font-bold uppercase tracking-widest">Unavailable</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Count (Mobile responsive) */}
                                <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5">
                                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Composition</span>
                                    <div className="text-right lg:text-center">
                                        <span className="text-xs lg:text-sm font-label text-on-surface-variant font-bold">{combo.selectedProducts?.length || 0} Products</span>
                                        {combo.freeProducts?.length > 0 && (
                                            <span className="block text-[10px] text-emerald-600 font-bold uppercase mt-0.5">+{combo.freeProducts.length} Gift Artifacts</span>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5">
                                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Value</span>
                                    <div className="text-right lg:text-center">
                                        <span className="text-base lg:text-lg font-headline italic font-bold text-primary">{formatPrice(combo.price)}</span>
                                        {combo.originalPrice && (
                                            <span className="block text-[10px] text-outline line-through">{formatPrice(combo.originalPrice)}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Stock & Status (Desktop only status bar) */}
                                <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center py-2 lg:py-0 border-t lg:border-none border-outline-variant/5">
                                    <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-outline">Availability</span>
                                    <div className="flex flex-col items-end lg:items-center">
                                        <span className="text-sm font-bold text-on-surface">{combo.stock || 0}</span>
                                        <div className="hidden lg:block mt-2">
                                            {combo.stock > 0 ? (
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 lg:col-span-2 flex justify-end gap-2 lg:gap-4 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-none border-outline-variant/10">
                                    <button 
                                        onClick={() => startEdit(combo)} 
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 lg:p-2 bg-stone-50 lg:bg-transparent rounded-xl text-outline hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                        <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest">Edit</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(combo.id)} 
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 lg:p-2 bg-red-50 lg:bg-transparent rounded-xl text-red-400 hover:text-error hover:bg-error/5 transition-all"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                        <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest">Delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {combos.length === 0 && (
                            <div className="p-20 text-center text-on-surface-variant font-headline italic text-xl">No bundle archives found.</div>
                        )}
                    </div>
                )}
            </section>

            {/* Combo Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-stone-50">
                            <h3 className="text-2xl font-headline italic">{editingCombo ? "Edit Combo" : "New Combo Bundle"}</h3>
                            <button onClick={() => setShowModal(false)} className="text-outline hover:text-primary">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                                {/* Left Side: Basic Info */}
                                <div className="space-y-6 lg:border-r lg:border-stone-100 lg:pr-10">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-primary border-b border-stone-100 pb-2">Artifact Essence</h4>

                                    <div className="border-b border-primary/20">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Bundle Title</label>
                                        <input name="title" value={formData.title} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none font-bold lg:text-lg" placeholder="Master Chef's Essentials" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border-b border-primary/20">
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Final Price (₹)</label>
                                            <input name="price" type="number" value={formData.price} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none font-bold text-primary" placeholder="3500" />
                                        </div>
                                        <div className="border-b border-primary/20">
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Original Price (₹)</label>
                                            <input name="originalPrice" type="number" value={formData.originalPrice} onChange={handleInputChange} className="w-full bg-transparent py-2 focus:ring-0 outline-none text-outline" placeholder="5000" />
                                        </div>
                                    </div>

                                    <div className="border-b border-primary/20">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Combo Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-transparent py-2 focus:ring-0 outline-none font-body text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select a category</option>
                                            {dbCategories.map((cat, i) => (
                                                <option key={i} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="border-b border-primary/20">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Bundle Stock</label>
                                        <input name="stock" type="number" value={formData.stock} onChange={handleInputChange} className="w-full bg-transparent py-2 focus:ring-0 outline-none font-bold" placeholder="10" />
                                    </div>

                                    <div className="border-b border-primary/20">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Description</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className="w-full bg-transparent py-2 focus:ring-0 outline-none resize-none text-sm" placeholder="Describe the synergy of this bundle..." />
                                    </div>

                                    <div className="border-b border-primary/20">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Gallery Visuals</label>
                                        <div className="py-4 flex flex-wrap gap-2">
                                            {imagePreviews.map((img, index) => (
                                                <div key={index} className="w-16 h-16 bg-stone-50 rounded-lg border border-stone-200 overflow-hidden relative group">
                                                    <img src={img.url} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeImage(index)} className="absolute top-0 right-0 bg-white/80 p-0.5 rounded-full opacity-100 lg:opacity-0 group-hover:opacity-100"><XMarkIcon className="w-3 h-3 text-red-600" /></button>
                                                </div>
                                            ))}
                                            {imagePreviews.length < 5 && (
                                                <label className="w-16 h-16 border-2 border-dashed border-stone-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors">
                                                    <input type="file" onChange={handleImageChange} className="hidden" multiple accept="image/*" />
                                                    <PlusIcon className="w-5 h-5 text-stone-300" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Product Selection */}
                                <div className="space-y-8 flex flex-col">
                                    {/* Included Products Section */}
                                    <div className="flex flex-col">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-primary border-b border-stone-100 pb-2 mb-4">Included Products</h4>

                                        <div className="relative mb-4">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                className="w-full pl-9 pr-4 py-3 bg-stone-50 rounded-xl border border-stone-200 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="Search inventory..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <div className="overflow-y-auto border border-stone-100 rounded-xl divide-y divide-stone-50 max-h-[300px] bg-stone-50/30">
                                            {filteredInventory.map(product => (
                                                <div
                                                    key={`inc-${product.id}`}
                                                    className={`p-3 flex items-center justify-between hover:bg-stone-100 transition-colors cursor-pointer ${formData.selectedProducts.includes(product.id) ? "bg-primary/5 shadow-inner" : ""}`}
                                                    onClick={() => toggleProductSelection(product.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded border border-stone-200 overflow-hidden shrink-0">
                                                            <img src={product.featuredImage} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-on-surface truncate">{product.title}</p>
                                                            <p className="text-[9px] text-outline font-body uppercase tracking-wider">{product.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${formData.selectedProducts.includes(product.id) ? "bg-primary border-primary text-white scale-110" : "border-stone-200"}`}>
                                                        {formData.selectedProducts.includes(product.id) && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Free Products Section */}
                                    <div className="flex flex-col">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-secondary border-b border-stone-100 pb-2 mb-4">Free Artifacts (Gifts)</h4>

                                        <div className="overflow-y-auto border border-stone-100 rounded-xl divide-y divide-stone-50 max-h-[300px] bg-stone-50/30">
                                            {filteredInventory.filter(p => formData.selectedProducts.includes(p.id)).map(product => (
                                                <div
                                                    key={`free-${product.id}`}
                                                    className={`p-3 flex items-center justify-between hover:bg-secondary/5 transition-colors cursor-pointer ${formData.freeProducts.includes(product.id) ? "bg-secondary/10" : ""}`}
                                                    onClick={() => toggleFreeProduct(product.id)}
                                                >
                                                    <div className="flex items-center gap-3 text-stone-500">
                                                        <div className="w-10 h-10 bg-white rounded border border-stone-200 overflow-hidden opacity-80 shrink-0">
                                                            <img src={product.featuredImage} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold truncate">{product.title}</p>
                                                            <p className="text-[9px] uppercase font-label tracking-wider">{product.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${formData.freeProducts.includes(product.id) ? "bg-secondary border-secondary text-white scale-110" : "border-stone-200"}`}>
                                                        {formData.freeProducts.includes(product.id) && <GiftIcon className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.selectedProducts.length === 0 && (
                                                <div className="p-8 text-center text-[10px] text-outline uppercase tracking-widest italic">Select products above to offer them as gifts.</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-stone-50 p-4 rounded-xl space-y-3 shadow-inner">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                                            <span>Composition Preview:</span>
                                            <span className="text-primary">{formData.selectedProducts.length} Items</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.selectedProducts.map(id => {
                                                const p = inventory.find(x => x.id === id);
                                                return (
                                                    <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-100 rounded-lg text-[9px] font-bold text-stone-600 shadow-sm animate-in fade-in zoom-in duration-200">
                                                        {p?.title.substring(0, 12)}...
                                                        {formData.freeProducts.includes(id) && <GiftIcon className="w-2.5 h-2.5 text-primary" />}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 lg:p-8 border-t border-outline-variant/10 bg-stone-50 flex flex-col md:flex-row justify-end gap-3 lg:gap-4">
                            <button onClick={() => setShowModal(false)} className="order-2 md:order-1 px-6 py-4 font-label text-xs uppercase tracking-widest font-black text-on-surface-variant hover:text-primary transition-colors">Discard changes</button>
                            <button
                                onClick={handleSubmit}
                                disabled={uploading || formData.selectedProducts.length === 0}
                                className="order-1 md:order-2 px-10 py-4 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-black shadow-lg hover:bg-stone-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Syncing Artifacts...
                                    </>
                                ) : (
                                    <>
                                        {editingCombo ? "Update Bundle" : "Publish Combo"}
                                        <CheckIcon className="w-4 h-4 stroke-[3]" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
