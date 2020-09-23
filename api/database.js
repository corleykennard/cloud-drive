var faunadb = require("faunadb");
let q = faunadb.query;
let client = new faunadb.Client({
  secret: "fnAD2Hj7UnACEwHOXkqYs-z8zKVUl6FuUCmXHL-j",
});
module.exports = async (req, res) => {
  const {
    query: { func },
  } = req
  console.log(func, req.body.arg)
  let r = await client.query(
    q.Call(q.Function(func), req.body.arg)
  );
  res.status(200).json(r);
};
