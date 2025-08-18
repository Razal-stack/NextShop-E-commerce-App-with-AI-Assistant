import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createMCPServer } from './mcp/server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Image proxy endpoint to handle CORS issues
app.get('/api/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate that it's a FakeStore API image URL
    if (!url.startsWith('https://fakestoreapi.com/img/')) {
      return res.status(400).json({ error: 'Only FakeStore API images are allowed' });
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    });

    // If the image doesn't exist (404), return a fallback image
    if (response.status === 404) {
      // Return a simple 1x1 transparent pixel as fallback
      const fallbackImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const fallbackBuffer = Buffer.from(fallbackImageBase64, 'base64');
      
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': fallbackBuffer.length
      });
      
      return res.send(fallbackBuffer);
    }

    // Set appropriate headers for successful response
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Return a fallback image instead of error
    const fallbackImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const fallbackBuffer = Buffer.from(fallbackImageBase64, 'base64');
    
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
      'Content-Length': fallbackBuffer.length
    });
    
    res.status(200).send(fallbackBuffer);
  }
});

// MCP Server setup
const mcpServer = createMCPServer();

// Basic MCP info endpoint
app.get('/mcp', (req, res) => {
  res.json({ 
    name: 'NextShop MCP Server',
    version: '1.0.0',
    description: 'E-commerce MCP server with 9 tools for NextShop'
  });
});

// Health check endpoint
app.post('/mcp/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`NextShop MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
