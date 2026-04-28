import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import CartProvider from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Cart from "./components/Cart";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";

function StoreFront() {
  const [cartOpen,       setCartOpen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [refreshKey,     setRefreshKey]     = useState(0);

  return (
    <>
      <Navbar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        openCart={() => setCartOpen(true)}
      />
      {cartOpen && <Cart onClose={() => setCartOpen(false)} />}
      <Home key={refreshKey} activeCategory={activeCategory} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public */}
            <Route path="/"      element={<StoreFront />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — any admin */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}