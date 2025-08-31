const { GraphQLError } = require('graphql');
const dataStore = require('../data/store');
const { requireAuth, requireOwnership } = require('../utils/auth');
const { validateQuantity, validateOrderStatus, validateRequired } = require('../utils/validation');

const orderResolvers = {
  Query: {
    order: async (parent, { id }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const order = dataStore.getOrderById(id);
      if (!order) {
        throw new GraphQLError('Order not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Order with ID ${id} does not exist`,
          },
        });
      }

      // Check if user owns this order
      if (order.userId !== user.id) {
        throw new GraphQLError('Access denied', {
          extensions: {
            code: 'FORBIDDEN',
            details: 'You can only access your own orders',
          },
        });
      }

      return order;
    },

    orders: async (parent, { filter, pagination }, context) => {
      // Require authentication
      const user = requireAuth(context);

      // If no userId filter is provided, default to current user's orders
      const orderFilter = {
        ...filter,
        userId: filter?.userId || user.id,
      };

      // If trying to access another user's orders, check permissions
      if (filter?.userId && filter.userId !== user.id) {
        throw new GraphQLError('Access denied', {
          extensions: {
            code: 'FORBIDDEN',
            details: 'You can only access your own orders',
          },
        });
      }

      return dataStore.getOrders(orderFilter, pagination || { page: 1, limit: 10 });
    },
  },

  Mutation: {
    createOrder: async (parent, { input }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const { listingId, quantity, shippingAddress, buyerNotes } = input;

      // Validation
      validateRequired(listingId, 'listingId');
      validateRequired(quantity, 'quantity');
      validateRequired(shippingAddress, 'shippingAddress');
      validateQuantity(quantity);

      // Check if listing exists
      const listing = dataStore.getListingById(listingId);
      if (!listing) {
        throw new GraphQLError('Listing not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Listing with ID ${listingId} does not exist`,
          },
        });
      }

      // Calculate total price
      const totalPrice = listing.price * quantity;

      // Create order
      const newOrder = dataStore.createOrder({
        userId: user.id,
        listingId,
        quantity,
        totalPrice,
        shippingAddress,
        buyerNotes,
      });

      return newOrder;
    },

    updateOrder: async (parent, { id, input }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const existingOrder = dataStore.getOrderById(id);
      if (!existingOrder) {
        throw new GraphQLError('Order not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Order with ID ${id} does not exist`,
          },
        });
      }

      // Check ownership
      requireOwnership(context, existingOrder.userId);

      const updates = { ...input };

      // Validate updates
      if (input.quantity !== undefined) {
        validateQuantity(input.quantity);
        
        // Recalculate total price if quantity changed
        const listing = dataStore.getListingById(existingOrder.listingId);
        if (listing) {
          updates.totalPrice = listing.price * input.quantity;
        }
      }

      // Update order
      const updatedOrder = dataStore.updateOrder(id, updates);
      return updatedOrder;
    },

    deleteOrder: async (parent, { id }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const existingOrder = dataStore.getOrderById(id);
      if (!existingOrder) {
        throw new GraphQLError('Order not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Order with ID ${id} does not exist`,
          },
        });
      }

      // Check ownership
      requireOwnership(context, existingOrder.userId);

      // Delete order
      const deleted = dataStore.deleteOrder(id);
      if (!deleted) {
        throw new GraphQLError('Failed to delete order', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: 'An error occurred while deleting the order',
          },
        });
      }

      return { message: 'Order deleted successfully' };
    },

    cancelOrder: async (parent, { id, cancelReason }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const existingOrder = dataStore.getOrderById(id);
      if (!existingOrder) {
        throw new GraphQLError('Order not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Order with ID ${id} does not exist`,
          },
        });
      }

      // Check ownership
      requireOwnership(context, existingOrder.userId);

      // Check if order can be cancelled
      if (existingOrder.status === 'CANCELLED') {
        throw new GraphQLError('Order is already cancelled', {
          extensions: {
            code: 'INVALID_OPERATION',
            details: 'This order has already been cancelled',
          },
        });
      }

      if (existingOrder.status === 'DELIVERED') {
        throw new GraphQLError('Cannot cancel delivered order', {
          extensions: {
            code: 'INVALID_OPERATION',
            details: 'Delivered orders cannot be cancelled',
          },
        });
      }

      // Cancel order
      const cancelledOrder = dataStore.cancelOrder(id, cancelReason);

      return {
        message: 'Order cancelled successfully',
        order: cancelledOrder,
      };
    },

    updateOrderStatus: async (parent, { id, status }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const existingOrder = dataStore.getOrderById(id);
      if (!existingOrder) {
        throw new GraphQLError('Order not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Order with ID ${id} does not exist`,
          },
        });
      }

      // Check ownership (or in real app, check if user is seller)
      requireOwnership(context, existingOrder.userId);

      // Validate status
      validateOrderStatus(status);

      // Update order status
      const updatedOrder = dataStore.updateOrderStatus(id, status);
      return updatedOrder;
    },
  },

  Subscription: {
    orderStatusChanged: {
      // Placeholder for subscription implementation
      subscribe: () => {
        return {
          [Symbol.asyncIterator]: async function* () {
            // This is a placeholder - real implementation would use Redis/PubSub
            yield { orderStatusChanged: null };
          }
        };
      },
    },
  },

  Order: {
    user: async (parent, args, context) => {
      const user = dataStore.getUserById(parent.userId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    },

    listing: async (parent, args, context) => {
      return dataStore.getListingById(parent.listingId);
    },
  },
};

module.exports = orderResolvers;
