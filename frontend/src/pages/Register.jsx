import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, FileText, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "", email: "", full_name: "", password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
        const response = await fetch("https://student-hub-quqc.onrender.com/api/auth/register/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            navigate("/verify-email", { state: { email: formData.email } });
        } else {
            const errorMsg = typeof data === 'string' ? data : Object.values(data).flat().join(" ");
            setError(errorMsg || "Registration failed.");
        }
    } catch (err) {
        setError("Server connection failed.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white font-sans text-slate-900 py-12 px-6 relative overflow-y-auto">
      
      <Link to="/" className="fixed top-8 left-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all text-slate-500 hover:text-orange-600 z-50">
          <ArrowLeft className="w-6 h-6" />
      </Link>

      <div className="w-full max-w-xl relative z-10 animate-fade-in-up">
        
        {/* MASCOT SECTION */}
        <div className="relative w-fit mx-auto mb-4 flex flex-col items-center">
            <div className="w-40 h-40">
                <video className="w-full h-full object-contain mix-blend-multiply" autoPlay loop muted playsInline>
                    <source src="/mascot.mp4" type="video/mp4" />
                </video>
            </div>
            <div className="absolute -top-2 -right-24 bg-white px-4 py-2 rounded-2xl rounded-bl-none border-2 border-slate-100 animate-bounce" style={{animationDuration: '3s'}}>
                <p className="text-sm font-bold text-orange-600 whitespace-nowrap">Join Us! 🧡</p>
            </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Create Account</h2>
            <p className="text-slate-500 mt-3 text-lg font-medium">It only takes a minute.</p>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-600 px-6 py-4 rounded-2xl mb-8 text-sm font-bold animate-pulse text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
            
            {/* Row 1: Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <input type="text" name="username" placeholder="Username" required onChange={handleChange} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder-slate-400"
                    />
                </div>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                        <FileText className="w-5 h-5" />
                    </div>
                    <input type="text" name="full_name" placeholder="Full Name" required onChange={handleChange} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Row 2: ConAtact */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                    <Mail className="w-5 h-5" />
                </div>
                <input type="email" name="email" placeholder=" Email Id " required onChange={handleChange} 
                    className="w-full pl-12 pr-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder-slate-400"
                />
            </div>

            {/* Row 3: Password */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                    <Lock className="w-5 h-5" />
                </div>
                <input type="password" name="password" placeholder="Password" required onChange={handleChange} 
                    className="w-full pl-12 pr-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder-slate-400"
                />
            </div>

            <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-orange-500/20 flex justify-center items-center gap-2 transition-all transform active:scale-[0.98] mt-8 text-lg"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight className="h-5 w-5" /></>}
            </button>

        </form>

        <p className="text-center mt-12 text-slate-500 font-medium">
            Already have an account? <Link to="/" className="text-orange-600 font-bold hover:underline transition-colors">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;