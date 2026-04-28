export const typeDefs = `
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  # ! is used to indicate mandatory fields.
  
    type Author {
        id: ID!
        name: String!
        books: [Book]
    }
    type Book {
        id: ID!
        title: String!
        publishedYear: Int! 
        Author: Author!
    }
    type Query {
        authors: [Author]
        books: [Book]
    }
`;
