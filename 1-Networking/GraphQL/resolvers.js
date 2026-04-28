export const resolvers = {
    Query: { 
        authors: () => {
            return [{
                id: 1, 
                name: 'J.K. Rowling'
            }]
        },
        books: () => {
            return [{
                id:1,
                title: 'Harry Potter and the Sorcerer\'s Stone',
                publishedYear: 1997,
            }]
        }
    }
}