import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const RequestReset = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Connects to the new Email Reset API
      const response = await fetch("https://student-hub-quqc.onrender.com/api/auth/password-reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // We always show success for security (prevents email scraping)
      if (response.ok) {
        setMessage("If this email is registered, we have sent a reset link to it.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 font-sans">
      <Link to="/" className="fixed top-8 left-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-orange-600 transition-all">
          <ArrowLeft className="w-6 h-6" />
      </Link>

      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
             <div className="p-4 bg-orange-100 rounded-full text-orange-600">
                <Mail className="w-10 h-10" />
             </div>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-2">Forgot Password?</h2>
        <p className="text-slate-500 mb-8 font-medium">Enter your college email to receive a reset link.</p>

        {message ? (
            <div className="p-6 bg-green-50 text-green-700 rounded-2xl border border-green-200 flex flex-col items-center animate-fade-in-up">
                <CheckCircle className="w-10 h-10 mb-2" />
                <p className="font-bold text-center text-lg">{message}</p>
                <p className="text-sm mt-2 text-slate-500 font-medium">Check your inbox (and spam folder).</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                    <input 
                        type="email" 
                        required
                        placeholder="Enter your email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-4 px-4 text-center font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none transition-all placeholder-slate-400"
                    />
                </div>
                {error && <p className="text-red-500 text-sm font-bold animate-pulse">{error}</p>}
                
                <button 
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default RequestReset;