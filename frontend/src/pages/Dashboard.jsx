import "./Dashboard.css";
import Search from "../Search";
import BookList from "../BookList";
import { useState } from "react";

function Dashboard() {
  // books is the list of results received from the Search component
  // setBooks is a function to update the list of results
  const [books, setBooks] = useState([]);

  const handleResults = (results) => {
    setBooks(results); // update the list of results
  };
  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard</h1>
      </header>

      <Search onResults={handleResults} />
      <div className="page-layout">
        <aside className="left-sidebar">{/* Profile and Favorites */}</aside>

        <main className="main-content">
          <BookList books={books} />
        </main>

        <aside className="right-sidebar">{/* Channels */}</aside>
      </div>
    </div>
  );
}

export default Dashboard;
