# Full-Stack Web Application

A modern full-stack web application built with React frontend and Node.js backend, featuring user authentication, responsive design, and a complete user management system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### Installation & Setup

1. **Clone and install dependencies:**
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

2. **Set up environment variables:**
```bash
# Create .env file in backend directory
cd backend
cp .env.example .env  # If you have an example file
```

Add to `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/your-database-name
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

3. **Start MongoDB:**
```bash
# Make sure MongoDB is running on your system
mongod
```

4. **Run the application:**
```bash
# Run both backend and frontend simultaneously
npm run dev
```

## 📁 Project Structure

```
Project Folder/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── app.js         # Main server file
│   │   ├── modules/       # Feature modules
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Utility functions
│   │   └── scripts/       # Admin creation scripts
│   ├── package.json
│   └── README.md
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API services
│   │   └── App.jsx        # Main app component
│   ├── package.json
│   └── README.md
├── package.json           # Root package.json
└── README.md             # This file
```

## 🛠️ Available Scripts

### Root Level Commands
```bash
# Development
npm run dev                # Run both backend and frontend
npm run dev:backend        # Run only backend
npm run dev:frontend       # Run only frontend

# Installation
npm run install:all        # Install all dependencies

# Production
npm run build              # Build frontend for production
npm start                  # Start backend in production
```

### Backend Commands
```bash
cd backend
npm run dev                # Development with nodemon
npm start                  # Production mode
npm run create-admin       # Create admin user
```

### Frontend Commands
```bash
cd frontend
npm run dev                # Development server
npm run build              # Production build
npm run preview            # Preview production build
npm run lint               # Run ESLint
```

## 🌐 Application URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Documentation:** http://localhost:5000/api

## 🔐 Authentication System

### User Roles
- **User:** Regular users with basic access
- **Admin:** Administrators with elevated privileges

### Authentication Flow
1. **Registration:** Users can create accounts (default role: 'user')
2. **Login:** JWT-based authentication
3. **Protected Routes:** Dashboard requires authentication
4. **Logout:** Clears tokens and redirects to home

### Admin Account Creation
```bash
cd backend
npm run create-admin
```

## 📱 Features

### Frontend Features
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **User Authentication** - Login/Register/Logout
- ✅ **Protected Routes** - Dashboard for authenticated users
- ✅ **Navigation** - Header with logo, nav, and user menu
- ✅ **Form Validation** - Real-time validation with error messages
- ✅ **API Integration** - Axios-based API calls
- ✅ **State Management** - React hooks for state
- ✅ **Modern UI** - Tailwind CSS styling

### Backend Features
- ✅ **RESTful API** - Express.js server
- ✅ **User Management** - CRUD operations for users
- ✅ **Authentication** - JWT-based auth with middleware
- ✅ **Authorization** - Role-based access control
- ✅ **Password Security** - bcrypt hashing
- ✅ **Input Validation** - Request validation
- ✅ **Error Handling** - Comprehensive error responses
- ✅ **Database Integration** - MongoDB with Mongoose

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user (requires auth)
- `GET /api/users/profile` - Get user profile (requires auth)
- `GET /api/users` - Get all users (admin only)

### Request/Response Examples

**Register User:**
```bash
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login User:**
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm start
# Set NODE_ENV=production
# Configure MongoDB connection
# Set secure JWT secrets
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secure-secret-key
JWT_EXPIRES_IN=24h
```

## 🧪 Testing

### Manual Testing
1. **Start the application:** `npm run dev`
2. **Visit frontend:** http://localhost:5173
3. **Test registration:** Create a new account
4. **Test login:** Login with credentials
5. **Test protected routes:** Access dashboard
6. **Test logout:** Clear session

### API Testing
```bash
# Test registration
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🛠️ Development

### Adding New Features

1. **Backend:** Add new modules in `backend/src/modules/`
2. **Frontend:** Add new pages in `frontend/src/pages/`
3. **Components:** Add reusable components in `frontend/src/components/`
4. **API:** Add new endpoints in `backend/src/modules/`

### Code Structure
- **Backend:** Follow MVC pattern with modules
- **Frontend:** Component-based architecture
- **Styling:** Tailwind CSS utility classes
- **State:** React hooks for local state
- **API:** Axios for HTTP requests

## 📚 Documentation

- [Backend README](./backend/README.md) - Backend development guide
- [Frontend README](./frontend/README.md) - Frontend development guide
- [API Documentation](./backend/LOGIN_API.md) - API endpoint details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- **Issues:** Create an issue in the repository
- **Documentation:** Check the individual README files
- **Contact:** Use the contact form in the application

---

**Happy Coding! 🚀**
