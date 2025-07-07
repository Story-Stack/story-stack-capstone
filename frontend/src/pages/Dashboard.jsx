import "./Dashboard.css";
import Search from "../Search";
import BookList from "../BookList";
import Sidebar from "../components/FavoritesSidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

function Dashboard() {
  // books is the list of results received from the Search component
  // setBooks is a function to update the list of results
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  const handleResults = (results) => {
    setBooks(results); // update the list of results
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <Search onResults={handleResults} />
      <div className="page-layout">
        <aside className="left-sidebar">
          <Sidebar />
        </aside>

        <main className="main-content">
          <BookList books={books} />
        </main>

        <aside className="right-sidebar">{/* Channels */}</aside>
      </div>
    </div>
  );
}

export default Dashboard;
