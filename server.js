const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// Simple request logger middleware for better output tracking
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/appdb";

// Connect to MongoDB with enhanced feedback
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });

const Item = mongoose.model(
  "Item",
  new mongoose.Schema({ name: { type: String, required: true } }, { timestamps: true })
);

// Home route
app.get("/", (req, res) => {
  res.json({ 
    status: "success",
    message: "Node + MongoDB CI/CD pipeline is running smoothly!",
    timestamp: new Date()
  });
});

// Health check endpoint for Kubernetes and Nagios
app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState; // 1 = connected
  const isConnected = state === 1;
  
  res.status(isConnected ? 200 : 503).json({ 
    mongoConnected: isConnected,
    readyState: state 
  });
});

// Get all items with error handling
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("Error fetching items:", err.message);
    res.status(500).json({ error: "Failed to fetch items from database" });
  }
});

// Create a new item with validation and error handling
app.post("/items", async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: "Item name is required" });
    }
    const item = await Item.create({ name: req.body.name });
    res.status(201).json(item);
  } catch (err) {
    console.error("Error creating item:", err.message);
    res.status(500).json({ error: "Failed to save item to database" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
