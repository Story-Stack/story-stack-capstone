export function calculateScores({ favorites = [], shelfItems = [], comments = []}) {

    const categoryScores = {}
    const addPoints = (category, points) => {
        if (!category) return;
        const book_category = category.trim().toLowerCase();
        categoryScores[book_category] = (categoryScores[book_category] || 0) + points;
    }

    // Add 3 points for each favorited book
    favorites.forEach(book => addPoints(book.category, 3))

    // Add 1.5 points for each book in the shelf
    shelfItems.forEach(book => addPoints(book.category, 1.5))


   // Add 1 point for each book a user has made a comment on
    comments.forEach(book => addPoints(book.category, 1))

    // Add 2 points for each channel joined
    channels.forEach(channel => addPoints(channel.category, 2));

    return categoryScores;
}
