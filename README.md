# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for wholesale/distribution companies built with modern technologies.

## Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MySQL 8.0+
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** express-validator
- **ORM:** Raw SQL with mysql2 (for full control)

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** CSS Modules + Custom CSS
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **State Management:** React Context API
- **Build Tool:** Vite

### DevOps
- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions (optional)
- **Deployment:** Render / Railway / Vercel

---

## Project Structure

```
mini-erp-crm/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & app configuration
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── modules/         # Feature modules (auth, customers, products, etc.)
│   │   ├── database/        # Migrations & seeders
│   │   └── utils/           # Helper functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API service layer
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page-level components
│   │   ├── styles/          # Global & module CSS
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Frontend utilities
│   ├── package.json
│   └── vite.config.ts
├── docker/
│   └── docker-compose.yml
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/mini-erp-crm.git
cd mini-erp-crm
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run migrate    # Run database migrations
npm run seed       # Seed default users
npm run dev        # Start dev server on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # Start dev server on port 5173
```

### 4. Docker Setup (Alternative)
```bash
docker-compose -f docker/docker-compose.yml up --build
```

---

## Test Login Credentials

| Role      | Username    | Password      |
|-----------|-------------|---------------|
| Admin     | admin       | Password@123  |
| Sales     | sales1      | Password@123  |
| Warehouse | warehouse1  | Password@123  |
| Accounts  | accounts1   | Password@123  |

---

## API Documentation

### Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| POST   | /auth/login      | User login         |
| POST   | /auth/register   | Register new user  |
| GET    | /auth/me         | Get current user   |

### Customers
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /customers                    | List all customers       |
| GET    | /customers/:id                | Get customer details     |
| POST   | /customers                    | Create customer          |
| PUT    | /customers/:id                | Update customer          |
| DELETE | /customers/:id                | Delete customer          |
| POST   | /customers/:id/followups      | Add follow-up note       |
| GET    | /customers/:id/followups      | Get follow-up history    |

### Products
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /products                     | List all products        |
| GET    | /products/:id                 | Get product details      |
| POST   | /products                     | Create product           |
| PUT    | /products/:id                 | Update product           |
| GET    | /products/low-stock           | Get low stock alerts     |

### Inventory
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /inventory/movements          | List stock movements     |
| POST   | /inventory/movements          | Record stock movement    |
| GET    | /inventory/movements/:productId | Product movement history |

### Sales Challans
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /challans                     | List all challans        |
| GET    | /challans/:id                 | Get challan details      |
| POST   | /challans                     | Create challan           |
| PUT    | /challans/:id                 | Update draft challan     |
| PATCH  | /challans/:id/confirm         | Confirm challan          |
| PATCH  | /challans/:id/cancel          | Cancel challan           |

---

## Architecture Decisions

1. **Raw SQL over ORM:** Chose mysql2 with raw SQL for precise control over queries, especially for stock management transactions.
2. **Module-based structure:** Each feature (auth, customers, products, challans) is self-contained with its own routes, controllers, and services.
3. **Product Snapshots:** Challan items store a frozen copy of product data at creation time, ensuring historical accuracy.
4. **Transactional Stock Management:** Stock updates use MySQL transactions with row-level locking to prevent race conditions.
5. **JWT Authentication:** Stateless auth with role-based middleware for clean access control.

---

## Known Limitations

- No real-time notifications for low stock alerts (polling-based)
- No file upload for product images (can be added with S3)
- No invoice PDF generation (marked as bonus)
- Single warehouse support (can be extended to multi-warehouse)

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mini_erp_crm
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```
