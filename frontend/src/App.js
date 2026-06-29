import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import AuthCallback from "@/components/AuthCallback";
import Login from "@/components/Login";
import MobileLayout from "@/components/MobileLayout";
import Home from "@/pages/Home";
import PostListing from "@/pages/PostListing";
import EditListing from "@/pages/EditListing";
import ItemDetail from "@/pages/ItemDetail";
import Requests from "@/pages/Requests";
import Messages from "@/pages/Messages";
import Chat from "@/pages/Chat";
import MyListings from "@/pages/MyListings";
import Profile from "@/pages/Profile";
import PublicProfile from "@/pages/PublicProfile";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MobileLayout><Home /></MobileLayout>} />
      <Route path="/post" element={<MobileLayout hideNav><PostListing /></MobileLayout>} />
      <Route path="/edit/:id" element={<MobileLayout hideNav><EditListing /></MobileLayout>} />
      <Route path="/item/:id" element={<MobileLayout hideNav><ItemDetail /></MobileLayout>} />
      <Route path="/requests" element={<MobileLayout><Requests /></MobileLayout>} />
      <Route path="/messages" element={<MobileLayout><Messages /></MobileLayout>} />
      <Route path="/chat/:id" element={<MobileLayout hideNav><Chat /></MobileLayout>} />
      <Route path="/my-listings" element={<MobileLayout hideNav><MyListings /></MobileLayout>} />
      <Route path="/profile" element={<MobileLayout><Profile /></MobileLayout>} />
      <Route path="/user/:id" element={<MobileLayout hideNav><PublicProfile /></MobileLayout>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App bg-black min-h-screen">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-center" theme="dark" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
