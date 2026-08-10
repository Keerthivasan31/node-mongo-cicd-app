const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/appdb";

mongoose.connect(MONGO_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => console.error("Mongo connection error:", err));

const Item = mongoose.model("Item", new mongoose.Schema({ name: String }));

// API Endpoints
app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState; // 1 = connected
  res.status(state === 1 ? 200 : 503).json({ mongoConnected: state === 1 });
});

app.get("/items", async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.post("/items", async (req, res) => {
  const item = await Item.create({ name: req.body.name });
  res.status(201).json(item);
});

// Fallback route for SPA / root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
