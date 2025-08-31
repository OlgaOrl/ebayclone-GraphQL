const bcrypt = require('bcryptjs');
const { GraphQLError } = require('graphql');
const dataStore = require('../data/store');
const { requireAuth, requireOwnership } = require('../utils/auth');
const { validateEmail, validatePassword, validateUsername, validateRequired } = require('../utils/validation');

const userResolvers = {
  Query: {
    user: async (parent, { id }, context) => {
      const user = dataStore.getUserById(id);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `User with ID ${id} does not exist`,
          },
        });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
  },

  Mutation: {
    createUser: async (parent, { input }, context) => {
      const { username, email, password } = input;

      // Validation
      validateRequired(username, 'username');
      validateRequired(email, 'email');
      validateRequired(password, 'password');
      validateUsername(username);
      validateEmail(email);
      validatePassword(password);

      // Check if email already exists
      const existingUser = dataStore.getUserByEmail(email);
      if (existingUser) {
        throw new GraphQLError('Email already exists', {
          extensions: {
            code: 'CONFLICT',
            details: { field: 'email', message: 'A user with this email already exists' },
          },
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = dataStore.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    },

    updateUser: async (parent, { id, input }, context) => {
      // Require authentication and ownership
      requireOwnership(context, id);

      const existingUser = dataStore.getUserById(id);
      if (!existingUser) {
        throw new GraphQLError('User not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `User with ID ${id} does not exist`,
          },
        });
      }

      const updates = { ...input };

      // Validate updates
      if (input.username) {
        validateUsername(input.username);
      }
      
      if (input.email) {
        validateEmail(input.email);
        
        // Check if new email already exists (excluding current user)
        const existingEmailUser = dataStore.getUserByEmail(input.email);
        if (existingEmailUser && existingEmailUser.id !== id) {
          throw new GraphQLError('Email already exists', {
            extensions: {
              code: 'CONFLICT',
              details: { field: 'email', message: 'A user with this email already exists' },
            },
          });
        }
      }

      if (input.password) {
        validatePassword(input.password);
        updates.password = await bcrypt.hash(input.password, 10);
      }

      // Update user
      const updatedUser = dataStore.updateUser(id, updates);

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    },

    deleteUser: async (parent, { id }, context) => {
      // Require authentication and ownership
      requireOwnership(context, id);

      const existingUser = dataStore.getUserById(id);
      if (!existingUser) {
        throw new GraphQLError('User not found', {
          extensions: {
            code: 'NOT_FOUND',
            details: `User with ID ${id} does not exist`,
          },
        });
      }

      // Delete user
      const deleted = dataStore.deleteUser(id);
      if (!deleted) {
        throw new GraphQLError('Failed to delete user', {
          extensions: {
            code: 'INTERNAL_ERROR',
            details: 'An error occurred while deleting the user',
          },
        });
      }

      return { message: 'User deleted successfully' };
    },
  },

  User: {
    // User type resolvers for nested fields if needed
    // Currently all fields are directly available from the data store
  },
};

module.exports = userResolvers;
