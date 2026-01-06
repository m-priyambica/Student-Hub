import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    User, Package, Settings, Trash2, LogOut, Edit2, X, Loader2, 
    ShoppingBag, Clock, CheckCircle, AlertCircle, Mail, Save, Key, 
    Menu, CalendarClock, CheckSquare, TrendingUp, Image as ImageIcon,
    GraduationCap, BookOpen, Hash
} from "lucide-react";

// ==========================================
// 1. SIDEBAR COMPONENT
// ==========================================
const ProfileSidebar = ({ activeTab, setActiveTab, navigate, isOpen, onClose }) => (
    <>
        {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose}></div>}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:fixed`}>
            <div className="p-6 md:p-8 flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight">My Hub</h2>
                <button onClick={onClose} className="md:hidden text-stone-500 hover:bg-stone-100 rounded-full p-1"><X className="h-6 w-6" /></button>
            </div>
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                <div className="px-4 text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 mt-4">Selling</div>
                
                <button onClick={() => { setActiveTab("listings"); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "listings" ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <Package className="h-5 w-5" /> My Listings
                </button>
                
                <button onClick={() => { setActiveTab("sales"); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "sales" ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <TrendingUp className="h-5 w-5" /> Sold / Lent
                </button>

                <div className="px-4 text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 mt-6">Buying</div>
                
                <button onClick={() => { setActiveTab("purchases"); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "purchases" ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <ShoppingBag className="h-5 w-5" /> Purchases
                </button>
                
                <button onClick={() => { setActiveTab("rentals"); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "rentals" ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <Clock className="h-5 w-5" /> Rentals
                </button>

                <div className="px-4 text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 mt-6">Account</div>
                
                <button onClick={() => { setActiveTab("settings"); onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "settings" ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <Settings className="h-5 w-5" /> Settings
                </button>
            </nav>

            <div className="p-4 border-t border-stone-100">
                <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-2 justify-center p-3 text-sm font-bold text-stone-500 hover:text-stone-800">
                    Back to Marketplace
                </button>
            </div>
        </aside>
    </>
);

// ==========================================
// 2. SETTINGS FORM COMPONENT (Updated with Academic Info)
// ==========================================
const AccountSettings = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" }); 
    const timerRef = useRef(null);

    useEffect(() => { return () => clearTimeout(timerRef.current); }, []);

    const setTimedMessage = (text, type) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setMsg({ text, type });
        timerRef.current = setTimeout(() => { setMsg({ text: "", type: "" }); }, 5000); 
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem("access_token");
        try {
            // Include new fields in the payload
            const payload = {
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                branch: user.branch,
                semester: user.semester,
                section: user.section
            };

            const res = await fetch("https://student-hub-quqc.onrender.com/auth/profile/", {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const updatedData = await res.json();
                setUser(prev => ({ ...prev, ...updatedData }));
                setTimedMessage("Profile updated successfully!", "success");
            } else { setTimedMessage("Update failed. Username taken?", "error"); }
        } catch (err) { setTimedMessage("Connection failed.", "error"); }
        finally { setLoading(false); }
    };

    const handleResetPassword = async () => {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("https://student-hub-quqc.onrender.com/auth/request-password-reset/", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json" 
            },
                body: JSON.stringify({ email: user.email })
        });
            if (res.ok) setTimedMessage(`Link sent to ${user.email}. Check your inbox!`, "success");
            else setTimedMessage("Failed to send email.", "error");
        } catch (err) { setTimedMessage("Connection failed.", "error"); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-2xl bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6 md:space-y-8">
            {msg.text && <div className={`p-4 rounded-xl font-bold flex items-center gap-3 animate-in fade-in ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {msg.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0"/> : <AlertCircle className="h-5 w-5 flex-shrink-0"/>} 
                <span>{msg.text}</span>
            </div>}
            
            <form onSubmit={handleUpdate} className="space-y-6">
                {/* Personal Details */}
                <div>
                    <h3 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">Personal Details</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1"><label className="block text-sm font-bold text-stone-700 mb-2">First Name</label><input type="text" value={user.first_name || ""} onChange={e => setUser({...user, first_name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:border-orange-500" placeholder="First Name" /></div>
                            <div className="flex-1"><label className="block text-sm font-bold text-stone-700 mb-2">Last Name</label><input type="text" value={user.last_name || ""} onChange={e => setUser({...user, last_name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:border-orange-500" placeholder="Last Name" /></div>
                        </div>
                        <div><label className="block text-sm font-bold text-stone-700 mb-2">Username</label><input type="text" value={user.username || ""} onChange={e => setUser({...user, username: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:border-orange-500" /></div>
                        <div><label className="block text-sm font-bold text-stone-400 mb-2">Email (Read Only)</label><input type="email" value={user.email || ""} readOnly className="w-full p-3 bg-stone-100 rounded-xl text-stone-500 cursor-not-allowed" /></div>
                    </div>
                </div>

                {/* Academic Details - NEW SECTION */}
                <div>
                    <h3 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">Academic Details</h3>
                    <p className="text-sm text-stone-500 mb-4">This info will be visible to buyers to help them find you on campus.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-1"><GraduationCap className="h-3 w-3"/> Branch</label>
                            <input type="text" value={user.branch || ""} onChange={e => setUser({...user, branch: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:border-orange-500" placeholder="e.g. CSE" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-1"><BookOpen className="h-3 w-3"/> Semester</label>
                            <input type="text" value={user.semester || ""} onChange={e => setUser({...user, semester: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:border-orange-500" placeholder="e.g. 5th" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-1"><Hash className="h-3 w-3"/> Section</label>
                            <input type="text" value={user.section || ""} onChange={e => setUser({...user, section: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:border-orange-500" placeholder="e.g. A" />
                        </div>
                    </div>
                </div>

                <button disabled={loading} className="w-full md:w-auto px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>} Update Profile</button>
            </form>
            
            <hr className="border-stone-100" />
            <div>
                <h4 className="font-bold text-lg mb-2">Security</h4>
                <p className="text-sm text-stone-500 mb-4">Send a reset link to <strong>{user.email || "your email"}</strong>.</p>
                <button onClick={handleResetPassword} disabled={loading} className="w-full py-3 border-2 border-stone-200 rounded-xl font-bold text-stone-600 hover:text-orange-600 hover:border-orange-500 transition-all flex justify-center gap-2">{loading ? <Loader2 className="animate-spin h-4 w-4"/> : <Key className="h-4 w-4"/>} Send Password Reset Link</button>
            </div>
            <hr className="border-stone-100" />
            <button onClick={() => { if(confirm("Log out?")) { localStorage.removeItem("access_token"); navigate("/"); }}} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 flex justify-center gap-2"><LogOut className="h-4 w-4"/> Log Out</button>
        </div>
    );
};

// ==========================================
// 3. EDIT MODAL COMPONENT
// ==========================================
const EditProductModal = ({ product, categories, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({ ...product });
    const [newImages, setNewImages] = useState([]);
    const [isCustom, setIsCustom] = useState(!categories.includes(product.category));
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => { if (key !== 'images') data.append(key, formData[key]); });
        newImages.forEach(file => data.append("uploaded_images", file));
        await onUpdate(product.id, data);
        setSubmitting(false);
    };

    const handleDeleteImg = async (imgId) => {
        if(!confirm("Delete image?")) return;
        const token = localStorage.getItem("access_token");
        await fetch(`https://student-hub-quqc.onrender.com/api/products/images/${imgId}/delete/`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` }});
        setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== imgId) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10"><h2 className="text-2xl font-black">Edit Item</h2><button onClick={onClose}><X className="h-6 w-6 text-gray-500"/></button></div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-bold mb-1">Title</label><input className="w-full p-3 bg-gray-50 rounded-xl" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1"><label className="block text-sm font-bold mb-1">Price</label><input type="number" className="w-full p-3 bg-gray-50 rounded-xl" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-1">Category</label>
                            {isCustom ? (
                                <input className="w-full p-3 bg-orange-50 text-orange-800 rounded-xl" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                            ) : (
                                <select className="w-full p-3 bg-gray-50 rounded-xl" value={formData.category} onChange={e => { if(e.target.value==='custom'){setIsCustom(true);setFormData({...formData, category:''})} else setFormData({...formData, category: e.target.value}) }}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="custom">+ New Category</option>
                                </select>
                            )}
                        </div>
                    </div>
                    <div><label className="block text-sm font-bold mb-1">Description</label><textarea className="w-full p-3 bg-gray-50 rounded-xl h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required /></div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {formData.images?.map(img => (
                            <div key={img.id} className="relative w-16 h-16 shrink-0 group">
                                <img src={img.image.startsWith('http') ? img.image : `https://student-hub-quqc.onrender.com${img.image}`} className="w-full h-full object-cover rounded-lg" />
                                <button type="button" onClick={() => handleDeleteImg(img.id)} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"><Trash2 className="h-4 w-4"/></button>
                            </div>
                        ))}
                    </div>
                    <input type="file" multiple onChange={e => setNewImages(Array.from(e.target.files))} className="w-full text-sm text-gray-500"/>
                    <button disabled={submitting} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">{submitting ? "Saving..." : "Save Changes"}</button>
                </form>
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN PROFILE COMPONENT
// ==========================================
const Profile = () => {
    const navigate = useNavigate();
    // Initialize user with new fields
    const [user, setUser] = useState({ 
        id: null, username: "", email: "", first_name: "", last_name: "",
        branch: "", semester: "", section: "" 
    });
    
    // Data States
    const [myListings, setMyListings] = useState([]);
    const [transactions, setTransactions] = useState({ purchases: [], sales: [] });
    const [categories, setCategories] = useState([]);
    
    // UI States
    const [activeTab, setActiveTab] = useState("listings");
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { navigate("/"); return; }

        const init = async () => {
            try {
                // 1. Fetch Profile
                const uRes = await fetch("https://student-hub-quqc.onrender.com/auth/profile/", { headers: { "Authorization": `Bearer ${token}` }});
                const uData = await uRes.json();
                
                // Get ID from token if profile fetch missing ID
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = uData.id || payload.user_id;
                setUser({ ...uData, id: userId }); 

                // 2. Fetch All Products (and filter for Listings)
                const pRes = await fetch("https://student-hub-quqc.onrender.com/api/products/", { headers: { "Authorization": `Bearer ${token}` }});
                const pData = await pRes.json();
                if (Array.isArray(pData)) {
                    setMyListings(pData.filter(p => String(p.seller.id || p.seller) === String(userId)));
                }

                // 3. Fetch Transactions
                const tRes = await fetch("https://student-hub-quqc.onrender.com/api/auth/transactions/", { headers: { "Authorization": `Bearer ${token}` }});
                if (tRes.ok) {
                    const tData = await tRes.json();
                    setTransactions(tData);
                }

                // 4. Fetch Categories
                const cRes = await fetch("https://student-hub-quqc.onrender.com/api/products/categories/");
                const cData = await cRes.json();
                setCategories(cData);

                setLoading(false);
            } catch (e) {
                console.error("Initialization Error:", e);
                setLoading(false);
            }
        };
        init();
    }, [navigate, activeTab]);

    // --- Actions ---

    const handleUpdateProduct = async (id, formData) => {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`https://student-hub-quqc.onrender.com/api/products/${id}/`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            const updated = await res.json();
            setMyListings(myListings.map(p => p.id === id ? updated : p));
            setEditItem(null); 
        } else {
            alert("Update failed");
        }
    };

    const handleDeleteProduct = async (id) => {
        if(!confirm("Delete?")) return;
        const token = localStorage.getItem("access_token");
        await fetch(`https://student-hub-quqc.onrender.com/api/products/${id}/`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` }});
        setMyListings(myListings.filter(p => p.id !== id));
    };

    const handleMarkReturned = async (transactionId) => {
        if(!confirm("Confirm item returned?")) return;
        const token = localStorage.getItem("access_token");
        await fetch(`https://student-hub-quqc.onrender.com/api/auth/transactions/${transactionId}/return/`, { method: "POST", headers: { "Authorization": `Bearer ${token}` }});
        window.location.reload();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-stone-400">Loading...</div>;

    const myBoughtItems = transactions.purchases?.filter(t => t.type === 'sale') || [];
    const myRentedItems = transactions.purchases?.filter(t => t.type === 'rent') || [];

    return (
        <div className="min-h-screen bg-[#fafaf9] font-sans text-stone-900 flex flex-col md:flex-row">
            
            {/* MOBILE HEADER */}
            <div className="md:hidden bg-white p-4 flex items-center gap-3 shadow-sm sticky top-0 z-20">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-stone-100 rounded-lg">
                    <Menu className="h-6 w-6 text-stone-700" />
                </button>
                <h1 className="text-xl font-black">Student <span className="text-orange-600">Hub</span></h1>
            </div>

            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <main className="flex-1 md:ml-64 p-6 md:p-12">
                <div className="mb-8 md:mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-2">Hello, {user.first_name || user.username || "Guest"}!</h1>
                    <p className="text-stone-500">Manage your store and account.</p>
                </div>

                {activeTab === "listings" && (
                    <ProductGrid 
                        title="My Listings" 
                        items={myListings} 
                        isOwner={true} 
                        onEdit={setEditItem} 
                        onDelete={handleDeleteProduct} 
                    />
                )}
                
                {activeTab === "sales" && (
                    <TransactionList 
                        title="Sold & Lent" 
                        items={transactions.sales || []} 
                        isSellerView={true} 
                        onMarkReturn={handleMarkReturned} 
                    />
                )}
                
                {activeTab === "purchases" && (
                    <TransactionList 
                        title="My Purchases" 
                        items={myBoughtItems} 
                        isSellerView={false} 
                    />
                )}
                
                {activeTab === "rentals" && (
                    <TransactionList 
                        title="My Rentals" 
                        items={myRentedItems} 
                        isSellerView={false} 
                    />
                )}
                
                {activeTab === "settings" && (
                    <AccountSettings user={user} setUser={setUser} />
                )}
            </main>

            {editItem && (
                <EditProductModal product={editItem} categories={categories} onClose={() => setEditItem(null)} onUpdate={handleUpdateProduct} />
            )}
        </div>
    );
};

// ==========================================
// 5. HELPER COMPONENTS
// ==========================================

const ProductGrid = ({ title, items, isOwner, onEdit, onDelete }) => (
    <div>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-orange-600"><Package className="h-5 w-5"/> {title}</h3>
        {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed"><p className="text-stone-400">Nothing here yet.</p></div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {items.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all relative">
                        <div className="relative w-full aspect-[4/3] bg-stone-100 rounded-xl overflow-hidden mb-3">
                            <img src={p.images?.[0]?.image ? (p.images[0].image.startsWith('http') ? p.images[0].image : `https://student-hub-quqc.onrender.com${p.images[0].image}`) : "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">₹{p.price}</div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="truncate pr-2 w-full">
                                <h4 className="font-bold truncate text-stone-800 text-sm md:text-base">{p.title}</h4>
                                <p className="text-xs text-stone-400 font-bold uppercase">{p.category}</p>
                            </div>
                            {isOwner && (
                                <div className="flex gap-1 md:gap-2 shrink-0">
                                    <button onClick={() => onEdit(p)} className="p-1.5 md:p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="h-3 w-3 md:h-4 md:w-4"/></button>
                                    <button onClick={() => onDelete(p.id)} className="p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3 w-3 md:h-4 md:w-4"/></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const TransactionList = ({ title, items, isSellerView, onMarkReturn }) => (
    <div>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-orange-600">
            {isSellerView ? <TrendingUp className="h-5 w-5"/> : <ShoppingBag className="h-5 w-5"/>} 
            {title}
        </h3>
        {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed"><p className="text-stone-400">Nothing here yet.</p></div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {items.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-4 items-center">
                        <img src={t.product_image ? (t.product_image.startsWith('http') ? t.product_image : `https://student-hub-quqc.onrender.com${t.product_image}`) : "https://via.placeholder.com/150"} className="w-full sm:w-24 h-24 object-cover rounded-xl bg-stone-100" />
                        <div className="flex-1 w-full text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-1">
                                <h4 className="font-bold text-lg text-stone-800">{t.product_title}</h4>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${t.type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{t.type}</span>
                            </div>
                            <p className="text-sm text-stone-500 mb-2">{isSellerView ? `Sold to: ${t.partner}` : `Seller: ${t.partner}`} • ₹{t.product_price}</p>
                            
                            {t.type === 'rent' && (
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    {t.status === 'active' ? (
                                        <div className="flex items-center gap-1 font-bold text-sm text-stone-500"><CalendarClock className="h-4 w-4"/> {t.days_left} Days left</div>
                                    ) : (
                                        <div className="flex items-center gap-1 font-bold text-sm text-green-600"><CheckSquare className="h-4 w-4"/> Returned</div>
                                    )}
                                    
                                    {isSellerView && t.status === 'active' && (
                                        <button onClick={() => onMarkReturn(t.id)} className="ml-2 px-3 py-1 bg-stone-900 text-white text-xs font-bold rounded-lg hover:bg-stone-700">Mark Returned</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default Profile;