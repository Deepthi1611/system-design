const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = './customers.proto';

// Load the protobuf
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true
});

// Load the package definition
const customerProto = grpc.loadPackageDefinition(packageDefinition).customer;

// Create a new gRPC server
const server = new grpc.Server();

const customers = [
    { id: 1, name: 'John Doe', age: 30 },
    { id: 2, name: 'Jane Smith', age: 25 },
    { id: 3, name: 'Bob Johnson', age: 40 }
];


// add the service to the server and implement the methods defined in the protobuf
server.addService(customerProto.CustomerService.service, { 
    // call and callback are the parameters for the gRPC method
    // call contains the request data, and callback is used to send the response back to the client
    GetAll: (call, callback) => { 
        // callback is called with null for the error and 
        // an object containing the customers as the response
        callback(null, { customers });
    },
    Get : (call, callback) => {
        
    },
    Insert: (call, callback) => {

    },
    Update: (call, callback) => {

    },
    Remove: (call, callback) => {
    }
});

// Bind the server to a specific address and port, and start it
// servercredentials.createInsecure() is used to create insecure credentials for the server,
// which means that the communication between the client and server will not be encrypted. 
// In a production environment, you should use secure credentials instead.
server.bind('localhost:50051', grpc.ServerCredentials.createInsecure());
console.log('Server running at http://localhost:50051');
server.start();