var faunadb = require("faunadb");
let q = faunadb.query;
let client = new faunadb.Client({
  secret: "fnAD2Hj7UnACEwHOXkqYs-z8zKVUl6FuUCmXHL-j",
});
module.exports = async (req, res) => {
  await res.setHeader('Access-Control-Allow-Origin', '*')
 // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
await  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
 await res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  let r = {};
  if(req.body != undefined){
    res.status(200).json(req.body)
    return
    }
  if(req.query != undefined){
    if(req.query.func != undefined){
     r = await client.query(
    q.Call(req.query.func, req.query.arg)
  );
  }}
  
  
  //res.setHeader('Access-Control-Allow-Credentials', true)
  
  res.status(200).json(r);
  return
}
