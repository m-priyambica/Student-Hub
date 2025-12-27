import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const ResetPasswordConfirm = () => {
    // 1. Grab the parameters correctly based on App.jsx route /:uid/:token
    const { uid, token } = useParams(); 
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Client-side validation
        if (newPassword !== confirmPassword) {
            setStatus({ type: "error", message: "Passwords do not match." });
            return;
        }
        if (newPassword.length < 8) {
            setStatus({ type: "error", message: "Password must be at least 8 characters." });
            return;
        }

        setLoading(true);
        setStatus({ type: "", message: "" });

        // Debugging log to ensure we aren't sending "undefined"
        console.log("Submitting Password Reset:", { uid, token, newPassword });

        try {
            // Adjust this URL if your backend endpoint is slightly different (e.g., using POST instead of PATCH)
            const response = await fetch(`http://127.0.0.1:8000/api/auth/password-reset-confirm/${uid}/${token}/`, {
                method: "PATCH", // Changed to PATCH to match your console screenshot
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: newPassword,
                    confirm_password: confirmPassword, // Some backends require this field
                    uid: uid,
                    token: token, 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: "success", message: "Password reset successful! Redirecting..." });
                setTimeout(() => navigate("/"), 3000);
            } else {
                // Handle backend errors
                const errorMsg = data.detail || data.password?.[0] || data.token?.[0] || "Link invalid or expired.";
                setStatus({ type: "error", message: errorMsg });
            }
        } catch (error) {
            console.error("Reset error:", error);
            setStatus({ type: "error", message: "Server connection failed. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-center items-center px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-stone-200 border border-white">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-stone-800 mb-2">Set New Password</h2>
                    <p className="text-stone-500 font-medium">Please create a strong password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="New Password"
                            required
                            className="w-full pl-12 pr-12 py-4 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <input 
                            type="password" 
                            placeholder="Confirm Password"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {status.message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {status.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                            {status.message}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordConfirm;