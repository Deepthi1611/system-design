const express = require('express');
const {ApolloServer} = require("@apollo/server");
const bodyParser = require('body-parser');
const cors = require('cors');
const { expressMiddleware } = require("@as-integrations/express5");
const { default: axios } = require('axios');

async function startServer() {
    const app = express();
    const server = new ApolloServer({
        typeDefs: `
            type User {
                id: ID!
                name: String!
                email: String!
            }
            type ToDo {
                id: ID!
                title: String!
                completed: Boolean!
                user: User
            }
                
            type Query {    
                todos: [ToDo!]!
                getAllUsers: [User!]!
                getUserById(id: ID!): User
            }
                
            type Mutation {
                addToDo(title: String!): ToDo!
                toggleToDo(id: ID!): ToDo!
            }
        `,
        resolvers: {
            // to get user details for each ToDo item, we need to fetch user data based on userId
            ToDo : {
                user: async (parent) => {
                    const userId = parent.userId;
                    return (await axios.get(`https://jsonplaceholder.typicode.com/users/${userId}`)).data;
                } 
            },
            Query: {
                todos: async () => (await axios.get('https://jsonplaceholder.typicode.com/todos?_limit=10')).data,
                getAllUsers: async () => (await axios.get('https://jsonplaceholder.typicode.com/users')).data,
                getUserById: async (_, { id }) => (await axios.get(`https://jsonplaceholder.typicode.com/users/${id}`)).data,
            },
            Mutation: {
                addToDo: (_, { title }) => ({ id: String(Date.now()), title, completed: false }),
                toggleToDo: (_, { id }) => ({ id, title: `ToDo ${id}`, completed: true }),
            },
        },
    });

    app.use(bodyParser.json());
    app.use(cors());
    await server.start();
    app.use('/graphql', expressMiddleware(server));

    app.listen(8000, () => {
        console.log('Server is running on http://localhost:8000/graphql');
    });
} 

startServer();
