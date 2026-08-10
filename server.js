const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/appdb";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Mongo connection error:", err));

const Item = mongoose.model(
  "Item",
  new mongoose.Schema({ name: String })
);

app.get("/", (req, res) => {
  res.json({ message: "Node + MongoDB CI/CD pipeline is running but i change new its for checking" });
});

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

app.listen(PORT, () =>
  console.log(`Server listening on port ${PORT}`)
);