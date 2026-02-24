# Health Analyzer - Intelligent Web-Based Health Prediction and Reporting System

An AI-powered health assessment platform that provides personalized health insights, medical image analysis, and context-aware health chat assistance.

## Features

- **AI-Powered Health Assessment** - Deep symptom-based analysis with risk scoring and severity classification
- **Medical Image Analyzer** - Upload and analyze medical images (skin conditions, wounds, etc.)
- **Medical-Only AI Chat** - Context-aware health assistant (restricted to medical queries only)
- **Professional Health Reports** - Download structured PDF reports
- **Email Notifications** - Health alerts and report delivery
- **Admin Dashboard** - Manage users, records, and system analytics

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **AI Integration**: OpenAI GPT-4o (via Emergent LLM)
- **Authentication**: JWT with bcrypt password hashing

## Project Structure

```
health-analyzer/
├── backend/
│   ├── models/          # Pydantic models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── middleware/      # Authentication middleware
│   ├── server.py        # Main FastAPI application
│   ├── requirements.txt # Python dependencies
│   └── .env             # Environment variables
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── context/     # React context providers
│   │   └── App.js       # Main React app
│   ├── package.json     # Node dependencies
│   └── .env             # Frontend environment variables
└── README.md
```

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.10 or higher) - [Download](https://www.python.org/downloads/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/downloads)

## Local Setup Instructions (Windows)

### Step 1: Clone the Repository

Open Command Prompt or PowerShell and run:

```bash
git clone https://github.com/your-username/health-analyzer.git
cd health-analyzer
```

### Step 2: Setup MongoDB

1. Install MongoDB Community Server if not already installed
2. Start MongoDB service:

```bash
# Using MongoDB as a Windows service (recommended)
net start MongoDB

# Or start manually
mongod --dbpath "C:\data\db"
```

3. Verify MongoDB is running:
```bash
mongosh
# Should connect to mongodb://localhost:27017
```

### Step 3: Setup Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows Command Prompt
venv\Scripts\activate

# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

4. Install Python dependencies:
```bash
pip install -r requirements.txt
```

5. Create/Update the `.env` file in the `backend` directory:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=health_analyzer
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=your-super-secret-key-change-in-production
EMERGENT_LLM_KEY=your-emergent-llm-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Health Analyzer
SMTP_FROM_EMAIL=your-email@gmail.com
```

6. Start the backend server:
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

The backend will be running at: `http://localhost:8001`

### Step 4: Setup Frontend

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Create/Update the `.env` file in the `frontend` directory:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

4. Start the frontend development server:
```bash
npm start
```

The frontend will be running at: `http://localhost:3000`

### Step 5: Access the Application

1. Open your browser and go to: `http://localhost:3000`
2. Register a new account or use the default admin:
   - **Admin Email**: admin@healthanalyzer.com
   - **Admin Password**: Admin@12345

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Health Assessment
- `POST /api/health/assess` - Create health assessment
- `GET /api/health/records` - Get user's health records
- `GET /api/health/records/{id}` - Get specific record
- `GET /api/health/records/{id}/pdf` - Download PDF report
- `POST /api/health/records/{id}/email` - Email report

### Image Analysis
- `POST /api/image/analyze` - Analyze medical image
- `GET /api/image/analyses` - Get image analysis history

### Health Chat
- `POST /api/chat` - Send chat message
- `GET /api/chat/sessions` - Get chat sessions
- `DELETE /api/chat/sessions/{id}` - Delete session

### Admin
- `GET /api/admin/dashboard/stats` - System statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/health-records` - List all records
- `GET /api/admin/image-analyses` - List image analyses

## Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| MONGO_URL | MongoDB connection string | Yes |
| DB_NAME | Database name | Yes |
| JWT_SECRET_KEY | Secret key for JWT tokens | Yes |
| EMERGENT_LLM_KEY | Emergent LLM API key | Yes |
| SMTP_HOST | SMTP server host | For email |
| SMTP_PORT | SMTP server port | For email |
| SMTP_USER | SMTP username | For email |
| SMTP_PASS | SMTP password/app password | For email |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| REACT_APP_BACKEND_URL | Backend API URL | Yes |

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check if port 27017 is not blocked
- Verify MONGO_URL in .env file

### Backend Not Starting
- Check Python version (3.10+)
- Ensure all dependencies are installed
- Verify virtual environment is activated
- Check .env file exists and has required variables

### Frontend Not Starting
- Check Node.js version (18+)
- Delete `node_modules` and run `npm install` again
- Check .env file has REACT_APP_BACKEND_URL

### AI Features Not Working
- Verify EMERGENT_LLM_KEY is set correctly
- Check backend logs for API errors
- Ensure internet connection for AI API calls

## Developers

- **Chandru H** (USN: 23DBCAD021)
- **Akash B** (USN: 23DBCAD007)
- **Gopi Reddy Manoj Kumar** (USN: 23DBCAD030)

**Course**: 6th Sem BCA DS 'A sec'  
**School**: SSCS  
**University**: CMR University

## License

This project is developed for academic purposes at CMR University.

## Disclaimer

This system provides informational health insights only and does not replace professional medical advice. Always consult qualified healthcare professionals for diagnosis and treatment.
