# EMS Backend (Express.js)

This is the backend API for the Employee Management System, built with Express.js.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

The server will start at [http://localhost:5000](http://localhost:5000) (or your configured PORT).

## Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=5000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret_key
```

## Scripts

- `npm run dev`: Starts the server with `nodemon` for auto-reloading.
- `npm start`: Starts the production server.
- `npm test`: Runs the test suite.