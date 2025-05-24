const config = {
  // Development
  development: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:5000'
  },
  // Production
  production: {
    apiUrl: '', // Empty string for relative paths
    socketUrl: '' // Empty string for relative paths
  }
};

const env = import.meta.env.MODE || 'development';
export const { apiUrl, socketUrl } = config[env]; 