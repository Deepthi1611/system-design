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
 
// creates the client stub for the CustomerService defined in the protobuf, connecting to the gRPC server at localhost:50051
const client = new customerProto.CustomerService(
    'localhost:50051', 
    grpc.credentials.createInsecure()
)

module.exports = client;
