import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

const ResetPasswordStart = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
        const res = await fetch("http://127.0.0.1:8000/api/auth/get-questions/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        
        if (res.ok) {
            // SUCCESS: The backend returns the ACTUAL questions the user chose.
            // We pass these questions to the next page.
            navigate("/reset-password-confirm", { state: { ...data, username } });
        } else {
            setError(data.error || "User not found");
        }
    } catch (err) {
        setError("Server error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans text-slate-900 p-6">
       <Link to="/" className="absolute top-8 left-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all"><ArrowLeft className="w-6 h-6 text-slate-500" /></Link>
       
       <div className="w-full max-w-md">
          <h2 className="text-3xl font-black mb-2">Reset Password</h2>
          <p className="text-slate-500 mb-8">Enter your username to find your account.</p>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input type="text" placeholder="Username" required value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-700"/>
             </div>
             <button disabled={loading} className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5"/></>}
             </button>
          </form>
       </div>
    </div>
  );
};
export default ResetPasswordStart;