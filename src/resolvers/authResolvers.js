const bcrypt = require('bcryptjs');
const { GraphQLError } = require('graphql');
const dataStore = require('../data/store');
const { generateToken, requireAuth } = require('../utils/auth');
const { validateEmail, validateRequired } = require('../utils/validation');

const authResolvers = {
  Mutation: {
    login: async (parent, { input }, context) => {
      const { email, password } = input;

      // Validation
      validateRequired(email, 'email');
      validateRequired(password, 'password');
      validateEmail(email);

      // Find user by email
      const user = dataStore.getUserByEmail(email);
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: {
            code: 'AUTHENTICATION_ERROR',
            details: 'Invalid email or password',
          },
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new GraphQLError('Invalid credentials', {
          extensions: {
            code: 'AUTHENTICATION_ERROR',
            details: 'Invalid email or password',
          },
        });
      }

      // Generate token
      const token = generateToken(user);
      
      // Add session to store
      dataStore.addSession(token);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        token,
        user: userWithoutPassword,
      };
    },

    logout: async (parent, args, context) => {
      // Require authentication
      requireAuth(context);

      // Remove session from store
      if (context.token) {
        dataStore.removeSession(context.token);
      }

      return { message: 'Logout successful' };
    },
  },
};

module.exports = authResolvers;
