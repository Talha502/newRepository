var arango = require('arangojs');
var db = arango.Database;
var aql = arango.aql;
//import aql from "arangojs";
//aqlQuery = require('arangojs').aqlQuery;
db = new db('http://127.0.0.1:8529');
db.useDatabase('_system');
db.useBasicAuth('root', '');

const HF = require('./helper-functions');
const RVV = require('./helper-functions');
const genquery = require('./aql-helper');
const schema = require('./schema.json');
const { sub } = require('server/router');
const { json } = require('body-parser');
let validationQuery = '';
let insertionQuery = '';

let re = "";
let _return1 = '';
let resultreturn = "";

function process_submit_rule(schema, replacementObject, cb) {
    isValid(schema, replacementObject, isValid => {
        if (isValid.status == true) {
            Insertion_of_values(schema, replacementObject);
            Update_of_values(schema, replacementObject);
            Delete_of_values(schema, replacementObject)
            cb({ status: true, result: isValid['result'] });
        }
        else {
            cb({ status: false, error: isValid['error'] });
        }
    })
}

function isValid(sc, replacementObject, cb) {
    let errors = [];
    let results = [];
    let validations = '';
    let letpart = '';
    let letquery = '';
    let replaceObject = '';
    let i = 0;
    let m = 0;
    validations = sc.submit_rules.validations;
    if (sc.submit_rules.hasOwnProperty('validations')) {
        validations = sc.submit_rules.validations;
    } else if (sc.submit_rules.hasOwnProperty('validation')) {
        validations = sc.submit_rules.validation;
    } else {
        return true;
    }
    for (i = 0; i < validations.length; i++) {
        replaceObject = HF.replaceValuesOfObject(validations[i], replacementObject, true);
        errors.push(replaceObject.errorMessage);
        results.push(replaceObject.result);
        validationQuery = genquery.generateQueryString(replaceObject.query, 'select');
        letpart = 'LET a' + i;
        letquery += letpart + ' = ' + '(' + validationQuery + ')';
        re += 'a' + i + ',' + " ";
    }
    resultreturn = re.replace(/,\s*$/, "");
    _return1 = ' RETURN ' + '{' + resultreturn + '}';
    var finalLetQuery = letquery + _return1;
    console.log(finalLetQuery);
    db.query(finalLetQuery).then(
        es => es.all()).then(
            key => {
                for (m = 0; m < results.length; m++) {
                    if (results[m] != key[0][`a${m}`][0]) {
                        cb({ status: false, error: errors[m] });
                        break;
                    }
                    if (m == results.length - 1 && results[m] == key[0][`a${m}`][0]) {
                        cb({ status: true, result: results[m] });
                    }
                }
            }
        ).catch(err => {
            cb({ status: false, error: err });
        })
}
function Insertion_of_values(sc, ro) {
    let replaceInsertionObject = '';
    let i = '';
    let letInsert = '';
    let letInsertQuery = '';
    let insert = sc.submit_rules.insert;
    let reInsert = '';
    let resultReturnInsert = '';
    let returnInsert = '';
    for (i = 0; i < insert.length; i++) {
        replaceInsertionObject = HF.replaceValuesOfObject(insert[i], ro, true);
        insertionQuery = genquery.generateQueryString(replaceInsertionObject, 'insert');
        console.log(insertionQuery);
        letInsert = 'LET a' + i;
        letInsertQuery += letInsert + ' = ' + '(' + insertionQuery + ')';
        reInsert += 'a' + i + ' ,' + " ";
    }
    resultReturnInsert = reInsert.replace(/,\s*$/, "");
    returnInsert = 'return ' + '{' + resultReturnInsert + '}';
    var finalInsertQuery = letInsertQuery + returnInsert;
    //   console.log(finalInsertQuery);
}
function Update_of_values(sc, ro) {
    let update = sc.submit_rules.update;
    let i = '';
    let updateQuery = '';
    let letupate = '';
    let letupdateQuery = '';
    let reUpdate = '';
    let resultReturnUpdate = '';
    let returnUpdate = '';
    let finalUpdateQuery = '';
    for (i = 0; i < update.length; i++) {
        let replaceUpdateObject = HF.replaceValuesOfObject(update[i], ro, true);
        updateQuery = genquery.generateQueryString(replaceUpdateObject, 'update');
       console.log(updateQuery);
        letupate = 'LET a' + i;
        letupdateQuery += letupate + ' = ' + '(' + updateQuery + ')';
        reUpdate += 'a' + i + ' ,' + " ";
    }
    resultReturnUpdate = reUpdate.replace(/,\s*$/, "");
    returnUpdate = 'return ' + '{' + resultReturnUpdate + '}';
    finalUpdateQuery = letupdateQuery + returnUpdate;
   console.log(finalUpdateQuery);
}
function Delete_of_values(sc, ro) {
    let del = sc.submit_rules.delete;
    let deleteQuery = '';
    let replaceDeleteValue = '';
    let letdelete = '';
    let reDelete = '';
    let resultReturnDelete = '';
    let letDeleteQuery = '';
    let returnDelete = '';
    let finalDeleteQuery = '';
    for (let i = 0; i < del.length; i++) {
        replaceDeleteValue = HF.replaceValuesOfObject(del[i], ro, true);
        deleteQuery = genquery.generateQueryString(replaceDeleteValue, 'delete');
        // console.log(deleteQuery);
        letdelete = 'LET a' + i;
        letDeleteQuery += letdelete + ' = ' + '(' + deleteQuery + ')';
        reDelete += 'a' + i + ' ,' + " ";
    }
    resultReturnDelete = reDelete.replace(/,\s*$/, "");
    returnDelete = 'return ' + '{' + resultReturnDelete + '}';
    finalDeleteQuery = letDeleteQuery + returnDelete;
    console.log(finalDeleteQuery);
}
module.exports = {
    process_submit_rule: process_submit_rule
}

