import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import the API handler for development
import wealthRadarHandler from './api/wealth-radar.js'

// Vite plugin to handle API routes during development
const apiPlugin = () => ({
  name: 'api-routes',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/wealth-radar' && req.method === 'POST') {
        // Collect request body
        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            req.body = JSON.parse(body)
            // Call the handler
            await wealthRadarHandler(req, res)
          } catch (error) {
            // Log actual error for debugging
            console.error('API Error:', error.message)
            console.error('Stack:', error.stack)

            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: 'Internal server error'
            }))
          }
        })
      } else {
        next()
      }
    })
  }
})

export default defineConfig({
  plugins: [react(), apiPlugin()],
})
