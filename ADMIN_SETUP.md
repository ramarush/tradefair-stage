# TradeFair Admin Panel Setup Guide

## Overview
This Next.js application includes a comprehensive admin panel with user management, financial request processing, and content management capabilities.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running (locally on port 5432 or remote)
- Environment variables configured

## Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/tradefair
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tradefair

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_URL=https://tradefair.onrender.com
NEXTAUTH_SECRET=your-nextauth-secret

# TinyMCE (for rich text editing)
TINYMCE_API_KEY=your-tinymce-api-key
```

## Database Setup

1. **Initialize the database schema:**
   ```bash
   npm run db:init
   ```

2. **Update schema to add admin/staff fields:**
   ```bash
   npm run db:update-schema
   ```

3. **Create admin panel tables:**
   ```bash
   npm run db:create-admin-tables
   ```

4. **Create a superadmin user:**
   ```bash
   npm run create-superadmin
   ```
   This will prompt you to enter details for the admin user.

## Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Main site: https://tradefair.onrender.com
   - Admin panel: https://tradefair.onrender.com/admin

## Admin Panel Features

### Authentication
- JWT-based authentication with role-based access
- Admin and staff user roles
- Protected routes and API endpoints

### User Management (`/admin/users`)
- View all users with search and filtering
- Create new users
- Edit user details
- Block/unblock users
- Delete users
- Role management (admin/staff flags)

### Deposit Management (`/admin/deposits`)
- View all deposit requests
- Filter by status (pending, approved, rejected, etc.)
- Update deposit status
- Add admin notes
- Pagination support

### Withdrawal Management (`/admin/withdrawals`)
- View all withdrawal requests
- Filter by status
- Update withdrawal status
- Add MTR numbers for tracking
- Add admin notes
- Pagination support

### News Management (`/admin/news`)
- Create, edit, and delete news articles
- Rich text editor (TinyMCE)
- Draft, published, and archived statuses
- Featured image support
- SEO-friendly slugs

### Blog Management (`/admin/blogs`)
- Create, edit, and delete blog posts
- Rich text editor with full formatting
- Tag system for categorization
- Draft, published, and archived statuses
- Featured image support
- SEO-friendly slugs

## Public Pages

### News (`/news`)
- Public listing of published news articles
- Individual news article pages (`/news/[slug]`)
- Responsive design
- Author information display

### Blogs (`/blogs`)
- Public listing of published blog posts
- Tag-based filtering
- Individual blog post pages (`/blogs/[slug]`)
- Tag navigation
- Author information display

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Admin APIs (Protected)
- `GET/POST /api/admin/users` - User management
- `GET/PUT/DELETE /api/admin/users/[id]` - Individual user operations
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET/PUT /api/admin/deposits/[id]` - Deposit management
- `GET/PUT /api/admin/withdrawals/[id]` - Withdrawal management
- `GET/POST /api/admin/news` - News management
- `GET/PUT/DELETE /api/admin/news/[id]` - Individual news operations
- `GET/POST /api/admin/blogs` - Blog management
- `GET/PUT/DELETE /api/admin/blogs/[id]` - Individual blog operations

### Public APIs
- `GET /api/news` - Public news listing
- `GET /api/news/[slug]` - Individual news article
- `GET /api/blogs` - Public blog listing
- `GET /api/blogs/[slug]` - Individual blog post

## Database Schema

### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- phone (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- password (VARCHAR) -- bcrypt hashed
- is_active (BOOLEAN DEFAULT true)
- is_admin (BOOLEAN DEFAULT false)
- is_staff (BOOLEAN DEFAULT false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Deposit Requests Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users)
- amount (DECIMAL)
- status (VARCHAR) -- pending, approved, rejected, etc.
- admin_notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Withdrawal Requests Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users)
- amount (DECIMAL)
- status (VARCHAR)
- mtr_number (VARCHAR) -- Money Transfer Reference
- admin_notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### News Table
```sql
- id (SERIAL PRIMARY KEY)
- title (VARCHAR)
- slug (VARCHAR UNIQUE)
- content (TEXT)
- excerpt (TEXT)
- featured_image (VARCHAR)
- status (VARCHAR) -- draft, published, archived
- author_id (INTEGER REFERENCES users)
- published_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Blogs Table
```sql
- id (SERIAL PRIMARY KEY)
- title (VARCHAR)
- slug (VARCHAR UNIQUE)
- content (TEXT)
- excerpt (TEXT)
- featured_image (VARCHAR)
- tags (TEXT[]) -- Array of tags
- status (VARCHAR) -- draft, published, archived
- author_id (INTEGER REFERENCES users)
- published_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Protected admin routes
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## TinyMCE Setup

To enable the rich text editor:

1. Sign up for a free TinyMCE account at https://www.tiny.cloud/
2. Get your API key
3. Add it to your `.env.local` file as `TINYMCE_API_KEY`
4. Update the TinyMCE configuration in the admin components

## Deployment Considerations

1. **Environment Variables:** Ensure all production environment variables are set
2. **Database:** Set up production PostgreSQL database
3. **Security:** Use strong JWT secrets and secure database credentials
4. **HTTPS:** Enable HTTPS in production
5. **File Uploads:** Consider implementing proper file upload handling for images

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify PostgreSQL is running
   - Check environment variables
   - Ensure database exists

2. **Authentication Issues:**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure user has proper roles

3. **TinyMCE Not Loading:**
   - Verify API key is correct
   - Check network connectivity
   - Ensure TinyMCE CDN is accessible

## Support

For issues or questions:
1. Check the console for error messages
2. Verify database connections
3. Review environment variable configuration
4. Check API endpoint responses in browser dev tools

## Next Steps

1. **Customer-Side Features:** Implement deposit/withdrawal request forms for customers
2. **Email Notifications:** Add email notifications for status updates
3. **File Upload:** Implement proper image upload functionality
4. **Advanced Permissions:** Add more granular permission system
5. **Audit Logs:** Track admin actions for compliance
6. **Dashboard Analytics:** Add more detailed analytics and charts
