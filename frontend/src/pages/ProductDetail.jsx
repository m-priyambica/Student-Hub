import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Heart, Share2, MapPin, ShieldCheck, Star } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams(); // Get the ID from the URL (e.g., 5)
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setLoading(true);

    // 1. Fetch the main product
    fetch(`http://127.0.0.1:8000/api/products/${id}/`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
    })
    .then(data => {
        setProduct(data);
        // Set the first image as active, or a placeholder
        const firstImg = data.images.length > 0 ? getImageUrl(data.images[0].image) : "https://via.placeholder.com/600";
        setActiveImage(firstImg);
        
        // 2. Fetch similar products (This would ideally be a separate API endpoint, 
        // but for now we fetch all and filter client-side for simplicity)
        fetch("http://127.0.0.1:8000/api/products/", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(allProducts => {
            const similar = allProducts.filter(p => p.category === data.category && p.id !== data.id).slice(0, 4);
            setSimilarProducts(similar);
            setLoading(false);
        });
    })
    .catch(err => {
        console.error(err);
        navigate("/dashboard"); // Redirect if error
    });
  }, [id, navigate]);

  // Helper to fix image URLs
  const getImageUrl = (path) => {
      if (!path) return "https://via.placeholder.com/600";
      return path.startsWith('http') ? path : `http://127.0.0.1:8000${path}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;

  return (
    <div className="min-h-screen bg-[#fafaf9] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Back Button */}
      <button onClick={() => navigate("/dashboard")} className="flex items-center text-stone-500 hover:text-orange-600 font-bold mb-8 transition-colors">
        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Marketplace
      </button>

      {/* --- MAIN PRODUCT SECTION --- */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden border border-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            
            {/* LEFT: Image Gallery */}
            <div className="p-8 bg-stone-50 flex flex-col gap-4">
                {/* Main Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-white">
                    <img src={activeImage} alt={product.title} className="w-full h-full object-contain" />
                </div>
                
                {/* Thumbnails */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {product.images.map((img, idx) => (
                        <button 
                            key={img.id} 
                            onClick={() => setActiveImage(getImageUrl(img.image))}
                            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === getImageUrl(img.image) ? 'border-orange-500 scale-95' : 'border-transparent hover:border-stone-300'}`}
                        >
                            <img src={getImageUrl(img.image)} className="w-full h-full object-cover" alt="" />
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Details */}
            <div className="p-8 lg:p-12 flex flex-col">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wide">
                            {product.condition}
                        </span>
                        <h1 className="text-4xl font-black text-slate-900 mt-4 mb-2 leading-tight">{product.title}</h1>
                        <div className="flex items-center text-stone-500 text-sm font-medium mb-6">
                            <MapPin className="h-4 w-4 mr-1" /> Stanley College Campus
                            <span className="mx-2">•</span>
                            <span>Posted 2 days ago</span>
                        </div>
                    </div>
                    <button className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Heart className="h-6 w-6" />
                    </button>
                </div>

                <div className="text-4xl font-black text-slate-900 mb-8">
                    ₹{product.price} <span className="text-lg text-stone-400 font-medium">/ {product.product_type}</span>
                </div>

                <div className="prose prose-stone mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Description</h3>
                    <p className="text-stone-600 leading-relaxed">{product.description}</p>
                </div>

                {/* Seller Info */}
                <div className="flex items-center p-4 bg-stone-50 rounded-2xl mb-8 border border-stone-100">
                    <div className="h-12 w-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {product.seller ? product.seller.toString()[0].toUpperCase() : "U"}
                    </div>
                    <div className="ml-4">
                        <p className="text-sm text-stone-500 font-bold uppercase">Seller</p>
                        <p className="text-lg font-bold text-slate-900 flex items-center gap-1">
                            Student Seller <ShieldCheck className="h-4 w-4 text-green-500" />
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-4 w-4 fill-current" /> 4.8
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-4">
                    <button className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Chat with Seller
                    </button>
                    <button className="p-4 border-2 border-stone-200 rounded-xl text-stone-600 hover:border-orange-200 hover:text-orange-600 transition-colors">
                        <Share2 className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- SIMILAR PRODUCTS --- */}
      <div className="max-w-7xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Similar items you might like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.length > 0 ? similarProducts.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                >
                    <div className="h-40 bg-stone-100 rounded-xl overflow-hidden mb-4 relative">
                         <img 
                            src={getImageUrl(item.images[0]?.image)} 
                            className="w-full h-full object-cover" 
                            alt={item.title}
                        />
                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 text-xs font-bold rounded-md">{item.condition}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 truncate">{item.title}</h3>
                    <p className="text-orange-600 font-black">₹{item.price}</p>
                </div>
            )) : (
                <p className="text-stone-400 col-span-4 text-center py-10">No similar items found.</p>
            )}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;