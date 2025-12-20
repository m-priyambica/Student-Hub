import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ShoppingBag, MessageCircle, Search, Plus, Heart, Zap, BookOpen, Monitor, Shirt, Armchair, X, Image as ImageIcon, Loader2, User as UserIcon } from "lucide-react";

// Fallback images
const PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1615655406736-b37c4fabf923?q=80&w=1000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1633596683562-4aee30985862?q=80&w=1000&auto=format&fit=crop", 
];
const getPlaceholder = (id) => PLACEHOLDERS[id % PLACEHOLDERS.length];

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [newProduct, setNewProduct] = useState({
    title: "", description: "", price: "", category: "other", condition: "used", product_type: "sale", images: []
  });

  const fetchProducts = () => {
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/"); return; }

    fetch("http://127.0.0.1:8000/api/products/", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => { setProducts(data); setLoading(false); })
    .catch(err => console.error("Error:", err));
  };

  useEffect(() => { fetchProducts(); }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  // --- CHAT LOGIC ---
 // --- UPDATED CHAT LOGIC ---
  const handleChatStart = async (e, product) => {
    e.stopPropagation(); 
    const token = localStorage.getItem("access_token");
    
    if (!token) {
        alert("Please login to chat.");
        return;
    }
    
    try {
        const response = await fetch("http://127.0.0.1:8000/api/chat/start/", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ product_id: product.id })
        });

        const data = await response.json(); // <--- Parse the response

        if (response.ok) {
            navigate("/chat"); 
        } else {
            // SHOW THE REAL ERROR
            alert(data.error || data.message || "Could not start chat.");
        }
    } catch (err) {
        console.error(err);
        alert("Connection error.");
    }
  };
  // --- ADD PRODUCT LOGIC ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("title", newProduct.title);
    formData.append("description", newProduct.description);
    formData.append("price", newProduct.price);
    formData.append("category", newProduct.category);
    formData.append("condition", newProduct.condition);
    formData.append("product_type", newProduct.product_type);
    
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
            setNewProduct({ title: "", description: "", price: "", category: "other", condition: "used", product_type: "sale", images: [] });
            fetchProducts();
        } else {
            alert("Failed to create product.");
        }
    } catch (error) {
        alert("Server error.");
    } finally {
        setSubmitting(false);
    }
  };

  const categories = [
      { name: "All", icon: Zap }, { name: "Electronics", icon: Monitor }, { name: "Books", icon: BookOpen }, { name: "Clothing", icon: Shirt }, { name: "Furniture", icon: Armchair },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans text-stone-800 pb-20 relative">
      
      {/* NAVBAR */}
      <div className="sticky top-4 z-40 px-4">
        <nav className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg shadow-stone-200/50 rounded-2xl px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative w-10 h-10">
                 <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="HubBot" className="w-full h-full object-contain drop-shadow-md group-hover:rotate-12 transition-transform duration-300"/>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student <span className="text-orange-600">Hub</span></h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-stone-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input type="text" placeholder="Search..." className="w-full pl-11 pr-4 py-3 bg-stone-100/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-medium placeholder-stone-400"/>
            </div>

            <div className="flex items-center gap-3">
                {/* --- PROFILE BUTTON (ADDED HERE) --- */}
                <button onClick={() => navigate("/profile")} className="p-3 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-orange-600 transition-colors" title="My Profile">
                    <UserIcon className="h-6 w-6" />
                </button>
                
                <button className="p-3 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-orange-600 transition-colors"><Heart className="h-6 w-6" /></button>
                <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors"><LogOut className="h-5 w-5" /><span className="hidden sm:inline">Logout</span></button>
            </div>
        </nav>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-7xl mx-auto px-6 mt-10 mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-stone-900 mb-2 tracking-tight">Fresh <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Arrivals.</span></h1>
        <p className="text-stone-500 font-medium text-lg mb-8">What are you looking for today?</p>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat) => (
                <button key={cat.name} onClick={() => setActiveCategory(cat.name)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 ${activeCategory === cat.name ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100'}`}>
                    <cat.icon className="h-4 w-4" />{cat.name}
                </button>
            ))}
        </div>
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-6">
        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">{[1,2,3,4].map(i => <div key={i} className="h-96 bg-stone-200 rounded-3xl animate-pulse"></div>)}</div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
                <div 
                    key={product.id} 
                    onClick={() => navigate(`/product/${product.id}`)} 
                    className="group bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                >
                    <div className="relative h-64 rounded-2xl overflow-hidden bg-stone-100">
                        <img src={product.images && product.images.length > 0 ? (product.images[0].image.startsWith('http') ? product.images[0].image : `http://127.0.0.1:8000${product.images[0].image}`) : getPlaceholder(product.id)} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholder(product.id); }} />
                        <div className="absolute top-3 left-3"><span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-md shadow-sm ${product.condition === 'new' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-stone-800'}`}>{product.condition}</span></div>
                        
                        {/* CHAT BUTTON */}
                        <button 
                            onClick={(e) => handleChatStart(e, product)} 
                            className="absolute bottom-3 right-3 p-3 bg-white text-orange-600 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-orange-600 hover:text-white"
                        >
                            <MessageCircle className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="pt-4 px-2 pb-2">
                        <h3 className="font-bold text-lg text-stone-800 line-clamp-1 group-hover:text-orange-600 transition-colors">{product.title}</h3>
                        <p className="text-sm text-stone-500 line-clamp-2 mb-4 h-10">{product.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-2xl font-black text-stone-900">₹{product.price}</span>
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-wide bg-stone-100 px-2 py-1 rounded-md">{product.product_type}</div>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="bg-orange-50 p-6 rounded-full mb-4"><ShoppingBag className="h-12 w-12 text-orange-400" /></div>
            <h3 className="text-xl font-bold text-stone-800">No items found</h3>
            <p className="text-stone-500">Be the first to list something!</p>
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-10 right-10 p-5 bg-stone-900 text-white rounded-full shadow-2xl hover:bg-orange-600 hover:scale-110 hover:rotate-90 transition-all duration-300 z-40">
        <Plus className="h-8 w-8" />
      </button>

      {/* ADD PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-900">List an Item</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6 text-gray-500" /></button>
                </div>
                
                <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Title</label><input type="text" required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all" placeholder="e.g. Calculus Textbook" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} /></div>
                    <div className="flex gap-4">
                        <div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label><input type="number" required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all" placeholder="500" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div>
                        <div className="flex-1"><label className="block text-sm font-bold text-gray-700 mb-1">Category</label><select className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}><option value="electronics">Electronics</option><option value="books">Books</option><option value="clothing">Clothing</option><option value="furniture">Furniture</option><option value="other">Other</option></select></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Description</label><textarea required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all h-24 resize-none" placeholder="Describe the condition, usage, etc." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea></div>
                    <div className="flex gap-4">
                        <select className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" value={newProduct.condition} onChange={e => setNewProduct({...newProduct, condition: e.target.value})}><option value="new">Brand New</option><option value="used">Used</option></select>
                        <select className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500" value={newProduct.product_type} onChange={e => setNewProduct({...newProduct, product_type: e.target.value})}><option value="sale">For Sale</option><option value="rent">For Rent</option></select>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setNewProduct({...newProduct, images: e.target.files})} />
                        <div className="flex flex-col items-center justify-center text-gray-400"><ImageIcon className="h-8 w-8 mb-2" /><span className="text-sm font-medium">{newProduct.images && newProduct.images.length > 0 ? `${newProduct.images.length} files selected` : "Click to upload images"}</span></div>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-700 transition-all flex justify-center items-center gap-2">{submitting ? <Loader2 className="animate-spin" /> : "Post Item"}</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;