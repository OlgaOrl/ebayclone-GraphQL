const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Import resolvers
const userResolvers = require('./resolvers/userResolvers');
const authResolvers = require('./resolvers/authResolvers');
const listingResolvers = require('./resolvers/listingResolvers');
const orderResolvers = require('./resolvers/orderResolvers');

// Load GraphQL schema
const typeDefs = fs.readFileSync(
  path.join(__dirname, '../schema/schema.graphql'),
  'utf8'
);

// Combine all resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...listingResolvers.Query,
    ...orderResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...authResolvers.Mutation,
    ...listingResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
  Subscription: {
    ...orderResolvers.Subscription,
    ...listingResolvers.Subscription,
  },
  // Type resolvers for nested fields
  User: userResolvers.User,
  Listing: listingResolvers.Listing,
  Order: orderResolvers.Order,
};

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Context function for authentication
async function createContext({ req }) {
  let user = null;
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      user = decoded;
    } catch (error) {
      // Invalid token - user remains null
      console.log('Invalid token:', error.message);
    }
  }
  
  return {
    user,
    token,
    JWT_SECRET,
  };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    csrfPrevention: false, // Disable CSRF for development
    introspection: true,   // Enable introspection
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_ERROR',
        details: error.extensions?.details || null,
      };
    },
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json({ limit: '50mb' }),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'eBayClone GraphQL API' });
  });

  const PORT = process.env.PORT || 4000;
  
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 GraphQL Playground available at http://localhost:${PORT}/graphql`);
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
