const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded bodies if needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  next();
});

// Dynamic routing for Vercel Serverless Functions under /api/
app.all('/api/:name', async (req, res) => {
  const apiName = req.params.name;
  const filePath = path.join(__dirname, 'api', `${apiName}.js`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `API route /api/${apiName} not found` });
  }

  try {
    // Clear require cache for live reloading of api scripts
    delete require.cache[require.resolve(filePath)];
    const handler = require(filePath);
    
    // Express req.query is already parsed, but let's ensure compatibility
    await handler(req, res);
  } catch (error) {
    console.error(`Error in /api/${apiName}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
});

// Rewrites from vercel.json
app.get('/movie/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'detail-movie.html'));
});
app.get('/tv/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'detail-movie.html'));
});

// Clean URLs handler: e.g. /home serves /home.html
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '') {
    return res.sendFile(path.join(__dirname, 'home.html'));
  }
  
  const ext = path.extname(req.path);
  if (!ext) {
    const htmlPath = path.join(__dirname, `${req.path}.html`);
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
  }
  next();
});

// Serve static assets/files
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Movixa Local Server is running!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
