const { GraphQLError } = require('graphql');
const dataStore = require('../data/store');
const { requireAuth, requireOwnership } = require('../utils/auth');
const { validatePrice, validateRequired } = require('../utils/validation');

const listingResolvers = {
  Query: {
    listing: async (parent, { id }, context) => {
      const listing = dataStore.getListingById(id);
      if (!listing) {
        throw new GraphQLError('Listing not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Listing with ID ${id} does not exist`,
          },
        });
      }
      return listing;
    },

    listings: async (parent, { filter }, context) => {
      return dataStore.getListings(filter || {});
    },
  },

  Mutation: {
    createListing: async (parent, { input }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const { title, description, price, category, condition, location, images } = input;

      // Validation
      validateRequired(title, 'title');
      validateRequired(description, 'description');
      validateRequired(price, 'price');
      validatePrice(price);

      // Handle image uploads (simplified for demo)
      let imageUrls = [];
      if (images && images.length > 0) {
        // In a real implementation, you would process the uploads
        // For now, we'll simulate with placeholder URLs
        imageUrls = images.map((_, index) => `listing_${Date.now()}_${index}.jpg`);
      }

      // Create listing
      const newListing = dataStore.createListing({
        title,
        description,
        price,
        category,
        condition,
        location,
        images: imageUrls,
        userId: user.id,
      });

      return newListing;
    },

    updateListing: async (parent, { id, input }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const existingListing = dataStore.getListingById(id);
      if (!existingListing) {
        throw new GraphQLError('Listing not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Listing with ID ${id} does not exist`,
          },
        });
      }

      // Check ownership
      requireOwnership(context, existingListing.userId);

      const updates = { ...input };

      // Validate updates
      if (input.price !== undefined) {
        validatePrice(input.price);
      }

      // Update listing
      const updatedListing = dataStore.updateListing(id, updates);
      return updatedListing;
    },

    deleteListing: async (parent, { id }, context) => {
      // Require authentication
      const user = requireAuth(context);

      const existingListing = dataStore.getListingById(id);
      if (!existingListing) {
        throw new GraphQLError('Listing not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `Listing with ID ${id} does not exist`,
          },
        });
      }

      // Check ownership
      requireOwnership(context, existingListing.userId);

      // Delete listing
      const deleted = dataStore.deleteListing(id);
      if (!deleted) {
        throw new GraphQLError('Failed to delete listing', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: 'An error occurred while deleting the listing',
          },
        });
      }

      return { message: 'Listing deleted successfully' };
    },
  },

  Subscription: {
    newListing: {
      // Placeholder for subscription implementation
      subscribe: () => {
        // In a real implementation, you would use a pub/sub system
        // For now, return a simple async iterator
        return {
          [Symbol.asyncIterator]: async function* () {
            // This is a placeholder - real implementation would use Redis/PubSub
            yield { newListing: null };
          }
        };
      },
    },
  },

  Listing: {
    user: async (parent, args, context) => {
      const user = dataStore.getUserById(parent.userId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    },
  },
};

module.exports = listingResolvers;
