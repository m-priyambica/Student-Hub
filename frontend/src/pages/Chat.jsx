import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
    Send, ArrowLeft, Package, MessageCircle, 
    CheckCircle, DollarSign, Loader2, ShieldCheck, Trash2
} from "lucide-react";

// --- DEAL MODAL (Green Themed) ---
const DealModal = ({ isOpen, onClose, product, buyerName, onConfirm, loading }) => {
    if (!isOpen) return null;
    const [days, setDays] = useState(7);

    return (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
                {/* Green Header */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex justify-center border-b border-green-100">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-green-100 text-green-600">
                        <DollarSign className="h-10 w-10" />
                    </div>
                </div>
                
                <div className="p-6 text-center">
                    <h3 className="text-2xl font-black text-stone-900 mb-2">Confirm Deal?</h3>
                    <p className="text-stone-500 font-medium text-sm mb-6 leading-relaxed">
                        Mark <span className="text-stone-900 font-bold">{product?.title}</span> as 
                        {product?.product_type === 'rent' ? ' rented ' : ' sold '} 
                        to <span className="text-green-700 font-bold">{buyerName}</span>.
                    </p>
                    
                    {product?.product_type === 'rent' && (
                        <div className="mb-6 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Return Due (Days)</label>
                            <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className="w-full bg-transparent font-black text-center text-3xl outline-none text-stone-800"/>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3.5 font-bold text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">Cancel</button>
                        <button onClick={() => onConfirm(days)} disabled={loading} className="flex-1 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-200">
                            {loading ? <Loader2 className="animate-spin h-5 w-5"/> : <>Confirm <CheckCircle className="h-5 w-5"/></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN CHAT ---
const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const scrollRef = useRef(null);
    
    // State
    const [chats, setChats] = useState([]); 
    const [activeChat, setActiveChat] = useState(null); 
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal & Loading States
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [dealLoading, setDealLoading] = useState(false);

    // Auto-scroll
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, activeChat]);

    // 1. Initial Load (User & Chats)
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { navigate("/"); return; }

        const init = async () => {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser({ id: payload.user_id });

                const res = await fetch("https://student-hub-quqc.onrender.com/api/chat/rooms/", { 
                    headers: { "Authorization": `Bearer ${token}` } 
                });
                if (res.ok) {
                    const data = await res.json();
                    setChats(data);
                }
            } catch (err) {
                console.error("Connection Error", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate]);


    useEffect(() => {
        const requestedRoomId = location.state?.roomId;
        if (!requestedRoomId || chats.length === 0) return;

        const targetRoom = chats.find(chat => String(chat.id) === String(requestedRoomId));
        if (targetRoom) {
            setActiveChat(targetRoom);
        }
    }, [chats, location.state]);
    // 2. Load Messages (With SMART POLLING)
    useEffect(() => {
        if (!activeChat) return;

        let intervalId;
        // Start fast
        let currentInterval = 3000; 

        const fetchMessages = async () => {
            const token = localStorage.getItem("access_token");
            try {
                const res = await fetch(`https://student-hub-quqc.onrender.com/api/chat/${activeChat.id}/messages/`, { 
                    headers: { "Authorization": `Bearer ${token}` } 
                });
                if (res.ok) setMessages(await res.json());
            } catch (err) { console.error("Msg Error", err); }
        };

        // Initial fetch
        fetchMessages();

        // --- SMART POLLING LOGIC ---
        const startPolling = (interval) => {
            clearInterval(intervalId);
            intervalId = setInterval(fetchMessages, interval);
        };

        // Start with fast polling (3s)
        startPolling(3000);

        // A. DETECT ACTIVITY (Mouse/Keyboard)
        const handleActivity = () => {
            if (document.hidden) return; // Don't speed up if tab is hidden
            if (currentInterval !== 3000) {
                currentInterval = 3000;
                startPolling(3000); // Resume fast polling
            }
        };

        // B. SLOW DOWN ON INACTIVITY (Tab Hidden)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                currentInterval = 60000; // Slow to 60s if tab hidden
                startPolling(60000);
            } else {
                fetchMessages(); // Update immediately on return
                currentInterval = 3000;
                startPolling(3000);
            }
        };

        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [activeChat]);

    // 3. Send Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        // Optimistic Update
        const tempMsg = { id: Date.now(), text: newMessage, senderId: currentUser.id };
        setMessages([...messages, tempMsg]);
        setNewMessage("");

        const token = localStorage.getItem("access_token");
        try {
            await fetch(`https://student-hub-quqc.onrender.com/api/chat/${activeChat.id}/send/`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ text: tempMsg.text })
            });
        } catch (err) { console.error("Send failed"); }
    };

    // 4. Confirm Deal (Green Logic)
    const handleConfirmDeal = async (days) => {
        if (!activeChat) return;
        setDealLoading(true);
        const token = localStorage.getItem("access_token");

        try {
            // A. Create Transaction Record
            const res = await fetch("https://student-hub-quqc.onrender.com/api/chat/transaction/create/", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    product_id: activeChat.product.id, 
                    buyer_id: activeChat.buyer.id, 
                    type: activeChat.product.product_type, 
                    days: days 
                })
            });

            if (res.ok) {
                // B. Send Green System Message to Chat
                await fetch(`https://student-hub-quqc.onrender.com/api/chat/${activeChat.id}/send/`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ text: "✅ DEAL CONFIRMED! The item has been marked as sold/rented." })
                });
                
                alert("Deal Confirmed! Updated in Profile.");
                setIsDealModalOpen(false);
            } else {
                alert("Transaction Failed.");
            }
        } catch (err) { alert("Network Error"); } 
        finally { setDealLoading(false); }
    };

    // 5. Delete Chat
    const handleDeleteChat = async () => {
        if(!confirm("Permanently delete this conversation? This cannot be undone.")) return;
        
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`https://student-hub-quqc.onrender.com/api/chat/${activeChat.id}/delete/`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                setChats(chats.filter(c => c.id !== activeChat.id));
                setActiveChat(null);
            } else {
                alert("Could not delete chat.");
            }
        } catch (e) { alert("Connection Error"); }
    };

    // --- LOGIC: Check if Deal is Done ---
    const isDealDone = messages.some(msg => msg.text.includes("✅ DEAL CONFIRMED"));
    const isSeller = activeChat && currentUser && String(activeChat.product.seller) === String(currentUser.id);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-stone-400 bg-[#fafaf9]">
            <Loader2 className="animate-spin mr-2"/> Loading Messages...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafaf9] flex font-sans text-stone-900 overflow-hidden">
            
            {/* ================= SIDEBAR ================= */}
            <aside className={`w-full md:w-[24rem] bg-white border-r border-stone-200 flex flex-col h-screen fixed md:relative z-20 transition-transform duration-300 ${activeChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                <div className="p-6 border-b border-stone-100 bg-white sticky top-0 z-10 flex items-center gap-4">
                    <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors group">
                        <ArrowLeft className="h-6 w-6 text-stone-500 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <h1 className="text-3xl font-black tracking-tighter">Chats</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chats.length === 0 ? (
                        <div className="text-center py-10 text-stone-400">
                            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50"/>
                            <p className="text-sm font-bold">No active chats</p>
                        </div>
                    ) : (
                        chats.map(chat => {
                            const isMeSeller = String(chat.product.seller) === String(currentUser?.id);
                            const otherName = isMeSeller ? chat.buyer.username : chat.seller.username;
                            const showNotification = chat.last_sender_id && String(chat.last_sender_id) !== String(currentUser?.id);

                            return (
                                <div 
                                    key={chat.id} 
                                    onClick={() => setActiveChat(chat)} 
                                    className={`relative p-4 rounded-2xl cursor-pointer border transition-all ${activeChat?.id === chat.id ? 'bg-stone-900 border-stone-900 shadow-xl' : 'bg-white border-stone-100 hover:border-orange-200 hover:shadow-md'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${activeChat?.id === chat.id ? 'bg-stone-800 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                                {otherName[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-base ${activeChat?.id === chat.id ? 'text-white' : 'text-stone-900'}`}>{otherName}</h4>
                                                <span className={`text-[10px] font-bold uppercase ${activeChat?.id === chat.id ? 'text-stone-400' : 'text-stone-400'}`}>{isMeSeller ? 'Buyer' : 'Seller'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`flex items-center gap-2 p-2 rounded-lg mt-2 ${activeChat?.id === chat.id ? 'bg-stone-800/50' : 'bg-stone-50'}`}>
                                        <Package className={`h-4 w-4 ${activeChat?.id === chat.id ? 'text-stone-400' : 'text-orange-500'}`}/>
                                        <span className={`text-xs font-bold truncate ${activeChat?.id === chat.id ? 'text-stone-300' : 'text-stone-600'}`}>{chat.product.title}</span>
                                    </div>

                                    {showNotification && (
                                        <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* ================= MAIN CHAT AREA ================= */}
            <main className={`flex-1 flex flex-col bg-[#fafaf9] h-screen relative ${!activeChat ? 'hidden md:flex' : 'flex fixed inset-0 md:static z-30'}`}>
                {activeChat ? (
                    <>
                        {/* Header */}
                        <header className="bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-stone-200 flex justify-between items-center shadow-sm z-40">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 bg-stone-100 rounded-full text-stone-600">
                                    <ArrowLeft className="h-5 w-5"/>
                                </button>
                                
                                <div>
                                    <h2 className="font-black text-xl text-stone-900 flex items-center gap-2">
                                        {String(activeChat.product.seller) === String(currentUser.id) ? activeChat.buyer.username : activeChat.seller.username}
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                    </h2>
                                    <p className="text-xs font-bold text-stone-400">Active Now</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button onClick={handleDeleteChat} className="p-2.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Delete Conversation">
                                    <Trash2 className="h-5 w-5"/>
                                </button>

                                {/* Confirm Deal Button (Seller Only) */}
                                {isSeller && (
                                    <button 
                                        onClick={() => setIsDealModalOpen(true)} 
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-200 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <CheckCircle className="h-4 w-4" /> 
                                        <span className="hidden sm:inline">Complete Deal</span>
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#fafaf9]">
                            
                            {/* --- GREEN NOTICE (ONLY FOR SELLER WHEN DEAL IS DONE) --- */}
                            {isDealDone && isSeller && (
                                <div className="bg-green-100 p-4 rounded-xl text-center border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-2 mx-auto max-w-md">
                                    <p className="text-green-800 font-bold text-sm flex items-center justify-center gap-2">
                                        <CheckCircle className="h-4 w-4"/> Is the deal done?
                                    </p>
                                    <p className="text-green-700 text-xs mt-1 font-medium">
                                        Don't forget to delete the product from your store to stop receiving new inquiries!
                                    </p>
                                </div>
                            )}

                            {messages.map(msg => {
                                const isSystemMsg = msg.text.includes("✅");
                                const isMe = String(msg.senderId) === String(currentUser.id);

                                return (
                                    <div key={msg.id} className={`flex ${isSystemMsg ? 'justify-center' : (isMe ? 'justify-end' : 'justify-start')}`}>
                                        
                                        {isSystemMsg ? (
                                            // GREEN SYSTEM MESSAGE (The Chat Bubble)
                                            <div className="bg-green-100 border border-green-200 text-green-800 px-6 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                                                {msg.text}
                                            </div>
                                        ) : (
                                            // REGULAR MESSAGE
                                            <div className={`max-w-[80%] md:max-w-[60%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                                                isMe 
                                                ? 'bg-orange-600 text-white rounded-br-none' 
                                                : 'bg-white border border-stone-200 text-stone-700 rounded-bl-none'
                                            }`}>
                                                {msg.text}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-stone-200">
                            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex gap-3 items-center">
                                <input 
                                    type="text" 
                                    className="flex-1 bg-stone-100 hover:bg-stone-50 focus:bg-white p-4 pr-14 rounded-2xl font-medium outline-none border-2 border-transparent focus:border-orange-500 transition-all text-stone-800 placeholder-stone-400" 
                                    placeholder="Type a message..." 
                                    value={newMessage} 
                                    onChange={e => setNewMessage(e.target.value)} 
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className="absolute right-2 p-2.5 bg-stone-900 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-stone-900 transition-colors shadow-md"
                                >
                                    <Send className="h-5 w-5"/>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8 text-center bg-stone-50/50">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-stone-200 animate-in zoom-in duration-500">
                            <MessageCircle className="h-14 w-14 text-orange-500" />
                        </div>
                        <h3 className="text-3xl font-black text-stone-800 mb-3 tracking-tight">Your Messages</h3>
                        <p className="max-w-md mx-auto text-stone-500 font-medium leading-relaxed">
                            Select a conversation to start chatting.
                        </p>
                    </div>
                )}
            </main>

            <DealModal isOpen={isDealModalOpen} onClose={() => setIsDealModalOpen(false)} onConfirm={handleConfirmDeal} loading={dealLoading} product={activeChat?.product} buyerName={activeChat?.buyer.username} />
        </div>
    );
};

export default Chat;