import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import "@/App.css";

import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CursorGlow from "@/components/CursorGlow";

import Home from "@/pages/Home";
import Destinations from "@/pages/Destinations";
import DestinationDetail from "@/pages/DestinationDetail";
import Packages from "@/pages/Packages";
import PackageDetail from "@/pages/PackageDetail";
import AIPlanner from "@/pages/AIPlanner";
import Booking from "@/pages/Booking";
import Gallery from "@/pages/Gallery";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
    return null;
}

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            >
                <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/destinations" element={<Destinations />} />
                    <Route path="/destinations/:id" element={<DestinationDetail />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/packages/:id" element={<PackageDetail />} />
                    <Route path="/ai-planner" element={<AIPlanner />} />
                    <Route path="/booking/:id" element={<Booking />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route path="/signup" element={<AuthPage mode="signup" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </motion.div>
        </AnimatePresence>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <ScrollToTop />
                    <CursorGlow />
                    <Navbar />
                    <main className="relative">
                        <AnimatedRoutes />
                    </main>
                    <Footer />
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: { borderRadius: "16px", border: "1px solid hsl(var(--border))" }
                        }}
                    />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
