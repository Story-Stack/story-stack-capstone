import "./HomePage.css"
function HomePage(){
    return(
        <div className="homepage">
            <div className="header">
             <h1> Welcome to StoryStack </h1>
             <p> A place to discover, discuss, and share your favorite books </p>
             </div>
                 <div className="homepage-info"> </div>


                   <p>Discover your next favorite read, share your thoughts, and join conversations that matter. </p>
                    With StoryStack, you can:

                     <ul>
                        <li>🔍 Search books from around the world</li>
                        <li>📖 Build your bookshelf — track what you’re reading, want to read, or have finished</li>
                        <li>💬 Join channels and discuss with fellow readers</li>
                        <li>⭐ Leave reviews, rate books, and see what others think</li>
                        <li>🎯 Track your progress and set reading goals</li>
                     </ul>


                <div className="homepage-register">
                    <h3>Get Started</h3>
                    <button>Sign up </button> to build your personalized library and join the conversation.
                </div>
        </div>
    )
}

export default HomePage;
