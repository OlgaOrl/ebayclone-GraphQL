const { graphqlRequest } = require('../client/example');

// Test configuration
const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

describe('eBayClone GraphQL API Tests', () => {
  let authToken = null;
  let testUserId = null;
  let testListingId = null;
  let testOrderId = null;

  beforeAll(async () => {
    // Wait a bit for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Schema and Introspection', () => {
    test('should support introspection query', async () => {
      const query = `
        query IntrospectionQuery {
          __schema {
            types {
              name
            }
          }
        }
      `;

      const result = await graphqlRequest(query);
      expect(result.__schema).toBeDefined();
      expect(Array.isArray(result.__schema.types)).toBe(true);
      expect(result.__schema.types.length).toBeGreaterThan(0);
    });
  });

  describe('User Management', () => {
    test('should create a new user', async () => {
      const mutation = `
        mutation CreateUser($input: UserCreateInput!) {
          createUser(input: $input) {
            id
            username
            email
          }
        }
      `;

      const variables = {
        input: {
          username: 'testuser123',
          email: `testuser123_${Date.now()}@example.com`,
          password: 'password123',
        },
      };

      const result = await graphqlRequest(mutation, variables);
      expect(result.createUser).toBeDefined();
      expect(result.createUser.id).toBeDefined();
      expect(result.createUser.username).toBe('testuser123');
      expect(result.createUser.email).toContain('testuser123');
      
      testUserId = result.createUser.id;
    });

    test('should get user by ID', async () => {
      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            username
            email
          }
        }
      `;

      const variables = { id: 1 };
      const result = await graphqlRequest(query, variables);
      
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(1);
      expect(result.user.username).toBeDefined();
      expect(result.user.email).toBeDefined();
    });

    test('should return error for non-existent user', async () => {
      const query = `
        query GetUser($id: Int!) {
          user(id: $id) {
            id
            username
            email
          }
        }
      `;

      const variables = { id: 99999 };
      
      await expect(graphqlRequest(query, variables)).rejects.toThrow('User not found');
    });
  });

  describe('Authentication', () => {
    test('should login with valid credentials', async () => {
      const mutation = `
        mutation Login($input: UserLoginInput!) {
          login(input: $input) {
            token
            user {
              id
              username
              email
            }
          }
        }
      `;

      const variables = {
        input: {
          email: 'john@example.com',
          password: 'password',
        },
      };

      const result = await graphqlRequest(mutation, variables);
      expect(result.login).toBeDefined();
      expect(result.login.token).toBeDefined();
      expect(result.login.user).toBeDefined();
      expect(result.login.user.email).toBe('john@example.com');
      
      authToken = result.login.token;
    });

    test('should reject invalid credentials', async () => {
      const mutation = `
        mutation Login($input: UserLoginInput!) {
          login(input: $input) {
            token
            user {
              id
            }
          }
        }
      `;

      const variables = {
        input: {
          email: 'john@example.com',
          password: 'wrongpassword',
        },
      };

      await expect(graphqlRequest(mutation, variables)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Listings', () => {
    test('should get all listings', async () => {
      const query = `
        query GetListings {
          listings {
            id
            title
            price
            user {
              username
            }
          }
        }
      `;

      const result = await graphqlRequest(query);
      expect(result.listings).toBeDefined();
      expect(Array.isArray(result.listings)).toBe(true);
      expect(result.listings.length).toBeGreaterThan(0);
    });

    test('should get listings with filters', async () => {
      const query = `
        query GetListingsFiltered($filter: ListingFilterInput) {
          listings(filter: $filter) {
            id
            title
            price
          }
        }
      `;

      const variables = {
        filter: {
          priceMax: 1000,
          search: 'phone',
        },
      };

      const result = await graphqlRequest(query, variables);
      expect(result.listings).toBeDefined();
      expect(Array.isArray(result.listings)).toBe(true);
    });

    test('should create listing when authenticated', async () => {
      const mutation = `
        mutation CreateListing($input: ListingCreateInput!) {
          createListing(input: $input) {
            id
            title
            description
            price
            userId
          }
        }
      `;

      const variables = {
        input: {
          title: 'Test Laptop',
          description: 'High-performance laptop for testing',
          price: 1299.99,
          category: 'electronics',
          condition: 'NEW',
        },
      };

      const result = await graphqlRequest(mutation, variables, authToken);
      expect(result.createListing).toBeDefined();
      expect(result.createListing.id).toBeDefined();
      expect(result.createListing.title).toBe('Test Laptop');
      expect(result.createListing.price).toBe(1299.99);
      
      testListingId = result.createListing.id;
    });

    test('should reject listing creation without auth', async () => {
      const mutation = `
        mutation CreateListing($input: ListingCreateInput!) {
          createListing(input: $input) {
            id
            title
          }
        }
      `;

      const variables = {
        input: {
          title: 'Unauthorized Listing',
          description: 'This should fail',
          price: 99.99,
        },
      };

      await expect(graphqlRequest(mutation, variables)).rejects.toThrow('Authentication required');
    });
  });

  describe('Orders', () => {
    test('should create order when authenticated', async () => {
      const mutation = `
        mutation CreateOrder($input: OrderCreateInput!) {
          createOrder(input: $input) {
            id
            quantity
            totalPrice
            status
            shippingAddress {
              street
              city
              country
            }
          }
        }
      `;

      const variables = {
        input: {
          listingId: 1,
          quantity: 2,
          shippingAddress: {
            street: '789 Test Ave',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
          },
          buyerNotes: 'Test order notes',
        },
      };

      const result = await graphqlRequest(mutation, variables, authToken);
      expect(result.createOrder).toBeDefined();
      expect(result.createOrder.id).toBeDefined();
      expect(result.createOrder.quantity).toBe(2);
      expect(result.createOrder.status).toBe('PENDING');
      
      testOrderId = result.createOrder.id;
    });

    test('should get orders when authenticated', async () => {
      const query = `
        query GetOrders($pagination: PaginationInput) {
          orders(pagination: $pagination) {
            orders {
              id
              status
              totalPrice
              listing {
                title
              }
            }
            pagination {
              total
              pages
              currentPage
            }
          }
        }
      `;

      const variables = {
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const result = await graphqlRequest(query, variables, authToken);
      expect(result.orders).toBeDefined();
      expect(result.orders.orders).toBeDefined();
      expect(Array.isArray(result.orders.orders)).toBe(true);
      expect(result.orders.pagination).toBeDefined();
    });

    test('should cancel order when authenticated', async () => {
      if (!testOrderId) {
        console.log('Skipping cancel order test - no test order available');
        return;
      }

      const mutation = `
        mutation CancelOrder($id: Int!, $cancelReason: String) {
          cancelOrder(id: $id, cancelReason: $cancelReason) {
            message
            order {
              id
              status
              cancelReason
            }
          }
        }
      `;

      const variables = {
        id: testOrderId,
        cancelReason: 'Test cancellation',
      };

      const result = await graphqlRequest(mutation, variables, authToken);
      expect(result.cancelOrder).toBeDefined();
      expect(result.cancelOrder.message).toBeDefined();
      expect(result.cancelOrder.order.status).toBe('CANCELLED');
    });

    test('should reject order operations without auth', async () => {
      const query = `
        query GetOrders {
          orders {
            orders {
              id
            }
          }
        }
      `;

      await expect(graphqlRequest(query)).rejects.toThrow('Authentication required');
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors properly', async () => {
      const mutation = `
        mutation CreateUser($input: UserCreateInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      const variables = {
        input: {
          username: 'ab', // Too short
          email: 'invalid-email',
          password: '123', // Too short
        },
      };

      await expect(graphqlRequest(mutation, variables)).rejects.toThrow();
    });

    test('should handle duplicate email error', async () => {
      const mutation = `
        mutation CreateUser($input: UserCreateInput!) {
          createUser(input: $input) {
            id
          }
        }
      `;

      const variables = {
        input: {
          username: 'duplicate',
          email: 'john@example.com', // Already exists
          password: 'password123',
        },
      };

      await expect(graphqlRequest(mutation, variables)).rejects.toThrow('Email already exists');
    });
  });
});
