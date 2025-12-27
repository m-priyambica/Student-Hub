import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, MapPin, ShieldCheck, BookOpen } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);

  // --- HELPER: Fix Image URLs ---
  const getImageUrl = (path) => {
      if (!path) return "https://via.placeholder.com/600";
      return path.startsWith('http') ? path : `https://student-hub-quqc.onrender.com${path}`;
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setLoading(true);

    fetch(`https://student-hub-quqc.onrender.com/api/products/${id}/`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
    })
    .then(data => {
        // DEBUG: Check your console to see if branch/sem are arriving!
        console.log("Full Product Data Received:", data); 
        console.log("Seller Data:", data.seller);

        setProduct(data);
        const firstImg = data.images.length > 0 ? getImageUrl(data.images[0].image) : "https://via.placeholder.com/600";
        setActiveImage(firstImg);
        
        // Fetch similar items...
        fetch("https://student-hub-quqc.onrender.com/api/products/", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(allProducts => {
            const similar = allProducts
                .filter(p => p.category === data.category && p.id !== data.id)
                .slice(0, 4);
            setSimilarProducts(similar);
            setLoading(false);
        });
    })
    .catch(err => {
        console.error(err);
        navigate("/dashboard");
    });
  }, [id, navigate]);

  const handleChatStart = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return alert("Please login to chat.");
    try {
        const response = await fetch("https://student-hub-quqc.onrender.com/api/chat/start/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ product_id: product.id })
        });
        if (response.ok) navigate("/chat"); 
        else alert("Could not start chat.");
    } catch (err) { alert("Connection error."); }
  };

  // --- GET SELLER INFO ---
  const getSellerInfo = () => {
    if (!product) return { name: "Loading...", details: "" };

    let name = "Student Seller";
    let details = "";

    if (product.seller && typeof product.seller === 'object') {
        const s = product.seller;
        
        // 1. Name
        if (s.first_name || s.last_name) name = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        else if (s.username) name = s.username;

        // 2. Details (Smart Construction)
        const parts = [];
        
        // Helper to clean data (removes "null", "undefined", empty strings)
        const isValid = (str) => str && str !== "null" && str !== "undefined" && str.trim() !== "";

        if (isValid(s.branch)) parts.push(s.branch.toUpperCase());
        if (isValid(s.semester)) parts.push(s.semester);
        if (isValid(s.section)) parts.push(`Sec ${s.section}`);
        
        if (parts.length > 0) details = parts.join(" • ");
    } 
    return { name, details };
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;

  const { name: sellerName, details: sellerDetails } = getSellerInfo();

  return (
    <div className="min-h-screen bg-[#fafaf9] py-6 px-4 sm:px-6 lg:px-8 font-sans text-stone-800">
      <button onClick={() => navigate("/dashboard")} className="flex items-center text-stone-500 hover:text-orange-600 font-bold mb-6 transition-colors">
        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Marketplace
      </button>

      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden border border-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-6 md:p-8 bg-stone-50 flex flex-col gap-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-white">
                    <img src={activeImage} alt={product.title} className="w-full h-full object-contain" />
                </div>
                {product.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {product.images.map((img) => (
                            <button key={img.id} onClick={() => setActiveImage(getImageUrl(img.image))} className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === getImageUrl(img.image) ? 'border-orange-500 scale-95' : 'border-transparent hover:border-stone-300'}`}>
                                <img src={getImageUrl(img.image)} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 md:p-8 lg:p-12 flex flex-col h-full">
                <div className="flex flex-col items-start mb-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${product.condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{product.condition}</span>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-2">{product.title}</h1>
                    <div className="flex items-center text-stone-500 text-sm font-medium">
                        <MapPin className="h-4 w-4 mr-1" /> Stanley College Campus <span className="mx-2">•</span> <span>Category: {product.category}</span>
                    </div>
                </div>

                <div className="text-4xl font-black text-slate-900 mb-8">₹{product.price} <span className="text-lg text-stone-400 font-medium">/ {product.product_type}</span></div>
                
                <div className="prose prose-stone mb-8 flex-grow">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Description</h3>
                    <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>

                <div className="flex items-center p-4 bg-stone-50 rounded-2xl mb-8 border border-stone-100">
                    <div className="h-12 w-12 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 font-bold text-lg shadow-sm">
                         {sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4 flex-1">
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Posted by</p>
                        <p className="text-lg font-bold text-slate-900 flex items-center gap-2">{sellerName} <ShieldCheck className="h-4 w-4 text-orange-500" /></p>
                        
                        {sellerDetails ? (
                            <p className="text-xs font-bold text-stone-500 flex items-center gap-1 mt-0.5">
                                <BookOpen className="h-3 w-3"/> {sellerDetails}
                            </p>
                        ) : (
                            <p className="text-xs font-bold text-stone-400 flex items-center gap-1 mt-0.5">Student at Stanley College</p>
                        )}
                    </div>
                </div>

                <div className="mt-auto">
                    <button onClick={handleChatStart} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-orange-100 hover:bg-orange-700 transition-transform active:scale-95 flex items-center justify-center gap-2">
                        <MessageCircle className="h-5 w-5" /> Chat with Seller
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 mb-10">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Similar items you might like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(item => (
                <div key={item.id} onClick={() => { navigate(`/product/${item.id}`); window.scrollTo(0, 0); }} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                    <div className="h-48 bg-stone-100 rounded-xl overflow-hidden mb-4 relative">
                         <img src={getImageUrl(item.images[0]?.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/300"; }}/>
                         <span className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 text-xs font-bold rounded-md uppercase text-stone-800">{item.condition}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 truncate mb-1">{item.title}</h3>
                    <p className="text-orange-600 font-black">₹{item.price}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
export default ProductDetail;