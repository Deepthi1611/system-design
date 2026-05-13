import './App.css';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const query = gql`
  query getTodosWithUsers {
    todos {
      id
      title
      completed
      user {
        id
        name
        email
      }
    }
  }
`;

function App() {
  const { loading, error, data } = useQuery(query);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return (
    <div>
      {data.todos.map((todo) => (
        <div key={todo.id}>
          <h3>{todo.title}</h3>
          <p>Completed: {todo.completed ? 'Yes' : 'No'}</p>
          <p>User: {todo.user.name}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
