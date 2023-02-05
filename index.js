const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ajito.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const productCollection = client.db("bikeShop").collection("products");
    const ordersCollection = client.db("bikeShop").collection("orders");

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = productCollection.find(query);
      const count = await productCollection.estimatedDocumentCount();
      const products = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send({ count, products });
    });

    app.get("/product", async (req, res) => {
      const id = req.query.id;
      const product = { _id: ObjectId(id) };
      const singleProduct = await productCollection.findOne(product);
      res.send(singleProduct);
    });

    app.post("/productsById", async (req, res) => {
      const ids = req.body;
      const objectIds = ids.map((id) => ObjectId(id));
      const query = { _id: { $in: objectIds } };
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
      const query = req.query;
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // temp-----
    app.patch("/orders", async (req, res) => {
      const orders = req.body;
      const itemId = req.query.productId;

      const itemsArray = orders.map((data) => data.cartItem);

      const margeQuantity = itemsArray.reduce((acc, item) => {
        Object.entries(item).forEach(([id, quantity]) => {
          acc[id] = (acc[id] || 0) + quantity;
        });
        return acc;
      }, {});

      const margeQuantityArray = Object.keys(margeQuantity);

      for (let orderId of margeQuantityArray) {
        let unsetObject = {};
        unsetObject[`${itemId}`] = "";
        console.log(unsetObject);
        const result = await ordersCollection.updateOne(
          { _id: ObjectId(orderId) },
          { $unset: unsetObject }
        )
        res.send(result);
        console.log(result)
      }
    });

  } finally {
  }
};
run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(port, "is running");
});
