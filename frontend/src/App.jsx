import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import "./App.css";

// Import pages
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import FavoritesPage from "./pages/FavoritesPage";
import DiscussionPage from "./pages/DiscussionPage";
import SignIn from "./pages/authentication-pages/SignIn";
import Register from "./pages/authentication-pages/Register";

// Create contexts for global state management
const AuthContext = createContext();
const FavoritesContext = createContext();

// Custom hooks for using contexts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const renderNavigationLinks = () => {
    // Homepage should have only Sign In and Register links
    if (currentPath === "/") {
      return (
        <>
          <a href="/signin">Sign In</a> &nbsp;
          <a href="/register">Register</a> &nbsp;
        </>
      );
    }

    // Dashboard should have none of these navigation links
    if (currentPath === "/dashboard") {
      return user ? (
        <>
          <a href="/favorites">My Favorites</a>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
          <span className="user-greeting">Welcome, {user.name}!</span>
        </>
      ) : null;
    }

    // Sign In page should have only Home and Register links
    if (currentPath === "/signin") {
      return (
        <>
          <a href="/">Home</a> &nbsp;
          <a href="/register">Register</a> &nbsp;
        </>
      );
    }

    // Register page should have Sign In and Home links
    if (currentPath === "/register") {
      return (
        <>
          <a href="/">Home</a> &nbsp;
        </>
      );
    }

    // Default navigation for other pages
    return (
      <>
        <a href="/">Home</a> &nbsp;
        {user ? (
          <>
            <a href="/dashboard">Dashboard</a>
            <a href="/favorites">My Favorites</a>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
            <span className="user-greeting">Welcome, {user.name}!</span>
          </>
        ) : (
          <>
            <a href="/signin">Sign In</a> &nbsp;
            <a href="/register">Register</a> &nbsp;
            <a href="/dashboard">Dashboard</a> &nbsp;
          </>
        )}
      </>
    );
  };

  return (
    <nav className="app-navigation">
      <div className="nav-brand">
        <h1>Story Stack</h1>
      </div>
      <div className="nav-links">{renderNavigationLinks()}</div>
    </nav>
  );
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          // Validate token with backend and get user data
          // This is a placeholder - implement actual API call
          const userData = JSON.parse(localStorage.getItem("userData"));
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Implement actual login API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: "Invalid credentials" };
      }
    } catch (error) {
      return { success: false, error: "Login failed" };
    }
  };

  const register = async (userData) => {
    try {
      // Implement actual registration API call
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      return { success: false, error: "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Favorites Provider Component
const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Load user's favorites from backend
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  };

  const addToFavorites = async (book) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: book.id }),
      });

      if (response.ok) {
        setFavorites((prev) => [...prev, book]);
        return { success: true };
      }
    } catch (error) {
      console.error("Failed to add favorite:", error);
    }
    return { success: false };
  };

  const removeFromFavorites = async (bookId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/favorites/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((book) => book.id !== bookId));
        return { success: true };
      }
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
    return { success: false };
  };

  const isFavorite = (bookId) => {
    return favorites.some((book) => book.id === bookId);
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    loadFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <Router>
          <div className="App">
            <Navigation />
            <main className="app-main">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/register" element={<Register />} />

                {/* Temporarily unprotected routes for development */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route
                  path="/discussion/:bookId"
                  element={<DiscussionPage />}
                />

                {/* Catch all route - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