// isValid(submit, isValid => {
//     if (isValid.status == true) {
//         //console.log(isValid);
//         console.log("Data is valid : " + isValid.result);
//     }
//     else {
//         //console.log(isValid);
//      console.log("Validation fails with message : " + isValid.error);
//     }
// });


// if(validations == undefined){
    //     cb({status : false , error : "Validation not found" })
    //     return true;
    // }


// module.exports = {
//     process_submit_rule: process_submit_rule,
// }

                    // console.log(typeof result[m]);
                    // console.log(typeof key[0][`a${m}`][0]);


                    // console.log("counter",m);
                    // console.log(result.length)


// function isValid(submit, cb, xc = false) {
//     var start = Date.now();
//     let letquery = '';
//     let result = [];
//     let i = 0;
//     let m = 0;
//     let letparta = '';
//     let isValid = { status: true, result: "", error: "" };
//     for (i = 0; i < submit.length; i++) {
//         let replaceObject = HF.replaceValuesOfObject(submit[i], Replacement, true);
//         result.push(submit[i].result);
//         queries = genquery.generateQueryString(replaceObject.query, 'select');
//         letparta = 'LET a' + i;
//         letquery += letparta + ' = ' + '(' + queries + ')';
//     }
//     var removeline = letquery + _return1;
//    // console.log(removeline);

//     db.query(removeline).then(
//         es => es.all()).then(
//             key => {
//                 // console.log(key[0][`a${m}`][0]);
//                 for (m = 0; m < result.length; m++) {
//                     if (result[m] == key[0][`a${m}`][0]) {
//                         if (xc == true) {
//                             isValid = true;
//                             cb({ status: true, result: submit[m].result });
//                         }
//                     }
//                     else {
//                         xc = true;
//                         isValid = false;
//                         cb({ status: false, error: submit[m].errorMessage });
//                         break;
//                     }
//                 }
//             }
//         );
// }



// console.log("Validation is Successfull : " + true);

                   // if(result[m] == key[0][`a${m}`]){
                    //     console.log(true);
                    // }
                    // else{
                            //   console.log(false);
                    // }
                    // if(result[m] !== key[0].a0){
                    //     console.log(true);
                    // }
                    // else{
                    //     console.log(false);
                    // }
                    //    console.log(result[m]);
                    //    console.log(key[0][`a${m}`]);

//console.log(aql`${letquery}`);

// (result[m] !== key[0][`a${m}`])
// let replacedValidationObject = HF.replaceValuesOfObject(schema.submit_rules.validations[1],Replacement);
//  let AqlQueryString = genquery.generateQueryString(replacedValidationObject.query , 'select');
//    console.log(AqlQueryString);
// db.query(AqlQueryString).then(
//     es=>es.all()
// ).then(
//     key=>console.log('key',JSON.stringify(key))
// );
// console.log('Showing data of aql-query');

                                //Call back with arangodb
// db.query(queries).then(
//     es => es.all()).then(
//         key => {
//             for (m = 0; m < result.length; m++) {
//                 if (result[m] != key[0][`a${m}`][0]) {
//                     cb({ status: false, error: validateds[m].errorMessage });
//                     break;
//                 }
//                 if (m == result.length - 1 && result[m] == key[0][`a${m}`][0]) {
//                     console.log('dssdc');
//                     cb({ status: true, result: validateds[m].result });
//                 }
//             }
//         }
//     )



// function process_submit_rule(submit, i = 0, continueIteration = true, cb) {
//     isValid(submit, isValid => {
//         console.log(submit);
//         if (isValid.status == true) {
//             cb({ status: true, result: isValid['result'] });
//         }
//         else {
//             cb({ status: false, error: isValid['error'] });
//         }
//     });

//     // console.log('abc'); 
//     // console.log(typeof cb);
//     // if (typeof o === "undefined") {
//     //     o = {};
//     // };
//     // // console.log(i,o);
//     // // console.log(i,continueIteration);
//     // if (!continueIteration) {
//     //     //    console.log("return");
//     //     return o
//     // }
//     // if (continueIteration && i == submit.length) {
//     //     return o
//     // }
//     //console.log("dd");
//     // if (i < submit.length) {
//     //     let replaceObject = HF.replaceValuesOfObject(submit[i], Replacement, true);
//     //     console.log(replaceObject);
//     //     xyz = genquery.generateQueryString(replaceObject.query, 'select');
//     //     console.log(xyz);
//     //     db.query(xyz).then(
//     //         es => es.all()).then(
//     //             key => {
//     //                 console.log(xyz);
//     //                 console.log('key', key);
//     //                 // o['errorMessage'] = "";
//     //                 // o['status'] = true;
//     //                 // console.log("iteration",i);
//     //                 if (submit[i].result == key[0]) {
//     //                     console.log(submit[i].result);
//     //                     process_submit_rule(submit, i + 1, true, null);
//     //                 }
//     //                 else {
//     //                     //  //['errorMessage'] = submit[i].errorMessage;
//     //                     // // o['status'] = false;
//     //                     //  console.log(submit[i].errorMessage);
//     //                     process_submit_rule(submit, i + 1, false, c => {
//     //                         return false;
//     //                     });
//     //                 }
//     //             }
//     //         );
//     // }
//     // var end =  Date.now();
//     // console.log(`Execution time: ${end - start} `);
// }
// process_submit_rule(submit, r => {
//     console.log("Final", r);
// });
//console.log(submit);
