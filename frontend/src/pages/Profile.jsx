import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Package, MessageSquare, Settings, Trash2, LogOut, BarChart3 } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("listings"); // listings, chats, settings
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/"); return; }

    const fetchData = async () => {
      try {
        // 1. Get User Details
        const userRes = await fetch("http://127.0.0.1:8000/api/auth/profile/", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const userData = await userRes.json(); // Declared ONCE here
        setUser(userData);

        // 2. Get ALL Products
        const prodRes = await fetch("http://127.0.0.1:8000/api/products/", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const prodData = await prodRes.json();
        
        // DEBUG: Check IDs in console (F12) to see why listings might be empty
        console.log("User ID:", userData.id);
        console.log("First Product Seller ID:", prodData.length > 0 ? prodData[0].seller : "No products");

        // Filter only MY products (Using loose equality == to match string "5" with number 5)
        const myItems = prodData.filter(p => p.seller == userData.id); 
        
        setMyProducts(myItems);
        setLoading(false);

      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [navigate]);

  // --- DELETE PRODUCT ---
  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const token = localStorage.getItem("access_token");
    const res = await fetch(`http://127.0.0.1:8000/api/products/${productId}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
        alert("Item deleted.");
        setMyProducts(myProducts.filter(p => p.id !== productId));
    } else {
        alert("Failed to delete.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-stone-400">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans text-stone-900 flex">
      
      {/* SIDEBAR NAV */}
      <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex flex-col fixed h-full">
        <div className="p-8">
            <h2 className="text-2xl font-black tracking-tight">My Hub</h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <button onClick={() => setActiveTab("listings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "listings" ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                <Package className="h-5 w-5" /> My Listings
            </button>
            <button onClick={() => navigate("/chat")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-50`}>
                <MessageSquare className="h-5 w-5" /> Messages
            </button>
            <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "settings" ? 'bg-orange-50 text-orange-600' : 'text-stone-500 hover:bg-stone-50'}`}>
                <Settings className="h-5 w-5" /> Settings
            </button>
        </nav>

        <div className="p-4 border-t border-stone-100">
            <button onClick={() => navigate("/dashboard")} className="w-full flex items-center gap-2 justify-center p-3 text-sm font-bold text-stone-500 hover:text-stone-800">
                Back to Marketplace
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-8 lg:p-12">
        
        {/* Header & Analytics */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
                <h1 className="text-4xl font-black text-stone-900 mb-2">Hello, {user.username}!</h1>
                <p className="text-stone-500">Manage your account and listings.</p>
            </div>
            
            {/* Simple Analytics Card */}
            <div className="flex gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 pr-8">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Package className="h-6 w-6"/></div>
                    <div>
                        <p className="text-xs font-bold text-stone-400 uppercase">Active Listings</p>
                        <p className="text-2xl font-black text-stone-900">{myProducts.length}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- TAB: LISTINGS --- */}
        {activeTab === "listings" && (
            <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Package className="h-5 w-5 text-orange-500"/> Your Items for Sale</h3>
                
                {myProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
                        <p className="text-stone-400">You haven't listed anything yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myProducts.map(product => (
                            <div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all group">
                                <div className="relative h-48 bg-stone-100 rounded-xl overflow-hidden mb-3">
                                    <img src={product.images[0]?.image || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">₹{product.price}</div>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="font-bold text-stone-800 truncate flex-1">{product.title}</h4>
                                    <button 
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Item"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- TAB: SETTINGS --- */}
        {activeTab === "settings" && (
            <div className="max-w-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="h-5 w-5 text-orange-500"/> Account Settings</h3>
                
                <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-stone-700 mb-2">Full Name</label>
                        <input type="text" value={user.full_name} readOnly className="w-full p-3 bg-stone-50 rounded-xl border-2 border-stone-100 text-stone-500" />
                        <p className="text-xs text-stone-400 mt-2">Contact admin to change your name.</p>
                    </div>

                    <div className="border-t border-stone-100 my-6"></div>

                    <h4 className="font-bold text-stone-900 mb-4">Security</h4>
                    <button 
                        onClick={() => {
                            if(confirm("To reset your password, we will log you out and take you to the Security Check page. Continue?")) {
                                localStorage.removeItem("access_token");
                                navigate("/reset-password-start");
                            }
                        }}
                        className="w-full py-3 border-2 border-stone-200 rounded-xl font-bold text-stone-600 hover:border-orange-500 hover:text-orange-600 transition-all"
                    >
                        Change Password (via Security Check)
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default Profile;