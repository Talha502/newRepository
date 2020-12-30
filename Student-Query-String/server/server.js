// server for Node.js (https://serverjs.io/)
// A simple and powerful server for Node.js.

// Internal modules
const config = require('./src/config');
const router = require('./router');
const reply = require('./reply');
const join = require('./src/join/index.js');
const modern = require('./src/modern');
const psr = require('../process-submit-rule.js');
//const schema = require('../schema.json');

var arango = require('arangojs');
var db = arango.Database
db = new db('http://127.0.0.1:8529');
db.useDatabase('_system');
db.useBasicAuth('root', '');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { process_submit_rule } = require('../process-submit-rule.js');
const PORT = 3000;

const app = express();

app.use(bodyParser.json());

app.use(cors());

app.get('/', function (req, res) {
  res.send('Hello from server');
})
//let submit = schema.submit_rules.validations;
//console.log(sch);
app.post('/schema', function (req, res) {
  let sc = JSON.parse(req.body.data);   
//  console.log(sc);  
  
  let myOb = {  
    data:{
      unit: "kg",
      category : "Weight",
      length:78,
      assignedCategory:'1,2,3'  
  }           
  }
  process_submit_rule(sc, myOb, isValid => {  
    if (isValid.status == true){  
      res.status(200).send({ "message": "Data validated successfully " +isValid.result  });
    //  console.log(isValid);
    }
    else {
      
      res.status(200).send({ "message": "Data not valitated : " + isValid.error });
      //console.log(isValid);
    } 
  }); 
}); 
app.listen(PORT, function () {
  // console.log("Server running on localhost" + PORT);   
})
   
// Create a context per-request
const context = (self, req, res) => Object.assign(req, self, { req, res });

// Get the functions from the plugins for a special point
const hook = (ctx, name) => ctx.plugins.map(p => p[name]).filter(p => p);

// Main function
const Server = async (...middle) => {

  // Initialize the global context
  const ctx = {};

  // First parameter can be:
  // - options: Number || Object (cannot be ID'd)
  // - middleware: undefined || null || Boolean || Function || Array
  const opts = (
    typeof middle[0] === 'undefined' ||
    typeof middle[0] === 'boolean' ||
    typeof middle[0] === 'string' ||
    middle[0] === null ||
    middle[0] instanceof Function ||  
    middle[0] instanceof Array
  ) ? {} : middle.shift();

  // Set the options for the context of Server.js
  ctx.options = await config(opts, module.exports.plugins);

  // Only enabled plugins through the config
  ctx.plugins = module.exports.plugins.filter(p => ctx.options[p.name]);

  ctx.utils = { modern: modern };
  ctx.modern = modern;

  // All the init beforehand
  for (let init of hook(ctx, 'init')) {
    await init(ctx);
  }



  // PLUGIN middleware
  ctx.middle = join(hook(ctx, 'before'), middle, hook(ctx, 'after'));

  // Main thing here
  ctx.app.use((req, res) => ctx.middle(context(ctx, req, res)));



  // Different listening methods
  await Promise.all(hook(ctx, 'listen').map(listen => listen(ctx)));

  // After launching it (already proxified)
  for (let launch of hook(ctx, 'launch')) {
    await launch(ctx);
  }

  return ctx;
};

module.exports = Server;
module.exports.router = router;
module.exports.reply = reply;
module.exports.utils = {
  modern: modern
};
module.exports.plugins = [
  require('./plugins/log'),
  require('./plugins/express'),
  require('./plugins/parser'),
  require('./plugins/static'),
  require('./plugins/socket'),
  require('./plugins/session'),
  require('./plugins/security'),
  require('./plugins/favicon'),
  require('./plugins/compress'),
  require('./plugins/final')
];



//   for(let i = 0 ; i < submit.submit_rules.validations.length ; i++ ){
//     let abc =  helper.replaceValuesOfObject(submit.submit_rules.validations[i] , submit , true);
//     let xyz =  generate.generateQueryString(abc.query , 'select');
//  console.log(xyz);
//    db.query(xyz).then(
//     es => es.all()).then(
//         key => {
//             if(submit[i].result == key[0])

//             {
//                console.log('key :', (key[0])); 
//             }
//             else {
//                 console.log('Error Message  :',submit[i].errorMessage);
//             }
//         } 
//     );
//   }
//console.log(submit);
 // let isValid = { status: true, result: "", error: "" };
  //psr.isValid(submit , cb );