import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Added MessageCircle to imports
import { ArrowLeft, Send, Mic, Image as ImageIcon, Search, MessageCircle } from "lucide-react";

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  // 1. Load Chats (List of conversations)
  useEffect(() => {
    if (!token) { navigate("/"); return; }
    
    fetch("http://127.0.0.1:8000/api/chat/my-chats/", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        setChats(data);
        if (data.length > 0) setActiveChat(data[0].id); // Auto-select first chat
    })
    .catch(err => console.error("Error loading chats:", err));
  }, [navigate, token]);

  // 2. Poll Messages (Load texts for active chat)
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = () => {
        fetch(`http://127.0.0.1:8000/api/chat/${activeChat}/messages/`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => { 
            // FIXED: Update 'messages', not 'chats'
            setMessages(data); 
        })
        .catch(err => console.error("Chat Error:", err));
    };

    fetchMessages(); // Initial load
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval); // Cleanup on unmount
  }, [activeChat, token]);

  // 3. Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const formData = new FormData();
    formData.append("text", newMessage);
    
    try {
        await fetch(`http://127.0.0.1:8000/api/chat/${activeChat}/messages/`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        setNewMessage("");
        // Immediate refresh to show new message
        fetch(`http://127.0.0.1:8000/api/chat/${activeChat}/messages/`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setMessages(data));
    } catch (err) {
        console.error("Failed to send:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#fafaf9] font-sans text-stone-900">
      
      {/* SIDEBAR */}
      <div className="w-1/3 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-5 border-b border-stone-100 flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ArrowLeft className="h-5 w-5 text-stone-500" /></button>
            <h2 className="font-black text-2xl tracking-tight">Messages</h2>
        </div>
        
        {/* Search Chats */}
        <div className="p-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <input type="text" placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"/>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
                <div 
                    key={chat.id} 
                    onClick={() => setActiveChat(chat.id)}
                    className={`p-4 border-b border-stone-50 cursor-pointer hover:bg-orange-50/50 transition-colors flex gap-4 ${activeChat === chat.id ? 'bg-orange-50 border-r-4 border-orange-500' : ''}`}
                >
                    <img src={chat.product_image ? `http://127.0.0.1:8000${chat.product_image}` : "https://via.placeholder.com/50"} className="w-12 h-12 rounded-xl object-cover bg-stone-200 shadow-sm" alt="" />
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-stone-800 text-sm truncate">{chat.other_member_name}</h4>
                            <span className="text-xs text-stone-400 font-medium">Active</span>
                        </div>
                        <p className="text-xs text-stone-500 font-medium truncate flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                            RE: {chat.product_title}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#fafaf9]">
        {activeChat ? (
            <>
                {/* Chat Header */}
                <div className="p-4 bg-white border-b border-stone-200 flex justify-between items-center shadow-sm z-10">
                    <div>
                        <h3 className="font-bold text-lg">Chatting about Item #{activeChat}</h3>
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online</p>
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_email === "me" ? 'justify-end' : 'justify-start'}`}>
                            {/* Note: In a real app, 'me' logic should compare msg.sender with currentUser.id */}
                            <div className={`p-4 rounded-2xl max-w-md shadow-sm ${msg.sender_email === "me" ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white text-stone-800 rounded-bl-none border border-stone-100'}`}>
                                <p className="text-xs opacity-70 mb-1 font-bold">{msg.sender_name}</p>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-stone-200">
                    <form onSubmit={handleSend} className="flex gap-2 items-center bg-stone-50 p-2 rounded-2xl border border-stone-200 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 transition-all">
                        <button type="button" className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-xl transition-colors"><ImageIcon className="h-5 w-5"/></button>
                        <button type="button" className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-xl transition-colors"><Mic className="h-5 w-5"/></button>
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent px-2 outline-none text-stone-800 font-medium placeholder-stone-400"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="p-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-md hover:shadow-lg transform active:scale-95">
                            <Send className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
                <MessageCircle className="h-24 w-24 mb-4 opacity-20" />
                <p className="text-xl font-bold text-stone-400">Select a conversation to start chatting</p>
            </div>
        )}
      </div>

    </div>
  );
};

export default Chat;