import './Dashboard.css'
import Search from './Search'
import BookList from './BookList'
import { useState } from 'react'


function Dashboard() {
  // books is the list of results received from the Search component
  // setBooks is a function to update the list of results
  const [books, setBooks] = useState([])

  const handleResults = (results) => {
    setBooks(results) // update the list of results
  }
  return (
    <div className="Dashboard">
       <header>
         <h1>Dashboard</h1>
       </header>

       <Search onResults={handleResults} />
       <BookList books ={books}/>


    </div>

  )
}

export default Dashboard;
