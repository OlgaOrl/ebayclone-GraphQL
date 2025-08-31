// In-memory data store for demonstration
// In production, this would be replaced with a real database

class DataStore {
  constructor() {
    this.users = [];
    this.listings = [];
    this.orders = [];
    this.sessions = new Set(); // Track active sessions
    
    // Auto-increment IDs
    this.nextUserId = 1;
    this.nextListingId = 1;
    this.nextOrderId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample users
    this.users.push({
      id: this.nextUserId++,
      username: 'john_doe',
      email: 'john@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    });

    this.users.push({
      id: this.nextUserId++,
      username: 'jane_smith',
      email: 'jane@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    });

    // Sample listings
    this.listings.push({
      id: this.nextListingId++,
      title: 'iPhone 13 Pro Max',
      description: 'Brand new, still in box',
      price: 999.99,
      category: 'electronics',
      condition: 'NEW',
      location: 'New York, NY',
      images: ['iphone1.jpg', 'iphone2.jpg'],
      userId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.listings.push({
      id: this.nextListingId++,
      title: 'Vintage Guitar',
      description: 'Classic acoustic guitar in excellent condition',
      price: 450.00,
      category: 'music',
      condition: 'GOOD',
      location: 'Los Angeles, CA',
      images: ['guitar1.jpg'],
      userId: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Sample orders
    this.orders.push({
      id: this.nextOrderId++,
      userId: 2,
      listingId: 1,
      quantity: 1,
      totalPrice: 999.99,
      status: 'PENDING',
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      buyerNotes: 'Please deliver after 5 PM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // User methods
  createUser(userData) {
    const user = {
      id: this.nextUserId++,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.users[userIndex];
  }

  deleteUser(id) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    this.users.splice(userIndex, 1);
    return true;
  }

  // Listing methods
  createListing(listingData) {
    const listing = {
      id: this.nextListingId++,
      ...listingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.listings.push(listing);
    return listing;
  }

  getListingById(id) {
    return this.listings.find(listing => listing.id === id);
  }

  getListings(filter = {}) {
    let filteredListings = [...this.listings];

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredListings = filteredListings.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm) ||
        listing.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.priceMin !== undefined) {
      filteredListings = filteredListings.filter(listing => listing.price >= filter.priceMin);
    }

    if (filter.priceMax !== undefined) {
      filteredListings = filteredListings.filter(listing => listing.price <= filter.priceMax);
    }

    if (filter.category) {
      filteredListings = filteredListings.filter(listing => listing.category === filter.category);
    }

    if (filter.condition) {
      filteredListings = filteredListings.filter(listing => listing.condition === filter.condition);
    }

    return filteredListings;
  }

  updateListing(id, updates) {
    const listingIndex = this.listings.findIndex(listing => listing.id === id);
    if (listingIndex === -1) return null;
    
    this.listings[listingIndex] = {
      ...this.listings[listingIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.listings[listingIndex];
  }

  deleteListing(id) {
    const listingIndex = this.listings.findIndex(listing => listing.id === id);
    if (listingIndex === -1) return false;
    
    this.listings.splice(listingIndex, 1);
    return true;
  }

  // Order methods
  createOrder(orderData) {
    const order = {
      id: this.nextOrderId++,
      ...orderData,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.orders.push(order);
    return order;
  }

  getOrderById(id) {
    return this.orders.find(order => order.id === id);
  }

  getOrders(filter = {}, pagination = { page: 1, limit: 10 }) {
    let filteredOrders = [...this.orders];

    if (filter.userId) {
      filteredOrders = filteredOrders.filter(order => order.userId === filter.userId);
    }

    if (filter.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filter.status);
    }

    // Pagination
    const total = filteredOrders.length;
    const pages = Math.ceil(total / pagination.limit);
    const offset = (pagination.page - 1) * pagination.limit;
    const paginatedOrders = filteredOrders.slice(offset, offset + pagination.limit);

    return {
      orders: paginatedOrders,
      pagination: {
        total,
        pages,
        currentPage: pagination.page,
        hasNextPage: pagination.page < pages,
        hasPreviousPage: pagination.page > 1,
      },
    };
  }

  updateOrder(id, updates) {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return null;
    
    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.orders[orderIndex];
  }

  deleteOrder(id) {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return false;
    
    this.orders.splice(orderIndex, 1);
    return true;
  }

  cancelOrder(id, cancelReason) {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return null;
    
    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelReason: cancelReason || 'No reason provided',
      updatedAt: new Date().toISOString(),
    };
    return this.orders[orderIndex];
  }

  updateOrderStatus(id, status) {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return null;
    
    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status,
      updatedAt: new Date().toISOString(),
    };
    return this.orders[orderIndex];
  }

  // Session methods
  addSession(token) {
    this.sessions.add(token);
  }

  removeSession(token) {
    this.sessions.delete(token);
  }

  isValidSession(token) {
    return this.sessions.has(token);
  }
}

// Export singleton instance
module.exports = new DataStore();
