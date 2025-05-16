# Photosphere - Photography Platform

Photosphere is a comprehensive platform for photographers to share their work, create and join organizations, participate in competitions, and organize their photos into galleries.

## Features

- **Photo Management**: Upload photos (via URLs), organize into galleries, and set privacy settings
- **Organizations**: Create and join photography organizations with other users
- **Competitions**: Participate in photo competitions hosted by organizations
- **Galleries**: Organize photos into themed collections
- **Rating System**: Rate and receive feedback on your photographs

## Technology Stack

- **Frontend**: React.js with TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)

## Setup and Development

### Prerequisites
- Node.js 18 or higher
- PostgreSQL (for production)

### Local Development
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. The application will be available at http://localhost:5000

## Deployment to AWS

### Using GitHub Actions (Automated)

1. Set up the following secrets in your GitHub repository:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
   - `AWS_REGION`: Your AWS region (e.g., us-east-1)

2. Push to the main branch, and GitHub Actions will automatically deploy to AWS Elastic Beanstalk

### Manual Deployment

1. Run the deployment script:
   ```
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. The script will create a deployment package and provide instructions for manual upload if AWS CLI is not configured

### AWS Infrastructure

The application uses:
- AWS Elastic Beanstalk for hosting
- AWS RDS (PostgreSQL) for database
- AWS S3 for deployment artifacts

## Configuration

### Environment Variables
- `NODE_ENV`: Set to 'production' for production environments
- `DATABASE_URL`: PostgreSQL connection string (automatically set when using AWS RDS)
- `SESSION_SECRET`: Secret key for session encryption
- `REPL_ID`: Replit ID (for authentication)
- `REPLIT_DOMAINS`: Comma-separated list of allowed domains

## Authentication

The platform uses Replit's OpenID Connect for authentication:
1. Users are redirected to Replit for login
2. After successful authentication, they're redirected back to the application
3. User profile information is stored in the database

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Submit a pull request

## License

MIT License