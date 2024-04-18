# fx-Conversion API

This project implements a RESTful API for currency conversion and related functionalities using Node.js with TypeScript, Next.js, Prisma, Redis, and JWT authentication. It provides endpoints for user authentication, foreign exchange rate retrieval, currency conversion, balance updates, and more.

## Features

- **User Authentication**: Users can authenticate using JWT tokens.
- **Foreign Exchange Rates**: Retrieve real-time foreign exchange rates from an external API and cache them in Redis.
- **Currency Conversion**: Convert currency from one currency to another with proper authentication and balance checks.
- **Balance Updates**: Deposit funds, check account balances, and update user balances for various currencies.

## Endpoints

### Authentication

- `POST /api/login`: User login with username and password.
- `POST /api/signup`: User signup with a new account.

### Foreign Exchange Rates

- `GET /api/fx-rates`: Get foreign exchange rates from the cache or fetch from the API.

### Currency Conversion

- `POST /api/convert`: Convert currency from one currency to another.

### Balance Management

- `GET /api/balances`: Get user balances for various currencies.
- `POST /api/deposit`: Deposit funds into the user's account for a specific currency.

## Installation

1. Clone the repository:
`git clone https://github.com/your_username/currency-conversion-api.git`

2. Install dependencies:
`cd currency-conversion-api`
`npm install`
3. Set up environment variables:

Create a `.env` file in the root directory and add the following variables:

`SECRET_KEY=your_secret_key`

4. Start the development server:
`npm run dev`

5. Access the API endpoints at `http://localhost:3000/api`.

## Technologies Used

- Node.js
- TypeScript
- Next.js
- Prisma
- Redis
- JWT authentication

