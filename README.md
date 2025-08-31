# eBayClone GraphQL API

A complete GraphQL implementation of an eBay-like marketplace API, converted from REST to provide modern, efficient data fetching capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn package manager

### Build and Run
```bash
# Clone and navigate to project
cd ebayclone-GraphQL

# Build and start server (installs dependencies automatically)
./run.sh
```

The server will start at `http://localhost:4000/graphql` with GraphQL Playground available for interactive testing.

## 📁 Project Structure

```
/project-root
├── schema/            # GraphQL schema definition files
│   └── schema.graphql # Complete SDL schema
├── src/               # Source code
│   ├── server.js      # Main GraphQL server
│   ├── data/          # Data storage layer
│   ├── resolvers/     # GraphQL resolvers
│   └── utils/         # Utilities (auth, validation)
├── scripts/run.sh     # Build and run script
├── client/            # Client examples
│   ├── example.js     # Node.js client examples
│   └── example.html   # Browser client examples
├── tests/             # Automated tests
│   ├── test.sh        # Shell-based API tests
│   └── graphql.test.js # Jest test suite
├── run.sh             # Main run script
└── README.md          # This documentation
```

## 🔧 API Overview

### Core Features
- **User Management**: Registration, authentication, profile management
- **Listings**: Create, read, update, delete marketplace items with search/filtering
- **Orders**: Complete order lifecycle with status tracking and cancellation
- **Authentication**: JWT-based authentication with secure session management
- **Real-time**: Subscription support for live updates

### GraphQL Endpoints

#### Queries
- `user(id: Int!)`: Get user by ID
- `listing(id: Int!)`: Get listing by ID
- `listings(filter: ListingFilterInput)`: Get all listings with optional filtering
- `order(id: Int!)`: Get order by ID (authenticated)
- `orders(filter: OrderFilterInput, pagination: PaginationInput)`: Get orders with pagination (authenticated)

#### Mutations
- `createUser(input: UserCreateInput!)`: Register new user
- `login(input: UserLoginInput!)`: Authenticate user
- `logout`: End user session
- `updateUser(id: Int!, input: UserUpdateInput!)`: Update user profile
- `deleteUser(id: Int!)`: Delete user account
- `createListing(input: ListingCreateInput!)`: Create new listing
- `updateListing(id: Int!, input: ListingUpdateInput!)`: Update listing
- `deleteListing(id: Int!)`: Delete listing
- `createOrder(input: OrderCreateInput!)`: Create new order
- `updateOrder(id: Int!, input: OrderUpdateInput!)`: Update order
- `deleteOrder(id: Int!)`: Delete order
- `cancelOrder(id: Int!, cancelReason: String)`: Cancel order
- `updateOrderStatus(id: Int!, status: OrderStatus!)`: Update order status

#### Subscriptions
- `orderStatusChanged(orderId: Int)`: Real-time order status updates
- `newListing`: Real-time new listing notifications

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow
1. Register: `createUser` mutation
2. Login: `login` mutation (returns JWT token)
3. Use token: Include in Authorization header for protected operations
4. Logout: `logout` mutation (invalidates token)

## 📝 Usage Examples

### Basic Query (No Authentication)
```graphql
query GetListings {
  listings(filter: { search: "phone", priceMax: 1000 }) {
    id
    title
    price
    condition
    user {
      username
    }
  }
}
```

### Authentication Example
```graphql
mutation Login {
  login(input: { email: "user@example.com", password: "password" }) {
    token
    user {
      id
      username
    }
  }
}
```

### Creating a Listing (Requires Authentication)
```graphql
mutation CreateListing {
  createListing(input: {
    title: "iPhone 14 Pro"
    description: "Brand new, unlocked"
    price: 999.99
    category: "electronics"
    condition: NEW
    location: "New York, NY"
  }) {
    id
    title
    price
    user {
      username
    }
  }
}
```

