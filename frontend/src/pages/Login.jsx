import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { User, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); 
  const [displayedText, setDisplayedText] = useState("");
  
  const navigate = useNavigate(); 
  const fullText = "Hey Stanley Mate";

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100); 
    return () => clearInterval(typingInterval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Sending 'username' key, but value can be email or username
      const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access);
        setTimeout(() => {
            setIsLoading(false);
            navigate("/dashboard"); 
        }, 500);
      } else {
        // Handle array of errors or simple string
        const errMsg = data.detail || (data.non_field_errors ? data.non_field_errors[0] : "Invalid credentials.");
        setError(errMsg);
        setIsLoading(false);
      }
    } catch (err) {
      setError("Unable to connect to the server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-white font-sans text-slate-900">
      
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm px-4 flex flex-col items-center">
        
        {/* CHARACTER AREA */}
        <div className="relative mb-6">
            <div className="w-40 h-40 flex items-center justify-center">
                <video className="w-full h-full object-contain mix-blend-multiply" autoPlay loop muted playsInline>
                    <source src="/mascot.mp4" type="video/mp4" />
                </video>
            </div>
            <div className={`absolute top-10 left-[95%] w-max bg-white px-4 py-2 rounded-xl rounded-tl-none shadow-[0_2px_15px_rgb(0,0,0,0.08)] border border-slate-100 transition-all duration-500 ease-out z-20 ${displayedText ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                <p className="text-slate-800 font-bold text-sm">{displayedText} 🚀</p>
                <div className="absolute top-0 -left-[6px] w-3 h-3 overflow-hidden">
                      <div className="w-4 h-4 bg-white border-t border-l border-slate-100 transform -rotate-45 translate-x-2 translate-y-2"></div>
                </div>
            </div>
        </div>

        {/* HEADER */}
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Welcome to <span className="text-orange-600">Student Hub</span>
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Please enter your details.</p>
        </div>

        {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-600 text-sm animate-pulse">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
            </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
            
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300">
                        <User className="w-5 h-5" />
                </div>
                <input 
                    type="text" 
                    placeholder="Username or Email" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 font-medium outline-none transition-all duration-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-orange-300"
                />
            </div>

            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300">
                    <Lock className="w-5 h-5" />
                </div>
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 font-medium outline-none transition-all duration-300 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-orange-300"
                />
            </div>

            <button 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transform active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
            <Link to="/request-password-reset" className="text-slate-500 hover:text-orange-600 text-sm font-medium transition-colors">
                Forgot password?
            </Link>
            <p className="text-slate-500 text-sm">
                New here? <Link to="/register" className="text-orange-600 font-bold cursor-pointer hover:underline">Create Account</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;