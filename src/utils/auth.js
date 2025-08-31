const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new GraphQLError('Invalid or expired token', {
      extensions: {
        code: 'UNAUTHENTICATED',
        details: error.message,
      },
    });
  }
}

// Middleware to require authentication
function requireAuth(context) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
        details: 'You must be logged in to perform this action',
      },
    });
  }
  return context.user;
}

// Check if user owns resource
function requireOwnership(context, resourceUserId) {
  const user = requireAuth(context);
  if (user.id !== resourceUserId) {
    throw new GraphQLError('Access denied', {
      extensions: {
        code: 'FORBIDDEN',
        details: 'You can only access your own resources',
      },
    });
  }
  return user;
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  requireOwnership,
  JWT_SECRET,
};