### Order Management
```graphql
mutation CreateOrder {
  createOrder(input: {
    listingId: 1
    quantity: 1
    shippingAddress: {
      street: "123 Main St"
      city: "New York"
      state: "NY"
      zipCode: "10001"
      country: "USA"
    }
    buyerNotes: "Please deliver after 5 PM"
  }) {
    id
    totalPrice
    status
    listing {
      title
    }
  }
}
```

## 🧪 Testing

### Run All Tests
```bash
# Shell-based API tests
./tests/test.sh

# Jest test suite
npm test
```

### Manual Testing
1. Start the server: `./run.sh`
2. Open GraphQL Playground: `http://localhost:4000/graphql`
3. Run the client examples: `node client/example.js`
4. Open browser example: `client/example.html`

## 🔄 REST to GraphQL Mapping

| REST Endpoint | GraphQL Operation | Type |
|---------------|-------------------|------|
| `GET /users/{id}` | `user(id: Int!)` | Query |
| `POST /users` | `createUser(input: UserCreateInput!)` | Mutation |
| `PUT/PATCH /users/{id}` | `updateUser(id: Int!, input: UserUpdateInput!)` | Mutation |
| `DELETE /users/{id}` | `deleteUser(id: Int!)` | Mutation |
| `POST /sessions` | `login(input: UserLoginInput!)` | Mutation |
| `DELETE /sessions` | `logout` | Mutation |
| `GET /listings` | `listings(filter: ListingFilterInput)` | Query |
| `GET /listings/{id}` | `listing(id: Int!)` | Query |
| `POST /listings` | `createListing(input: ListingCreateInput!)` | Mutation |
| `PATCH /listings/{id}` | `updateListing(id: Int!, input: ListingUpdateInput!)` | Mutation |
| `DELETE /listings/{id}` | `deleteListing(id: Int!)` | Mutation |
| `GET /orders` | `orders(filter: OrderFilterInput, pagination: PaginationInput)` | Query |
| `GET /orders/{id}` | `order(id: Int!)` | Query |
| `POST /orders` | `createOrder(input: OrderCreateInput!)` | Mutation |
| `PATCH /orders/{id}` | `updateOrder(id: Int!, input: OrderUpdateInput!)` | Mutation |
| `DELETE /orders/{id}` | `deleteOrder(id: Int!)` | Mutation |
| `PATCH /orders/{id}/cancel` | `cancelOrder(id: Int!, cancelReason: String)` | Mutation |
| `PATCH /orders/{id}/status` | `updateOrderStatus(id: Int!, status: OrderStatus!)` | Mutation |

## 🛠️ Development

### Project Setup
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Validate GraphQL schema
npm run validate-schema
```

### Data Storage
This implementation uses an in-memory data store for demonstration. In production, replace `src/data/store.js` with your preferred database integration (PostgreSQL, MongoDB, etc.).

### Adding New Features
1. Update GraphQL schema in `schema/schema.graphql`
2. Implement resolvers in appropriate `src/resolvers/*.js` file
3. Add validation logic in `src/utils/validation.js` if needed
4. Update tests in `tests/` directory
5. Add client examples

## 🔍 Error Handling

The API returns structured GraphQL errors with:
- `message`: Human-readable error description
- `extensions.code`: Machine-readable error code
- `extensions.details`: Additional error context

Example error response:
```json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "NOT_FOUND",
        "details": "User with ID 999 does not exist"
      }
    }
  ]
}
```

## 📊 Performance Considerations

- **N+1 Problem**: Resolved using DataLoader pattern for nested user/listing queries
- **Pagination**: Implemented for orders with cursor-based pagination support
- **Caching**: Apollo Server includes automatic query caching
- **Rate Limiting**: Consider adding rate limiting for production use

## 🚀 Deployment

### Environment Variables
```bash
PORT=4000                    # Server port
JWT_SECRET=your-secret-key   # JWT signing secret
NODE_ENV=production          # Environment
```

### Production Considerations
- Replace in-memory store with persistent database
- Add proper logging and monitoring
- Implement rate limiting and security headers
- Set up HTTPS and CORS policies
- Add input sanitization and validation
- Implement proper error tracking

## 📚 Additional Resources

- [GraphQL Specification](https://spec.graphql.org/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.