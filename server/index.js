const {
  client,
  createTables,
  createUser,
  createProduct,
  createFavorite,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  destroyFavorite,
  authenticate,
  findUserWithToken,
} = require("./db");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "1234";
app.use(express.json());

//for deployment only
const path = require("path");
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
);

app.post("/api/auth/login", async (req, res, next) => {
  try {
    res.send(await authenticate(req.body));
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (!token) {
      return res.status(403).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    res.send(await findUserWithToken(req.userId));
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/users/register", async (req, res, next) => {
  try {
    res.send(await createUser(req.body));
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id/favorites", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (!token) {
      return res.status(403).json({ error: "No token provided" });
    } else {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
      if (req.userId == req.params.id) {
        res.send(await fetchFavorites(req.params.id));
      } else {
        return res.status(403).json({
          error: `incorrect token provided;`,
        });
      }
    }
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (!token) {
      return res.status(403).json({ error: "No token provided" });
    } else {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
      if (req.userId == req.params.id) {
        res.status(201).send(
          await createFavorite({
            user_id: req.params.id,
            product_id: req.body.product_id,
          })
        );
      } else {
        return res.status(403).json({
          error: `incorrect token provided;`,
        });
      }
    }
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/users/:user_id/favorites/:id", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (!token) {
      return res.status(403).json({ error: "No token provided" });
    } else {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
      if (req.userId == req.params.user_id) {
        await destroyFavorite({
          user_id: req.params.user_id,
          id: req.params.id,
        });
        res.sendStatus(204);
      } else {
        return res.status(403).json({
          error: `incorrect token provided;`,
        });
      }
    }
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res
    .status(err.status || 500)
    .send({ error: err.message ? err.message : err });
});

const init = async () => {
  const port = process.env.PORT || 3000;
  await client.connect();
  console.log("connected to database");

  await createTables();
  console.log("tables created");

  const [moe, lucy, ethyl, curly, foo, bar, bazz, quq, fip] = await Promise.all(
    [
      createUser({ username: "moe", password: "m_pw" }),
      createUser({ username: "lucy", password: "l_pw" }),
      createUser({ username: "ethyl", password: "e_pw" }),
      createUser({ username: "curly", password: "c_pw" }),
      createProduct({ name: "foo" }),
      createProduct({ name: "bar" }),
      createProduct({ name: "bazz" }),
      createProduct({ name: "quq" }),
      createProduct({ name: "fip" }),
    ]
  );

  console.log(await fetchUsers());
  console.log(await fetchProducts());

  console.log(await fetchFavorites(moe.id));
  const favorite = await createFavorite({
    user_id: moe.id,
    product_id: foo.id,
  });
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
