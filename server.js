// Only load .env file in development (not in Railway production)
if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const app = express();

// middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173','https://jpr-public.vercel.app'], // Vite dev server
  credentials: true
}));
app.use(express.json());      // parse JSON payloads
app.use(express.urlencoded({ extended: true })); // parse form data

// simple health check
app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

const path = require("path");

// routes
const newsRoutes = require('./src/routes/news');
const publicationsRoutes = require('./src/routes/publications');
const projectsRoutes = require('./src/routes/projects');
const careersRoutes = require('./src/routes/careers');
const contactRoutes = require('./src/routes/contact');
const authRoutes = require('./src/routes/auth');

//--------------admin-----------------//
const adminNewsRoutes = require("./src/routes/admin/news");
const adminPublicationsRoutes = require("./src/routes/admin/publications");
const adminProjectsRoutes = require("./src/routes/admin/projects");
const adminContactRoutes = require("./src/routes/admin/contact");



app.use('/api/news', newsRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
//--------------admin-----------------//

app.use("/api/admin/news", adminNewsRoutes);
app.use("/api/admin/publications", adminPublicationsRoutes);
app.use("/api/admin/projects", adminProjectsRoutes);
app.use("/api/admin/contact", adminContactRoutes);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
