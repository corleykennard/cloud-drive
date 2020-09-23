var faunadb =require( "faunadb")
let q = faunadb.query;
let client = new faunadb.Client({
  secret: "fnAD2Hj7UnACEwHOXkqYs-z8zKVUl6FuUCmXHL-j"
});
module.exports = async (req, res) => {
let r = await  client.query(q.Call(q.Function('getFilesInParent''), req.body.parent))
res.status(200).json(r)
}