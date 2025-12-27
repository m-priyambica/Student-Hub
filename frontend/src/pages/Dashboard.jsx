import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
    LogOut, ShoppingBag, MessageCircle, Search, Plus, 
    Zap, BookOpen, Monitor, PenTool, Trophy, Tag,
    X, Image as ImageIcon, Loader2, User as UserIcon, Filter, RotateCcw
} from "lucide-react";

// Fallback images
const PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000", 
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000", 
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000",
];
const getPlaceholder = (id) => PLACEHOLDERS[id % PLACEHOLDERS.length];

// Basic "Bad Word" Filter
const BAD_WORDS = ["stupid", "idiot", "scam", "fake", "badword"]; 
const containsBadWords = (text) => {
    return BAD_WORDS.some(word => text.toLowerCase().includes(word));
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [hasUnread, setHasUnread] = useState(false);
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Categories & Filters
  const [categories, setCategories] = useState(["All", "Textbooks", "Electronics", "Stationery", "Sports"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [filterCondition, setFilterCondition] = useState("all"); 
  const [filterType, setFilterType] = useState("all");           
  const [searchQuery, setSearchQuery] = useState(""); 
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    title: "", description: "", price: "", category: "Textbooks", condition: "used", product_type: "sale", images: []
  });

  // --- HELPER: SMART ICONS ---
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name === 'all') return <Zap className="h-4 w-4" />;
    if (name === 'textbooks' || name.includes('book')) return <BookOpen className="h-4 w-4" />;
    if (name === 'electronics' || name.includes('gadget')) return <Monitor className="h-4 w-4" />;
    if (name === 'stationery' || name.includes('pen') || name.includes('paper')) return <PenTool className="h-4 w-4" />;
    if (name === 'sports' || name.includes('gym') || name.includes('game')) return <Trophy className="h-4 w-4" />;
    return <Tag className="h-4 w-4" />; 
  };

  // --- 1. FETCH CATEGORIES ---
  const fetchCategories = async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/api/products/categories/");
        if (res.ok) {
            const data = await res.json();
            const uniqueCats = ["All", ...data.filter(c => c !== "All")];
            setCategories(uniqueCats);
        }
    } catch (err) { console.error("Failed to load categories", err); }
  };

  // --- 2. FETCH PRODUCTS ---
  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/"); return; }

    if (products.length === 0) setLoading(true);

    let url = "http://127.0.0.1:8000/api/products/?";
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (activeCategory && activeCategory !== "All") url += `category=${encodeURIComponent(activeCategory)}&`;

    try {
        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } else if (res.status === 401) {
            localStorage.removeItem("access_token");
            navigate("/");
        }
    } catch (err) { console.error("Error fetching products:", err); } 
    finally { setLoading(false); }
  }, [navigate, searchQuery, activeCategory, products.length]);

  // --- 3. USE EFFECTS ---
  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchProducts(); }, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchProducts]); 

  // --- 4. CLIENT SIDE FILTERING ---
  const filteredProducts = products.filter(product => {
      const matchesCondition = filterCondition === 'all' || product.condition === filterCondition;
      const matchesType = filterType === 'all' || product.product_type === filterType;
      return matchesCondition && matchesType;
  });

  const resetFilters = () => {
      setFilterCondition("all");
      setFilterType("all");
      setActiveCategory("All");
      setSearchQuery("");
  };

  // --- ACTIONS ---
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  // --- NEW: Handle opening chat (Clears notification) ---
  const handleOpenChat = () => {
      // Save current time as "Last Visited Chat"
      localStorage.setItem("lastChatVisit", new Date().toISOString());
      setHasUnread(false);
      navigate("/chat");
  };

  const handleChatStart = async (e, product) => {
    e.stopPropagation(); 
    const token = localStorage.getItem("access_token");
    if (!token) return alert("Please login to chat.");
    try {
        const response = await fetch("http://127.0.0.1:8000/api/chat/start/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ product_id: product.id })
        });
        if (response.ok) {
            handleOpenChat(); // Use the wrapper to set read status
        } else {
            alert("Could not start chat.");
        }
    } catch (err) { alert("Connection error."); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (containsBadWords(newProduct.category)) return alert("Please use appropriate category names.");

    setSubmitting(true);
    const token = localStorage.getItem("access_token");
    const formData = new FormData();

    Object.keys(newProduct).forEach(key => {
        if (key !== 'images') formData.append(key, newProduct[key]);
    });
    for (let i = 0; i < newProduct.images.length; i++) {
        formData.append("uploaded_images", newProduct.images[i]);
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/api/products/", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        if (response.ok) {
            setIsModalOpen(false);
            alert("Item listed successfully! 🛍️");
            setNewProduct({ title: "", description: "", price: "", category: "Textbooks", condition: "used", product_type: "sale", images: [] });
            setCustomCategoryMode(false);
            fetchProducts();
            fetchCategories();
        } else { alert("Failed to create product. Check inputs."); }
    } catch (error) { alert("Server error."); } 
    finally { setSubmitting(false); }
  };

  // --- UPDATED NOTIFICATION LOGIC ---
  useEffect(() => {
      const checkMessages = async () => {
          const token = localStorage.getItem("access_token");
          if (!token) return;
          try {
              const res = await fetch("http://127.0.0.1:8000/api/chat/rooms/", { 
                  headers: { "Authorization": `Bearer ${token}` } 
              });
              if (res.ok) {
                  const data = await res.json();
                  const payload = JSON.parse(atob(token.split('.')[1]));
                  const userId = payload.user_id;
                  
                  // Get the last time the user visited the chat page (defaults to 1970 if never visited)
                  const lastVisit = localStorage.getItem("lastChatVisit") || "1970-01-01T00:00:00.000Z";

                  // Check if any room has a message that is:
                  // 1. Sent by someone else
                  // 2. Sent AFTER the last time I opened the chat
                  const hasNew = data.some(room => {
                      const isOtherSender = room.last_sender_id && String(room.last_sender_id) !== String(userId);
                      const isNewer = room.last_message_time && new Date(room.last_message_time) > new Date(lastVisit);
                      return isOtherSender && isNewer;
                  });
                  setHasUnread(hasNew);
              }
          } catch (e) { console.error(e); }
      };
      checkMessages();
      const interval = setInterval(checkMessages, 10000); 
      return () => clearInterval(interval);
  }, []);

  

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans text-stone-800 pb-20 relative">
      
      {/* NAVBAR (Fixed for Mobile) */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/40 shadow-sm px-4 py-3">
        <nav className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            
            {/* Top Row: Logo & User Actions */}
            <div className="flex justify-between items-center w-full md:w-auto">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.reload()}>
                    <div className="relative w-8 h-8 md:w-10 md:h-10">
                        <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="HubBot" className="w-full h-full object-contain drop-shadow-md group-hover:rotate-12 transition-transform duration-300"/>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Student <span className="text-orange-600">Hub</span></h1>
                </div>

                {/* Mobile User Actions */}
                <div className="flex items-center gap-2 md:hidden">
                    {/* Updated Click Handler */}
                    <button onClick={handleOpenChat} className="p-2 rounded-xl bg-stone-100 text-stone-600 relative">
                        <MessageCircle className="h-5 w-5" />
                        <span className={`absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white ${hasUnread ? 'block' : 'hidden'}`}></span>
                    </button>
                    <button onClick={() => navigate("/profile")} className="p-2 rounded-xl bg-stone-100 text-stone-600">
                        <UserIcon className="h-5 w-5" />
                    </button>
                    <button onClick={handleLogout} className="p-2 rounded-xl bg-red-50 text-red-600">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Middle: Search Bar */}
            <div className="flex-1 w-full md:max-w-md relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-stone-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="Search textbooks, gadgets..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-100/50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none font-medium placeholder-stone-400 text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center gap-3">
                {/* --- Updated Click Handler --- */}
                <button onClick={handleOpenChat} className="p-3 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-orange-600 transition-colors relative" title="Messages">
                    <MessageCircle className="h-6 w-6" />
                    {hasUnread && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                </button>

                <button onClick={() => navigate("/profile")} className="p-3 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-orange-600 transition-colors" title="My Profile">
                    <UserIcon className="h-6 w-6" />
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="h-5 w-5" /><span>Logout</span>
                </button>
            </div>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 mb-8">
        
        {/* TITLE & FILTER TOGGLE */}
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-3xl md:text-5xl font-black text-stone-900 mb-2 tracking-tight">
                    Fresh <span className="text-orange-600">Arrivals.</span>
                </h1>
                <p className="text-stone-500 font-medium text-sm md:text-lg">Find what everyone is talking about.</p>
            </div>
            
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold transition-all shadow-md text-sm md:text-base ${
                    showFilters 
                    ? 'bg-orange-600 text-white shadow-orange-200' 
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-orange-300'
                }`}
            >
                <Filter className="h-4 w-4 md:h-5 md:w-5" /> Filter
            </button>
        </div>

        {/* --- FILTER PALETTE --- */}
        {showFilters && (
            <div className="mb-8 p-4 md:p-5 bg-white rounded-2xl shadow-xl border border-stone-100 animate-in slide-in-from-top-2 z-10 relative">
                <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-2">
                    <h3 className="font-bold text-stone-800 text-sm uppercase tracking-wide">Refine Results</h3>
                    <button onClick={resetFilters} className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"><RotateCcw className="h-3 w-3" /> Reset</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Category</label>
                        <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-stone-700 text-sm">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Condition</label>
                        <div className="flex gap-1 p-1 bg-stone-50 rounded-xl border border-stone-200">
                            {['all', 'new', 'used'].map((cond) => (
                                <button key={cond} onClick={() => setFilterCondition(cond)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${filterCondition === cond ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>{cond === 'all' ? 'Any' : cond === 'new' ? 'New' : 'Used'}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Type</label>
                        <div className="flex gap-1 p-1 bg-stone-50 rounded-xl border border-stone-200">
                            {['all', 'sale', 'rent'].map((type) => (
                                <button key={type} onClick={() => setFilterType(type)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === type ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>{type === 'all' ? 'Any' : type === 'sale' ? 'Buy' : 'Rent'}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-4 md:px-6">
        {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">{[1,2,3,4].map(i => <div key={i} className="h-64 bg-stone-200 rounded-3xl animate-pulse"></div>)}</div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product) => (
                <div 
                    key={product.id} 
                    onClick={() => navigate(`/product/${product.id}`)} 
                    className="group bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                >
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
                        <img 
                            src={product.images && product.images.length > 0 ? (product.images[0].image.startsWith('http') ? product.images[0].image : `http://127.0.0.1:8000${product.images[0].image}`) : getPlaceholder(product.id)} 
                            alt={product.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholder(product.id); }} 
                        />
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            <span className={`px-2 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-md shadow-sm ${product.condition === 'new' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-stone-800'}`}>{product.condition}</span>
                            <span className={`px-2 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-md shadow-sm ${product.product_type === 'rent' ? 'bg-blue-500/90 text-white' : 'bg-orange-500/90 text-white'}`}>{product.product_type === 'rent' ? 'Rent' : 'Buy'}</span>
                        </div>
                        
                        <button 
                            onClick={(e) => handleChatStart(e, product)} 
                            className="absolute bottom-2 right-2 p-2 bg-white text-orange-600 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-orange-600 hover:text-white"
                        >
                            <MessageCircle className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="pt-3 px-1 pb-1">
                        <div className="flex justify-between items-start">
                            <div className="w-full">
                                <h3 className="font-bold text-sm md:text-lg text-stone-800 line-clamp-1 group-hover:text-orange-600 transition-colors">{product.title}</h3>
                                <p className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">{product.category}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-lg md:text-2xl font-black text-stone-900">₹{product.price}</span>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="bg-orange-50 p-6 rounded-full mb-4"><ShoppingBag className="h-12 w-12 text-orange-400" /></div>
            <h3 className="text-xl font-bold text-stone-800">No items found</h3>
            <p className="text-stone-500 mb-4">Try adjusting your filters.</p>
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 p-4 md:p-5 bg-stone-900 text-white rounded-full shadow-2xl hover:bg-orange-600 hover:scale-110 hover:rotate-90 transition-all duration-300 z-40">
        <Plus className="h-6 w-6 md:h-8 md:w-8" />
      </button>

      {/* ADD PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-black text-slate-900">List an Item</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6 text-gray-500" /></button>
                </div>
                
                <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Title</label><input type="text" required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all" placeholder="e.g. Calculus Textbook" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} /></div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label><input type="number" required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all" placeholder="500" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div>
                        
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                            {customCategoryMode ? (
                                <div className="relative">
                                    <input type="text" autoFocus className="w-full p-3 bg-white border-2 border-orange-500 rounded-xl focus:outline-none" placeholder="Type new category..." value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                                    <button type="button" onClick={() => setCustomCategoryMode(false)} className="absolute right-2 top-3 text-xs font-bold text-stone-400 hover:text-stone-600">CANCEL</button>
                                </div>
                            ) : (
                                <select className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all" value={newProduct.category} onChange={e => { if (e.target.value === "custom") { setCustomCategoryMode(true); setNewProduct({...newProduct, category: ""}); } else { setNewProduct({...newProduct, category: e.target.value}); } }}>
                                    {categories.filter(c => c !== "All").map(cat => ( <option key={cat} value={cat}>{cat}</option> ))}
                                    <option value="custom" className="font-bold text-orange-600">+ Type New Category...</option>
                                </select>
                            )}
                        </div>
                    </div>

                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Description</label><textarea required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all h-24 resize-none" placeholder="Describe the condition, usage, etc." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea></div>
                    
                    <div className="flex gap-4">
                        <select className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" value={newProduct.condition} onChange={e => setNewProduct({...newProduct, condition: e.target.value})}><option value="new">Brand New</option><option value="used">Used</option></select>
                        <select className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" value={newProduct.product_type} onChange={e => setNewProduct({...newProduct, product_type: e.target.value})}><option value="sale">For Sale</option><option value="rent">For Rent</option></select>
                    </div>

                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer relative ${newProduct.images.length === 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setNewProduct({...newProduct, images: e.target.files})} />
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon className={`h-8 w-8 mb-2 ${newProduct.images.length === 0 ? 'text-red-400' : ''}`} />
                            <span className={`text-sm font-medium ${newProduct.images.length === 0 ? 'text-red-500 font-bold' : ''}`}>
                                {newProduct.images && newProduct.images.length > 0 ? `${newProduct.images.length} files selected` : "Upload at least 1 image (Required)"}
                            </span>
                        </div>
                    </div>

                    <button type="submit" disabled={submitting || newProduct.images.length === 0} className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 ${newProduct.images.length === 0 ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/30'}`}>
                        {submitting ? <Loader2 className="animate-spin" /> : "Post Item"}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;