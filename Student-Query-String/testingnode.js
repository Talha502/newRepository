const path = require('path');
const os = require('os');
const fs = require('fs');
const e = require('events');
const emm = new e;
emm.on('messagelogged',function(){
    console.log('Listener Called');
})
emm.emit('messagelogged');

let ad = path.parse(__filename);
//console.log(ad);

                            //Template String
// console.log(`TotalMemory: ${total}`);
// console.log(`FreeMemory: ${free} `);

// const files = fs.readdirSync('./');
// console.log(files);
// const f = fs.readdir('./',function(err , files){
//     if(err){
//         console.log('Error',err);
//     }
//     else{
//         console.log('Result',files);
//     } 
// })

