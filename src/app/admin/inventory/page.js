"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { adminDb as db, adminStorage as storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { 
    PlusIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    XMarkIcon, 
    PhotoIcon 
} from "@heroicons/react/24/outline";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]); // Array of File objects for new uploads
  const [imagePreviews, setImagePreviews] = useState([]); // Array of { url, isNew, file }
  const [uploading, setUploading] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    handle: "",
    price: "",
    originalPrice: "",
    category: "",
    stock: "",
    featuredImage: "",
    description: "",
    features: "",
    instructions: "",
    tags: ""
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbCategories(data);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 10;

    const validFiles = files.filter(file => {
        if (file.size > MAX_SIZE) {
            alert(`File ${file.name} is too large. Max size is 10MB.`);
            return false;
        }
        return true;
    });

    if (imagePreviews.length + validFiles.length > MAX_FILES) {
        alert(`You can only have a maximum of ${MAX_FILES} images per product.`);
        return;
    }

    validFiles.forEach(file => {
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
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        const handle = formData.handle.trim() || generateHandle(formData.title);

        const productData = {
            ...formData,
            handle,
            price: parseFloat(formData.price),
            originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
            stock: parseInt(formData.stock) || 0,
            tags: typeof formData.tags === 'string' ? formData.tags.split(",").map(t => t.trim()) : formData.tags,
            featuredImage,
            images: allImages,
            createdAt: editingProduct?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingProduct) {
            await updateDoc(doc(db, "products", editingProduct.id), productData);
        } else {
            await addDoc(collection(db, "products"), productData);
        }
        
        setShowModal(false);
        setEditingProduct(null);
        setImageFiles([]);
        setImagePreviews([]);
        setFormData({ title: "", handle: "", price: "", originalPrice: "", category: "", stock: "", featuredImage: "", description: "", features: "", instructions: "", tags: "" });
    } catch (error) {
        console.error("Critical Failure in product saving:", error);
        alert(`Critical Failure: Inventory could not be updated. ${error.message || ""}`);
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    const existingPreviews = product.images?.map(url => ({ url, isNew: false })) || 
                            (product.featuredImage ? [{ url: product.featuredImage, isNew: false }] : []);
    setImagePreviews(existingPreviews);
    setImageFiles([]);
    setFormData({
        title: product.title || "",
        handle: product.handle || "",
        price: product.price?.toString() || "",
        originalPrice: product.originalPrice?.toString() || "",
        category: product.category || "",
        stock: product.stock?.toString() || "0",
        featuredImage: product.featuredImage || "",
        description: product.description || "",
        features: product.features || "",
        instructions: product.instructions || "",
        tags: Array.isArray(product.tags) ? product.tags.join(", ") : (product.tags || "")
    });
    setShowModal(true);
  };

  const { user, isAdmin: isSystemAdmin } = useAuth();

  return (
    <>
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex-grow">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-3xl md:text-4xl font-headline italic text-on-surface">Inventory Management</h2>
            {isSystemAdmin ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] uppercase font-bold tracking-widest border border-green-200">Admin Verified</span>
            ) : (
                <div className="flex flex-col items-start gap-1">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] uppercase font-bold tracking-widest border border-red-200">Waitlisted User</span>
                    <span className="text-[10px] text-stone-400 font-body">Logged in as: {user?.email}</span>
                </div>
            )}
          </div>
          <p className="text-on-surface-variant font-body mt-2">Curating the finest toxin-free culinary tools.</p>
        </div>
        <button 
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            className="bg-primary text-on-primary w-full md:w-auto px-8 py-4 rounded-xl font-label text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg transition-shadow shrink-0"
        >
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 px-6 py-4 text-xs font-label uppercase tracking-widest text-outline border-b border-outline-variant/20 bg-surface-bright">
          <div className="col-span-5">Product Details</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-1">Stock</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
            <div className="p-10 text-center text-on-surface-variant animate-pulse">Loading collection...</div>
        ) : (
            <div className="divide-y divide-outline-variant/10">
                {products.map((product) => (
                    <div key={product.id} className="grid grid-cols-1 lg:grid-cols-12 px-6 py-6 md:py-8 items-start lg:items-center hover:bg-surface-bright transition-colors group gap-6 lg:gap-0">
                        {/* Mobile & Desktop: Image and Title */}
                        <div className="col-span-1 lg:col-span-5 flex items-center gap-4 md:gap-6">
                            <div className="w-16 md:w-20 aspect-square bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
                                <img src={product.featuredImage} alt={product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg md:text-xl text-on-surface font-semibold truncate">{product.title}</h3>
                                <p className="text-[10px] md:text-xs text-outline font-body mt-1 truncate">Handle: {product.handle}</p>
                            </div>
                        </div>

                        {/* Mobile Grid (2 cols) / Desktop col */}
                        <div className="col-span-1 lg:col-span-6 grid grid-cols-2 lg:grid-cols-6 gap-4">
                            <div className="lg:col-span-2 flex flex-col lg:block">
                                <span className="lg:hidden text-[8px] uppercase font-bold text-outline mb-1">Category</span>
                                <span className="text-sm font-body text-on-surface-variant">{product.category}</span>
                            </div>
                            <div className="lg:col-span-1 flex flex-col lg:block">
                                <span className="lg:hidden text-[8px] uppercase font-bold text-outline mb-1">Price</span>
                                <div>
                                    <span className="text-sm font-bold text-on-surface">{formatPrice(product.price)}</span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-[10px] text-outline line-through block">{formatPrice(product.originalPrice)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="lg:col-span-1 flex flex-col lg:block">
                                <span className="lg:hidden text-[8px] uppercase font-bold text-outline mb-1">Stock</span>
                                <span className="text-sm font-body text-on-surface-variant">{product.stock || 0}</span>
                            </div>
                            <div className="lg:col-span-2 flex flex-col lg:block">
                                <span className="lg:hidden text-[8px] uppercase font-bold text-outline mb-1">Status</span>
                                <div>
                                    {product.stock > 0 ? (
                                        <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-[10px] font-bold uppercase tracking-tighter">Active</span>
                                    ) : (
                                        <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-[10px] font-bold uppercase tracking-tighter">Out of Stock</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 lg:col-span-1 flex justify-end gap-6 lg:gap-3 lg:border-none border-t border-outline-variant/10 pt-4 lg:pt-0">
                            <button onClick={() => startEdit(product)} className="text-outline hover:text-primary transition-colors flex items-center gap-2 lg:block">
                                <PencilSquareIcon className="w-5 h-5" />
                                <span className="lg:hidden text-[10px] font-bold uppercase">Edit</span>
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="text-outline hover:text-error transition-colors flex items-center gap-2 lg:block">
                                <TrashIcon className="w-5 h-5" />
                                <span className="lg:hidden text-[10px] font-bold uppercase">Delete</span>
                            </button>
                        </div>
                    </div>
                ))}
                {products.length === 0 && (
                    <div className="p-20 text-center text-on-surface-variant">Your culinary vault is empty.</div>
                )}
            </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-stone-50">
                    <h3 className="text-2xl font-headline italic">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                    <button onClick={() => setShowModal(false)} className="text-outline hover:text-primary">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Title</label>
                            <input name="title" value={formData.title} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none" placeholder="Elite 3-Layer Kadhai" />
                        </div>
                        <div className="border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Handle (URL Slug)</label>
                            <input name="handle" value={formData.handle} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none" placeholder="elite-kadhai" />
                        </div>
                        <div className="border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Final Price (₹)</label>
                            <input name="price" type="number" step="0.1" value={formData.price} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none" placeholder="1500" />
                        </div>
                        <div className="border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Original Price (₹)</label>
                            <input name="originalPrice" type="number" step="0.1" value={formData.originalPrice} onChange={handleInputChange} className="w-full bg-transparent py-2 focus:ring-0 outline-none" placeholder="2000 (Optional)" />
                        </div>
                        <div className="border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Category</label>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full bg-transparent py-2 focus:ring-0 outline-none appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select Category</option>
                                {dbCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                                {dbCategories.length === 0 && (
                                    <>
                                        <option value="Cast iron Cookware">Cast iron Cookware</option>
                                        <option value="Home Essentials">Home Essentials</option>
                                        <option value="Kitchen Essentials">Kitchen Essentials</option>
                                        <option value="Tri Ply Cookware">Tri Ply Cookware</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="border-b border-primary/20">

                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Stock Quantity</label>
                            <input name="stock" type="number" value={formData.stock} onChange={handleInputChange} required className="w-full bg-transparent py-2 focus:ring-0 outline-none" placeholder="25" />
                        </div>
                        <div className="col-span-2 border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Product Visuals (Up to 10 images, max 10MB each)</label>
                            <div className="py-4 space-y-4">
                                <div className="grid grid-cols-5 gap-3">
                                    {imagePreviews.map((img, index) => (
                                        <div key={index} className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative group border border-stone-200">
                                            <img src={img.url} className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            >
                                                <XMarkIcon className="w-3 h-3 text-red-600" />
                                            </button>
                                            {img.isNew && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[8px] py-0.5 text-center font-bold uppercase">New</div>
                                            )}
                                        </div>
                                    ))}
                                    {imagePreviews.length < 10 && (
                                        <label 
                                            htmlFor="image-upload" 
                                            className="aspect-square bg-stone-50 rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors group"
                                        >
                                            <PlusIcon className="w-6 h-6 text-stone-300 group-hover:text-primary" />
                                            <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter mt-1">Add Image</span>
                                        </label>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    multiple
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    className="hidden" 
                                    id="image-upload" 
                                />
                            </div>
                        </div>
                        <div className="col-span-2 border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full bg-transparent py-2 focus:ring-0 outline-none resize-none" placeholder="Describe the artifact's essence..." />
                        </div>
                        <div className="col-span-2 border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Key Product Features (One per line)</label>
                            <textarea name="features" value={formData.features} onChange={handleInputChange} rows={3} className="w-full bg-transparent py-2 focus:ring-0 outline-none resize-none" placeholder="100% PFOA Free&#10;Induction Friendly&#10;Chemical-free coating" />
                        </div>
                        <div className="col-span-2 border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Product Instructions (Care & Usage)</label>
                            <textarea name="instructions" value={formData.instructions} onChange={handleInputChange} rows={3} className="w-full bg-transparent py-2 focus:ring-0 outline-none resize-none" placeholder="Season with oil after every use. Avoid using soap." />
                        </div>
                        <div className="col-span-2 border-b border-primary/20">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tags (Comma separated)</label>
                            <input name="tags" value={formData.tags} onChange={handleInputChange} className="w-full bg-transparent py-2 focus:ring-0 outline-none" placeholder="Bestseller, Limited Edition" />
                        </div>
                    </div>
                </form>
                <div className="p-8 border-t border-outline-variant/10 bg-stone-50 flex justify-end gap-4">
                    <button onClick={() => setShowModal(false)} className="px-6 py-3 font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant">Cancel</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={uploading}
                        className="min-w-[220px] px-8 py-3 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold shadow-lg hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <span className="w-3 h-3 flex-shrink-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>Syncing Inventory...</span>
                            </>
                        ) : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
