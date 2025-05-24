const config = {
  // Development
  development: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:5000'
  },
  // Production
  production: {
    apiUrl: 'https://your-backend-url.onrender.com', // We'll update this after deployment
    socketUrl: 'https://your-backend-url.onrender.com' // We'll update this after deployment
  }
};

const env = import.meta.env.MODE || 'development';
export const { apiUrl, socketUrl } = config[env]; 