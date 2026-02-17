# 📍 Lost & Found System

A full-stack web application built for the **Web Engineering Lab** course. Users can report lost items, post found items, view item details with contact info, and receive smart match suggestions based on category.

---

## 🛠 Technology Stack

| Layer               | Technology                            |
|---------------------|---------------------------------------|
| **Frontend**        | HTML5, CSS3, JavaScript (EJS templates) |
| **Backend**         | Node.js, Express.js                   |
| **Database**        | MySQL                                 |
| **Version Control** | Git & GitHub                          |
| **Auth**            | express-session, bcryptjs             |

---

## ✨ Features

### User Features
- **Register / Login / Logout** — Session-based auth with bcrypt password hashing
- **Report Lost Items** — Full CRUD: create, view, edit, delete, mark as recovered
- **Post Found Items** — Full CRUD: create, view, edit, delete, mark as claimed
- **Item Detail Pages** — Full description, date, location, reporter contact info
- **Smart Match Suggestions** — Each item detail page shows related items from the opposite list in the same category
- **Browse & Search** — Search by keyword, filter by category and date range, paginated results (9 per page)
- **Dashboard** — Manage all your items with search/filter, status tracking
- **Profile Page** — Edit name & phone number, change password

### Admin Features
- **Admin Dashboard** — Full stats: total lost, found, recovered, claimed, users
- **Toggle Item Status** — Mark any item as recovered/claimed or reopen it
- **Delete Any Item** — Remove any lost or found item
- **User Management** — View all users with item counts, delete non-admin users

### UX Features
- **Flash messages** — Success/error notifications after every action
- **Client-side validation** — All forms validated before submission
- **Responsive design** — Mobile-friendly layout
- **Pagination** — 9 items per page on the browse page
- **Date range filter** — Filter items by date posted

---

## 📁 Folder Structure

