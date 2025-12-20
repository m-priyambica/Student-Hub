import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const response = await fetch("http://127.0.0.1:8000/api/auth/verify-email/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ otp }),
        });

        if (response.ok) {
            alert("Email Verified Successfully! Please Login.");
            navigate("/"); // Redirect to Login
        } else {
            alert("Invalid OTP. Please try again.");
        }
    } catch (err) {
        alert("Server error.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white font-sans text-slate-900 py-12 px-6 relative">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.6] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Back Button */}
      <button onClick={() => navigate("/")} className="absolute top-8 left-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all text-slate-500 hover:text-orange-600 z-50">
          <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up text-center">
        
        {/* --- ICON SECTION --- */}
        <div className="mx-auto w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-8 shadow-sm">
            <Mail className="w-10 h-10 text-orange-600 animate-bounce" />
        </div>

        {/* Header */}
        <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Check your Inbox</h2>
        <p className="text-slate-500 text-lg font-medium mb-10">
            We sent a 6-digit code to your email.<br/>
            Enter it below to verify your account.
        </p>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
            
            {/* High Contrast Input */}
            <div className="relative">
                <input 
                    type="text" 
                    maxLength="6" 
                    placeholder="000000" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full text-center text-4xl font-black tracking-[0.5em] py-6 bg-slate-100 border-2 border-slate-200 rounded-3xl focus:bg-white focus:border-orange-500 outline-none transition-all placeholder-slate-300 text-slate-800 shadow-inner"
                />
            </div>

            {/* Solid Orange Button */}
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-orange-500/20 flex justify-center items-center gap-2 transition-all transform active:scale-[0.98] text-lg"
            >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Verify Account"}
            </button>
        </form>
        
        <p className="mt-8 text-slate-400 text-sm font-medium">
            Didn't get the email? <button className="text-orange-600 hover:underline font-bold">Resend</button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;