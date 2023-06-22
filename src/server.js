const express = require("express");
const { createVmFunction } = require("./vm/create-vm");
var cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/test", (req, res) => {
  setTimeout(() => {
    res.send({
      ip: "123.123.14.562",
      username: "admin",
      password: "admin",
    });
  }, 5000);
});

app.post("/create-vm", async (req, res) => {
  try {
    createVmFunction(req.body)
      .then((result) => {
        return res.send(result);
      })
      .catch((err) => {
        console.log("err :>> ", err);
        return res.send(err);
      });
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Serveur started on port ${port}`);
});
