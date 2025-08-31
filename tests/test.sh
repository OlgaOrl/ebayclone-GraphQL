#!/bin/bash

# eBayClone GraphQL API Test Suite
# This script runs automated tests to verify GraphQL functionality

set -e  # Exit on any error

echo "🧪 Starting eBayClone GraphQL API Tests..."

# Configuration
GRAPHQL_ENDPOINT="http://localhost:4000/graphql"
TEST_RESULTS_FILE="tests/test-results.json"
FAILED_TESTS=0
TOTAL_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to make GraphQL requests
make_graphql_request() {
    local query="$1"
    local variables="$2"
    local token="$3"

    if [ -n "$token" ]; then
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "{\"query\": \"$query\", \"variables\": $variables}" \
            "$GRAPHQL_ENDPOINT"
    else
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$query\", \"variables\": $variables}" \
            "$GRAPHQL_ENDPOINT"
    fi
}

# Test result checker
check_test_result() {
    local test_name="$1"
    local result="$2"
    local expected_field="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if echo "$result" | grep -q '"errors"'; then
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        echo "   Error: $(echo "$result" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    elif [ -n "$expected_field" ] && ! echo "$result" | grep -q "$expected_field"; then
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        echo "   Expected field '$expected_field' not found in response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    else
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        return 0
    fi
}

# Check if server is running
echo "🔍 Checking if GraphQL server is running..."
if ! curl -s "$GRAPHQL_ENDPOINT" >/dev/null; then
    echo -e "${RED}❌ GraphQL server is not running at $GRAPHQL_ENDPOINT${NC}"
    echo "Please start the server with ./run.sh first"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# Test 1: Schema introspection
echo -e "\n${YELLOW}📋 Testing Schema Introspection...${NC}"
INTROSPECTION_QUERY='query IntrospectionQuery { __schema { types { name } } }'
result=$(make_graphql_request "$INTROSPECTION_QUERY" "{}")
check_test_result "Schema Introspection" "$result" '"__schema"'

# Test 2: Get user (no auth required)
echo -e "\n${YELLOW}👤 Testing User Queries...${NC}"
GET_USER_QUERY='query GetUser($id: Int!) { user(id: $id) { id username email } }'
result=$(make_graphql_request "$GET_USER_QUERY" '{"id": 1}')
check_test_result "Get User by ID" "$result" '"user"'

# Test 3: Get listings (no auth required)
echo -e "\n${YELLOW}📦 Testing Listing Queries...${NC}"
GET_LISTINGS_QUERY='query GetListings { listings { id title price } }'
result=$(make_graphql_request "$GET_LISTINGS_QUERY" "{}")
check_test_result "Get All Listings" "$result" '"listings"'

# Test 4: Get listings with filters
GET_LISTINGS_FILTERED_QUERY='query GetListingsFiltered($filter: ListingFilterInput) { listings(filter: $filter) { id title price } }'
result=$(make_graphql_request "$GET_LISTINGS_FILTERED_QUERY" '{"filter": {"priceMax": 1000}}')
check_test_result "Get Listings with Filter" "$result" '"listings"'

# Test 5: User login
echo -e "\n${YELLOW}🔐 Testing Authentication...${NC}"
LOGIN_MUTATION='mutation Login($input: UserLoginInput!) { login(input: $input) { token user { id username } } }'
result=$(make_graphql_request "$LOGIN_MUTATION" '{"input": {"email": "john@example.com", "password": "password"}}')
check_test_result "User Login" "$result" '"token"'

# Extract token for authenticated tests
AUTH_TOKEN=$(echo "$result" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get authentication token, skipping authenticated tests${NC}"
else
    echo -e "${GREEN}✅ Authentication token obtained${NC}"
    
    # Test 6: Create listing (requires auth)
    echo -e "\n${YELLOW}📝 Testing Authenticated Mutations...${NC}"
    CREATE_LISTING_MUTATION='mutation CreateListing($input: ListingCreateInput!) { createListing(input: $input) { id title price } }'
    result=$(make_graphql_request "$CREATE_LISTING_MUTATION" '{"input": {"title": "Test Item", "description": "Test description", "price": 99.99}}' "$AUTH_TOKEN")
    check_test_result "Create Listing" "$result" '"createListing"'

    # Test 7: Get orders (requires auth)
    GET_ORDERS_QUERY='query GetOrders { orders { orders { id status } pagination { total } } }'
    result=$(make_graphql_request "$GET_ORDERS_QUERY" "{}" "$AUTH_TOKEN")
    check_test_result "Get Orders" "$result" '"orders"'

    # Test 8: Create order (requires auth)
    CREATE_ORDER_MUTATION='mutation CreateOrder($input: OrderCreateInput!) { createOrder(input: $input) { id status totalPrice } }'
    result=$(make_graphql_request "$CREATE_ORDER_MUTATION" '{"input": {"listingId": 1, "quantity": 1, "shippingAddress": {"street": "123 Test St", "city": "Test City", "country": "USA"}}}' "$AUTH_TOKEN")
    check_test_result "Create Order" "$result" '"createOrder"'

    # Extract order ID for cancellation test
    ORDER_ID=$(echo "$result" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
        # Test 9: Cancel order
        CANCEL_ORDER_MUTATION='mutation CancelOrder($id: Int!, $cancelReason: String) { cancelOrder(id: $id, cancelReason: $cancelReason) { message order { status } } }'
        result=$(make_graphql_request "$CANCEL_ORDER_MUTATION" "{\"id\": $ORDER_ID, \"cancelReason\": \"Test cancellation\"}" "$AUTH_TOKEN")
        check_test_result "Cancel Order" "$result" '"cancelOrder"'
    fi

    # Test 10: Logout
    LOGOUT_MUTATION='mutation Logout { logout { message } }'
    result=$(make_graphql_request "$LOGOUT_MUTATION" "{}" "$AUTH_TOKEN")
    check_test_result "User Logout" "$result" '"logout"'
fi

# Test 11: Error handling - Invalid user ID
echo -e "\n${YELLOW}⚠️  Testing Error Handling...${NC}"
result=$(make_graphql_request "$GET_USER_QUERY" '{"id": 99999}')
if echo "$result" | grep -q '"errors"'; then
    echo -e "${GREEN}✅ PASS: Error Handling - Invalid User ID${NC}"
else
    echo -e "${RED}❌ FAIL: Error Handling - Invalid User ID${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 12: Unauthorized access
PROTECTED_QUERY='query GetOrders { orders { orders { id } } }'
result=$(make_graphql_request "$PROTECTED_QUERY" "{}")
if echo "$result" | grep -q '"errors"'; then
    echo -e "${GREEN}✅ PASS: Unauthorized Access Protection${NC}"
else
    echo -e "${RED}❌ FAIL: Unauthorized Access Protection${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "Total tests: $TOTAL_TESTS"
echo "Passed: $((TOTAL_TESTS - FAILED_TESTS))"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}💥 $FAILED_TESTS test(s) failed${NC}"
    exit 1
fi