```
lost-found-system/
├── db/
│   └── schema.sql              # Run in MySQL Workbench to set up DB
├── middleware/
│   └── auth.js                 # requireLogin & requireAdmin guards
├── routes/
│   ├── auth.js                 # Home, Register, Login, Logout, Dashboard
│   ├── lostItems.js            # CRUD for lost items + detail page
│   ├── foundItems.js           # CRUD for found items + detail page
│   ├── admin.js                # Admin dashboard & management
│   └── profile.js              # View/edit profile, change password
├── views/
│   ├── partials/
│   │   ├── header.ejs          # Navbar + flash message
│   │   └── footer.ejs          # Footer + JS include
│   ├── index.ejs               # Home / Browse (with stats, filters, pagination)
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs           # User's own items with search
│   ├── item-detail.ejs         # Full item view + smart match sidebar
│   ├── lost-form.ejs           # Create / Edit lost item
│   ├── found-form.ejs          # Create / Edit found item
│   ├── profile.ejs             # Profile edit + password change
│   ├── admin.ejs               # Admin panel
│   └── error.ejs
├── public/
│   ├── css/style.css
│   └── js/validation.js
├── app.js                      # Express entry point
├── package.json
├── .env.example
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- MySQL / MySQL Workbench

### Step 1 — Clone
```bash
git clone https://github.com/YOUR_USERNAME/lost-found-system.git
cd lost-found-system
```

### Step 2 — Install
```bash
npm install
```

### Step 3 — Database Setup
1. Open **MySQL Workbench**
2. Open `db/schema.sql`
3. Run the script (`Ctrl+Shift+Enter`)

This creates the `lost_found_db` database, all tables, and a default admin account.

> **Default Admin:** `admin@lostfound.com` / `password`

### Step 4 — Environment Variables
```bash
copy .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lost_found_db
SESSION_SECRET=any_long_random_string
PORT=3000
```

### Step 5 — Run
```bash
npm start
```

Open: **http://localhost:3000**

---

## 🗄 Database Schema

### Users
| Field     | Type         | Constraints          |
|-----------|--------------|----------------------|
| UserID    | INT          | PK, AUTO_INCREMENT   |
| Name      | VARCHAR(100) | NOT NULL             |
| Email     | VARCHAR(100) | UNIQUE, NOT NULL     |
| Password  | VARCHAR(255) | NOT NULL (hashed)    |
| Phone     | VARCHAR(20)  | DEFAULT NULL         |
| Role      | ENUM         | 'User' / 'Admin'     |
| CreatedAt | TIMESTAMP    | DEFAULT NOW()        |

### Lost_Items
| Field        | Type         | Constraints          |
|--------------|--------------|----------------------|
| ItemID       | INT          | PK, AUTO_INCREMENT   |
| UserID       | INT          | FK → Users           |
| ItemName     | VARCHAR(100) | NOT NULL             |
| Category     | VARCHAR(50)  | NOT NULL             |
| Description  | TEXT         | NOT NULL             |
| DateLost     | DATE         | NOT NULL             |
| LocationLost | VARCHAR(200) | NOT NULL             |
| Status       | ENUM         | Active / Recovered   |
| CreatedAt    | TIMESTAMP    | DEFAULT NOW()        |
| UpdatedAt    | TIMESTAMP    | ON UPDATE NOW()      |

### Found_Items
| Field         | Type         | Constraints          |
|---------------|--------------|----------------------|
| ItemID        | INT          | PK, AUTO_INCREMENT   |
| UserID        | INT          | FK → Users           |
| ItemName      | VARCHAR(100) | NOT NULL             |
| Category      | VARCHAR(50)  | NOT NULL             |
| Description   | TEXT         | NOT NULL             |
| DateFound     | DATE         | NOT NULL             |
| LocationFound | VARCHAR(200) | NOT NULL             |
| Status        | ENUM         | Active / Claimed     |
| CreatedAt     | TIMESTAMP    | DEFAULT NOW()        |
| UpdatedAt     | TIMESTAMP    | ON UPDATE NOW()      |

### Relationships
- `Users → Lost_Items`: One-to-Many (UserID FK)
- `Users → Found_Items`: One-to-Many (UserID FK)

---

## 🔗 Routes

| Method | Route                          | Description                        | Auth     |
|--------|--------------------------------|------------------------------------|----------|
| GET    | /                              | Home / Browse with filters & pages | Public   |
| GET    | /register                      | Register form                      | Public   |
| POST   | /register                      | Create account                     | Public   |
| GET    | /login                         | Login form                         | Public   |
| POST   | /login                         | Authenticate user                  | Public   |
| GET    | /logout                        | End session                        | Login    |
| GET    | /dashboard                     | User dashboard (with search)       | Login    |
| GET    | /lost-items/:id                | Lost item detail + match sidebar   | Public   |
| GET    | /lost-items/new                | Create form                        | Login    |
| POST   | /lost-items                    | Create lost item                   | Login    |
| GET    | /lost-items/:id/edit           | Edit form                          | Login    |
| POST   | /lost-items/:id/update         | Update lost item                   | Login    |
| POST   | /lost-items/:id/delete         | Delete lost item                   | Login    |
| POST   | /lost-items/:id/recover        | Mark as recovered                  | Login    |
| GET    | /found-items/:id               | Found item detail + match sidebar  | Public   |
| GET    | /found-items/new               | Create form                        | Login    |
| POST   | /found-items                   | Create found item                  | Login    |
| GET    | /found-items/:id/edit          | Edit form                          | Login    |
| POST   | /found-items/:id/update        | Update found item                  | Login    |
| POST   | /found-items/:id/delete        | Delete found item                  | Login    |
| POST   | /found-items/:id/claim         | Mark as claimed                    | Login    |
| GET    | /profile                       | View profile & stats               | Login    |
| POST   | /profile/update                | Update name & phone                | Login    |
| POST   | /profile/change-password       | Change password                    | Login    |
| GET    | /admin                         | Admin dashboard                    | Admin    |
| POST   | /admin/lost/:id/toggle         | Toggle lost item status            | Admin    |
| POST   | /admin/found/:id/toggle        | Toggle found item status           | Admin    |
| POST   | /admin/users/:id/delete        | Delete a user                      | Admin    |

---

## 👤 Author

**Abdul Ahad** — FA21-BSE-001  
Department of Software Engineering, MUST  
Web Engineering Lab — Dr. Shamila Nasreen
