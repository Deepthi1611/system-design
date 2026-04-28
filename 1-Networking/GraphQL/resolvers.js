const data = {
    authors: [
        {
            id: 1,
            name: 'J.K. Rowling',
            booksIds : [1, 3]
        }, 
        {
            id: 2,
            name: 'George R.R. Martin',
            booksIds : [2]
        }
    ],
    books: [
        {
            id: 1,
            title: 'Harry Potter and the Sorcerer\'s Stone',
            publishedYear: 1997,
            authorId: 1
        },
        {
            id: 2,
            title: 'A Game of Thrones',
            publishedYear: 1996,
            authorId: 2
        },
        {
            id: 3,
            title: 'Harry Potter and the Chamber of Secrets',
            publishedYear: 1998,
            authorId: 1
        }
    ]
}


export const resolvers = {
    Query: { 
        authors: () => {
            return data.authors;
        },
        books: () => {
            return data.books;
        }
    },
    Book : {
        Author : (parent, args, context, info) => {
            return data.authors.find(author => author.id === Number(parent.authorId));
        }
    },
    Author : {
        books : (parent, args, context, info) => {
            return data.books.filter(book => book.authorId === parent.id);  
        }
    },
    Mutation : {
        addBook : (parent, args, context, info) => {
            const authorId = Number(args.authorId);

            const newBook = {
                id: data.books.length + 1,
                title: args.title,
                publishedYear: args.publishedYear,
                authorId
            };
            data.books.push(newBook);
            return newBook;
        },
        addAuthor : (parent, args, context, info) => {
            const newAuthor = {
                id: data.authors.length + 1,
                name: args.name,
                booksIds : []
            };
            data.authors.push(newAuthor);
            return newAuthor;
        }
    }
}
