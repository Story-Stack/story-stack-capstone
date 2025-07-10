import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../utils/supabaseClient";
import "./App.css";

// Import pages
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import FavoritesPage from "./pages/FavoritesPage";
import ShelfPage from "./pages/ShelfPage";
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

// Navigation Component
const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const renderNavigationLinks = () => {
    // Homepage should have only Sign In and Register links
    if (currentPath === "/") {
      return (
        <>
          <a href="/signin">Sign In</a> &nbsp;
          <a href="/register">Register</a> &nbsp;
          <a href="/dashboard">Dashboard</a> &nbsp;
        </>
      );
    }

    // Dashboard should have none of these navigation links
    if (currentPath === "/dashboard") {
      return user ? (
        <>
          <a href="/">Home</a> &nbsp;
          <span className="user-greeting">
            Welcome, {user.email.split("@")[0]}!
          </span>
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
            {currentPath !== "/favorites" && (
              <a href="/favorites">My Favorites</a>
            )}

            <span className="user-greeting">Welcome, {user.email}!</span>
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
      <div className="nav-brand"></div>
      <div className="nav-links">{renderNavigationLinks()}</div>
    </nav>
  );
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        // Create user profile in database if it doesn't exist
        await createUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (authUser) => {
    try {
      // Check if user profile already exists in your database using the correct endpoint
      const response = await fetch(
        `http://localhost:3000/api/users/supabase/${authUser.id}`
      );

      if (!response.ok) {
        // User doesn't exist, create profile
        const createResponse = await fetch("http://localhost:3000/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabase_id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || "",
            last_name: authUser.user_metadata?.last_name || "",
          }),
        });

        if (!createResponse.ok) {
          console.error("Failed to create user profile");
        } else {
          console.log("User profile created successfully");
        }
      } else {
        console.log("User profile already exists");
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/favorites", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return { success: false };

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return { success: false };

      const response = await fetch(`/api/favorites/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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

                {/* Temporarily unprotected dashboard for development */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Protected Routes */}

                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <FavoritesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shelf"
                  element={
                    <ProtectedRoute>
                      <ShelfPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/discussion/:bookId"
                  element={
                    <ProtectedRoute>
                      <DiscussionPage />
                    </ProtectedRoute>
                  }
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
