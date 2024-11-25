## Highlights

- Get product pricing based on product code and location
- Admin-only endpoints for creating, updating, and deleting products
- JWT-based authentication and role-based access control
- Swagger documentation
- PostgreSQL database integration
- Docker support
- Unit tests

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (if running locally)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd motor-insurance-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-key-change-this-in-production
```

## Running the Application

### Using Docker

1. Start the application and database:
```bash
docker-compose up -d
```

The API will be available at `http://localhost:3000`
Swagger documentation will be at `http://localhost:3000/api`

### Local Development

1. Start the application:
```bash
npm run start:dev
```

## Authentication

The API uses JWT (JSON Web Token) based authentication. All requests must include a valid JWT token in the Authorization header.

### Generating Test Tokens

You can generate test tokens using Node.js:

```bash
# Generate Admin Token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: '123', role: 'admin', email: 'admin@example.com' },
  'your-super-secret-key-change-this-in-production',
  { expiresIn: '1h' }
);
console.log(token);
")

# Generate Regular User Token
USER_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: '456', role: 'user', email: 'user@example.com' },
  'your-super-secret-key-change-this-in-production',
  { expiresIn: '1h' }
);
console.log(token);
")
```

## API Endpoints

All endpoints require an Authorization header with a Bearer token.

### Example CURL Requests

1. Create new product (Admin only):
```bash
curl -X POST http://localhost:3000/product \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "productCode": "3000",
  "location": "West Malaysia",
  "price": 750
}'
```

2. Get product price (Any authenticated user):
```bash
curl "http://localhost:3000/product?productCode=3000&location=West%20Malaysia" \
-H "Authorization: Bearer $USER_TOKEN"
```

3. Update product (Admin only):
```bash
curl -X PUT "http://localhost:3000/product?productCode=3000" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "location": "West Malaysia",
  "price": 800
}'
```

4. Delete product (Admin only):
```bash
curl -X DELETE "http://localhost:3000/product?productCode=3000" \
-H "Authorization: Bearer $TOKEN"
```

## Expected Responses

### Successful Responses

1. Create/Update Product (201/200):
```json
{
  "id": 5,
  "productCode": "3000",
  "location": "West Malaysia",
  "price": 750
}
```

2. Get Product (200):
```json
{
  "id": 5,
  "productCode": "3000",
  "location": "West Malaysia",
  "price": 750
}
```

### Error Responses

1. Unauthorized (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

2. Invalid Token:
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

3. Expired Token:
```json
{
  "statusCode": 401,
  "message": "Token has expired"
}
```

## Testing

Run unit tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:cov
```