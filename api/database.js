var faunadb = require("faunadb");
let q = faunadb.query;
let client = new faunadb.Client({
  secret: "fnAD2Hj7UnACEwHOXkqYs-z8zKVUl6FuUCmXHL-j",
});
module.exports = async (req, res) => {
  let r = await client.query(
    q.Call(req.body.func, req.body.arg)
  );
  res.setHeader('Access-Control-Allow-Credentials', true)
//   res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  
  res.status(200).json(r);
};
