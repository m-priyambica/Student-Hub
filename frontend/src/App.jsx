import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import ALL your pages here
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import RequestReset from "./pages/RequestReset"; 
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* 2. Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/request-password-reset" element={<RequestReset />} />

        {/* --- FIXED ROUTE --- */}
        {/* We added /:uid/:token to capture the ID and Token from the email link */}
        <Route path="/reset-password-confirm/:uid/:token" element={<ResetPasswordConfirm />} />
      </Routes>
    </Router>
  );
}

export default App;