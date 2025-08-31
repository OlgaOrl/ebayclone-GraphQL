const { GraphQLError } = require('graphql');

// Email validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new GraphQLError('Invalid email format', {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: { field: 'email', message: 'Email format is invalid' },
      },
    });
  }
}

// Password validation
function validatePassword(password) {
  if (!password || password.length < 6) {
    throw new GraphQLError('Password must be at least 6 characters long', {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: { field: 'password', message: 'Password must be at least 6 characters long' },
      },
    });
  }
}

// Username validation
function validateUsername(username) {
  if (!username || username.length < 3) {
    throw new GraphQLError('Username must be at least 3 characters long', {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: { field: 'username', message: 'Username must be at least 3 characters long' },
      },
    });
  }
}

// Price validation
function validatePrice(price) {
  if (price <= 0) {
    throw new GraphQLError('Price must be greater than 0', {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: { field: 'price', message: 'Price must be greater than 0' },
      },
    });
  }
}

// Quantity validation
function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new GraphQLError('Quantity must be a positive integer', {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: { field: 'quantity', message: 'Quantity must be a positive integer' },
      },
    });
  }
}

// Order status validation
function validateOrderStatus(status) {
  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw new GraphQLError(`Invalid status. Must be: ${validStatuses.join(', ')}`, {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: { field: 'status', message: `Invalid status. Must be: ${validStatuses.join(', ')}` },
      },
    });
  }
}

// Required fields validation
function validateRequired(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new GraphQLError(`${fieldName} is required`, {
      extensions: {
        code: 'VALIDATION_ERROR',
        details: { field: fieldName, message: `${fieldName} is required` },
      },
    });
  }
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePrice,
  validateQuantity,
  validateOrderStatus,
  validateRequired,
};
