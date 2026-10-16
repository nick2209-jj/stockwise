# IOMS — Inventory and Order Management

MERN workspaces: React/Vite frontend in `client/`, Express/Mongoose API in `server/`.

## Setup

1. Install dependencies at the repository root:

   ```powershell
   npm install
   ```

2. Create `server/.env` and replace the placeholders with a MongoDB URI, a
   random JWT secret, and credentials you choose for the initial admin and
   seeded sample customers:

   ```powershell
   Copy-Item server\.env.example server\.env
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Put the generated value in `server/.env` as `JWT_SECRET`. Set
   `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and
   `SAMPLE_CUSTOMER_PASSWORD`; both passwords must be at least 8 characters.
   Do not use the example placeholders or commit `server/.env`.

3. Seed the admin, sample customers, products, orders, and movements:

   ```powershell
   npm run seed
   ```

   Run this from the repository root. The seeder always reads `server/.env`,
   regardless of the terminal's working directory. It reports the specific
   missing variables and expected config path if the file is incomplete.

4. Run the API and frontend in separate terminals:

   ```powershell
   npm run dev:server
   npm run dev
   ```

   The API listens on port 5000 and Vite on port 5173 by default.

## API overview

- `POST /api/auth/register` registers a Customer; `POST /api/auth/login` returns
  a JWT containing the user ID and role. Send it as `Authorization: Bearer <token>`.
- `GET /api/products` is the public catalog. Product write operations are
  Admin-only. Product create/update accepts `multipart/form-data` with an
  optional `image` file (JPEG, PNG, WebP, or GIF, up to 5 MB) or an `imageUrl`;
  local uploads are served from `/uploads`.
- `POST /api/orders` places a customer order, calculates the total from stored
  product prices, and reserves stock. `GET /api/orders/mine` and
  `PATCH /api/orders/:id/cancel` are customer-scoped.
- Admin-only inventory endpoints are `GET /api/inventory/movements` and
  `POST /api/inventory/adjustments`.
- Admin order endpoints are `GET /api/orders` and
  `PATCH /api/orders/:id/status`.
- Admin customer data and order history are available from `GET /api/customers`
  and `GET /api/customers/:id/orders`.
- Admin analytics are served by `GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`.
- Admin profile and store preferences use `GET /api/settings`,
  `PATCH /api/settings/profile`, and `PUT /api/settings/preferences`.

The frontend uses Axios and per-tab session storage for the JWT and shopping
cart, so opening the app in a separate tab allows a separate login. Product
image URL fields should contain a direct image address; Google Images result
pages are not image files. Alternatively, upload an image in the product form.
Business records are fetched from the MongoDB-backed API.
