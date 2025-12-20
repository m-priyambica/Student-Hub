import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Loader2, ShieldCheck } from "lucide-react";

const ResetPasswordConfirm = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ security_answer_1: "", security_answer_2: "", new_password: "" });
  const [loading, setLoading] = useState(false);

  if (!state) return <div className="p-10 text-center">Invalid access. Go back.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const res = await fetch("http://127.0.0.1:8000/api/auth/reset-password/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, username: state.username })
        });
        
        if (res.ok) {
            alert("Password Reset Successfully! Please Login.");
            navigate("/");
        } else {
            alert("Incorrect answers.");
        }
    } catch (err) { alert("Error"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans p-6">
       <div className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-black">Security Check</h2>
          <p className="text-slate-500">Answer your security questions for <b>{state.username}</b>.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-sm font-bold text-orange-800 mb-2 flex gap-2"><ShieldCheck className="w-4 h-4"/> {state.question_1}</p>
                <input type="text" placeholder="Answer 1" required onChange={e => setFormData({...formData, security_answer_1: e.target.value})} className="w-full p-2 bg-white rounded-lg border border-orange-200 outline-none"/>
             </div>
             <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-sm font-bold text-orange-800 mb-2 flex gap-2"><ShieldCheck className="w-4 h-4"/> {state.question_2}</p>
                <input type="text" placeholder="Answer 2" required onChange={e => setFormData({...formData, security_answer_2: e.target.value})} className="w-full p-2 bg-white rounded-lg border border-orange-200 outline-none"/>
             </div>
             
             <div className="relative mt-6">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input type="password" placeholder="New Password" required onChange={e => setFormData({...formData, new_password: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-green-500 font-bold"/>
             </div>

             <button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center">
                {loading ? <Loader2 className="animate-spin" /> : "Reset Password"}
             </button>
          </form>
       </div>
    </div>
  );
};
export default ResetPasswordConfirm;