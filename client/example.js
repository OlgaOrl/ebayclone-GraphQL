// GraphQL Client Examples for eBayClone API
// This file demonstrates all available queries and mutations

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// Helper function to make GraphQL requests
async function graphqlRequest(query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('GraphQL Errors:', result.errors);
    throw new Error(result.errors[0].message);
  }
  
  return result.data;
}

// Example 1: Create a new user
async function createUserExample() {
  console.log('\n=== Creating User ===');
  
  const CREATE_USER_MUTATION = `
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
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    },
  };

  try {
    const result = await graphqlRequest(CREATE_USER_MUTATION, variables);
    console.log('User created:', result.createUser);
    return result.createUser;
  } catch (error) {
    console.error('Error creating user:', error.message);
  }
}

// Example 2: Login
async function loginExample() {
  console.log('\n=== User Login ===');
  
  const LOGIN_MUTATION = `
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

  try {
    const result = await graphqlRequest(LOGIN_MUTATION, variables);
    console.log('Login successful:', result.login);
    return result.login.token;
  } catch (error) {
    console.error('Error logging in:', error.message);
  }
}

// Example 3: Get user by ID
async function getUserExample() {
  console.log('\n=== Get User ===');
  
  const GET_USER_QUERY = `
    query GetUser($id: Int!) {
      user(id: $id) {
        id
        username
        email
      }
    }
  `;

  const variables = { id: 1 };

  try {
    const result = await graphqlRequest(GET_USER_QUERY, variables);
    console.log('User data:', result.user);
    return result.user;
  } catch (error) {
    console.error('Error getting user:', error.message);
  }
}

// Example 4: Create a listing
async function createListingExample(token) {
  console.log('\n=== Creating Listing ===');
  
  const CREATE_LISTING_MUTATION = `
    mutation CreateListing($input: ListingCreateInput!) {
      createListing(input: $input) {
        id
        title
        description
        price
        category
        condition
        location
        userId
        user {
          username
        }
      }
    }
  `;

  const variables = {
    input: {
      title: 'MacBook Pro 2023',
      description: 'Latest MacBook Pro with M2 chip',
      price: 1999.99,
      category: 'electronics',
      condition: 'NEW',
      location: 'San Francisco, CA',
    },
  };

  try {
    const result = await graphqlRequest(CREATE_LISTING_MUTATION, variables, token);
    console.log('Listing created:', result.createListing);
    return result.createListing;
  } catch (error) {
    console.error('Error creating listing:', error.message);
  }
}

// Example 5: Get all listings with filters
async function getListingsExample() {
  console.log('\n=== Get Listings with Filters ===');
  
  const GET_LISTINGS_QUERY = `
    query GetListings($filter: ListingFilterInput) {
      listings(filter: $filter) {
        id
        title
        description
        price
        category
        condition
        location
        user {
          username
        }
      }
    }
  `;

  const variables = {
    filter: {
      search: 'phone',
      priceMin: 100,
      priceMax: 2000,
    },
  };

  try {
    const result = await graphqlRequest(GET_LISTINGS_QUERY, variables);
    console.log('Listings found:', result.listings);
    return result.listings;
  } catch (error) {
    console.error('Error getting listings:', error.message);
  }
}

// Example 6: Create an order
async function createOrderExample(token) {
  console.log('\n=== Creating Order ===');
  
  const CREATE_ORDER_MUTATION = `
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
        listing {
          title
          price
        }
      }
    }
  `;

  const variables = {
    input: {
      listingId: 1,
      quantity: 1,
      shippingAddress: {
        street: '456 Oak Ave',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA',
      },
      buyerNotes: 'Please handle with care',
    },
  };

  try {
    const result = await graphqlRequest(CREATE_ORDER_MUTATION, variables, token);
    console.log('Order created:', result.createOrder);
    return result.createOrder;
  } catch (error) {
    console.error('Error creating order:', error.message);
  }
}

// Example 7: Get orders with pagination
async function getOrdersExample(token) {
  console.log('\n=== Get Orders with Pagination ===');
  
  const GET_ORDERS_QUERY = `
    query GetOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
      orders(filter: $filter, pagination: $pagination) {
        orders {
          id
          quantity
          totalPrice
          status
          listing {
            title
          }
        }
        pagination {
          total
          pages
          currentPage
          hasNextPage
        }
      }
    }
  `;

  const variables = {
    pagination: {
      page: 1,
      limit: 5,
    },
  };

  try {
    const result = await graphqlRequest(GET_ORDERS_QUERY, variables, token);
    console.log('Orders:', result.orders);
    return result.orders;
  } catch (error) {
    console.error('Error getting orders:', error.message);
  }
}

// Example 8: Cancel an order
async function cancelOrderExample(token, orderId) {
  console.log('\n=== Cancel Order ===');
  
  const CANCEL_ORDER_MUTATION = `
    mutation CancelOrder($id: Int!, $cancelReason: String) {
      cancelOrder(id: $id, cancelReason: $cancelReason) {
        message
        order {
          id
          status
          cancelReason
          cancelledAt
        }
      }
    }
  `;

  const variables = {
    id: orderId,
    cancelReason: 'Changed my mind',
  };

  try {
    const result = await graphqlRequest(CANCEL_ORDER_MUTATION, variables, token);
    console.log('Order cancelled:', result.cancelOrder);
    return result.cancelOrder;
  } catch (error) {
    console.error('Error cancelling order:', error.message);
  }
}

// Main execution function
async function runExamples() {
  try {
    console.log('🎯 Running GraphQL API Examples');
    console.log('Make sure the server is running at', GRAPHQL_ENDPOINT);

    // Test basic queries (no auth required)
    await getUserExample();
    await getListingsExample();

    // Test authentication flow
    const token = await loginExample();
    
    if (token) {
      // Test authenticated operations
      await createListingExample(token);
      const order = await createOrderExample(token);
      await getOrdersExample(token);
      
      if (order) {
        await cancelOrderExample(token, order.id);
      }
    }

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

module.exports = {
  graphqlRequest,
  createUserExample,
  loginExample,
  getUserExample,
  createListingExample,
  getListingsExample,
  createOrderExample,
  getOrdersExample,
  cancelOrderExample,
  runExamples,
};
