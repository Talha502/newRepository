const helper = require('./helper-functions');
const arangojs = require('arangojs');
const { table } = require('console');
//const { replaceValuesOfObject } = require('./helper-functions');
const db = new arangojs.Database();
//db = new Database('http://127.0.0.1:8529');
db.useBasicAuth("root", "hassan3597");
const schema = require('./schema.json');
const { query } = require('express');

let obj = '';
let keyValue = '';

// let collect = {
//         "education": "student.education" ,
//          "age" : "student.age",
//          "count":"length"
//     }

// let collection = format_collection_condition(collect);
// console.log(collection);

function generateQueryString(options, type) {
    //console.log(generateQuery);
    let queryString = '';
    // SELECT QUERY
    if (type === 'select') {
        if (typeof (options.like) !== 'undefined') {
            let collection = options.table;
            let sq = (typeof options.subQuery !== 'undefined') ? options.subQuery : '';
            return queryString = `FOR doc IN ${collection} FOR d IN ${sq.table} FILTER ${sq.conditions} RETURN d`;
        }
        let collection = options.table;
        //        console.log(collection);
        let fields = (typeof options.fields !== 'undefined') ? '{' + formatFields(options.fields, type) + '}' : collection;
        let filters = (typeof options.conditions !== 'undefined') ? ' FILTER ' + formatCondition(options.conditions, collection) : '';
        let distinct = (typeof options.distinct !== 'undefined') ? 'DISTINCT' : '';
        let join = (typeof options.join !== 'undefined') ? generateJoinQueryString(options.join) : '';
        let letVar = (typeof options.let !== 'undefined') ? generateJoinLetQueryString(options.let) : '';
        let collect = (typeof options.collect !== 'undefined') ? generateCollectQueryString(options.collect) : '';
        let subQuery = (typeof options.subQuery !== 'undefined') ? generateSubQueryString(options.subQuery) : '';
        let return1 = (typeof options.return !== 'undefined') ? (options.return) : '';
        let _return = (typeof options.return !== 'undefined') ? 'RETURN ' + formatReturn(options.return, options) : '';
        if (join !== '') {
            return queryString = `FOR ${collection} IN ${collection} RETURN {${join} ${_return})} `;
        }
        if (letVar !== '') {
            if (!collection) {
                return queryString = ` ${letVar} ${_return} `;
            }
            else {
                return queryString = `FOR ${collection} IN ${collection} ${letVar} ${_return} `;
            }
        }
        if (collect != '') {
            return queryString = `FOR ${collection} IN ${collection} ${collect}  ${_return} `;
        }
        if (subQuery !== '') {
            return queryString = `FOR doc IN ${collection} ${filters} ${subQuery} Return { doc, secDoc }`;
        } else {
            return queryString = `FOR ${collection} IN ${collection} ${filters}  ${_return} `;
        }
    }
    function reduceCode(fields){
        let b_1 = '[';
        let b_2 = ']';
        let s_b_3 = ')';
            for (field in fields) {
                let objectReturn = (fields[field].return);
                if (typeof fields[field] == 'object') {
                    if (objectReturn.includes(b_1 && b_2)) {
                        objectReturn = objectReturn.replace(b_2 + s_b_3, b_2);
                        objectReturn = objectReturn.replace(b_1, s_b_3 + b_1);
                        fields[field].return = objectReturn;
                        fields[field] = '~-~(' + generateQueryString(fields[field], "select") + `~-~`;
                    }
                    else {
                        fields[field] = '~-~(' + generateQueryString(fields[field], "select") + ')' + `~-~`;
                    }
                }
        }
    }
    // INSERT QUERY
    if (type === 'insert') {
        let fields = '';
        let include = '';
        let exclude = '';
        let collection = options.into;
        fields = options.fields;
        include = options.include;
        exclude = options.exclude;
        Object.assign(fields, include);
        exclude.forEach(a => {
            delete fields[a];
        });
        reduceCode(fields);
        let finalFields = JSON.stringify(fields).replace(/"~-~|~-~"/g, "");
        let upsert = (typeof options.upsert !== 'undefined') ? `UPSERT ${JSON.stringify(options.upsert)} INSERT ${fields} UPDATE {}` : '';
        if (upsert !== '') {
            return queryString = `${upsert} IN ${collection} RETURN {old: OLD}`;
        }
        else {
            return queryString = `INSERT ${finalFields} INTO ${collection}`;
        }
    }
    // UPDATING ROW(s) QUERY
    if (type === 'update') {
        let collection = options.in;
        let simpleupdatecasefields = ''
        let key = options._key;
        let fields = options.fields;
        if (!key) {
            let updateinclude = options.include;
            Object.assign(fields, updateinclude);
            let exclude = options.exclude;
            exclude.forEach(a => {
                delete fields[a]
            });
            reduceCode(fields)
            let filters = (typeof options.conditions !== 'undefined') ? ' FILTER ' + formatCondition(options.conditions, collection) : '';
            let finalUpdateFields = JSON.stringify(options.fields).replace(/"~-~|~-~"/g, "");
            return queryString = `FOR ${collection} IN ${collection} ${filters} UPDATE ${collection} WITH ${finalUpdateFields} IN ${collection}`;
        }
        if (typeof key === 'object') {
            let collection = options.in;
            let key = options._key;  
            let pass = '';
            let Objectret = key.return;
            let b_1 = '[';
            let b_2 = ']';
            let s_b_3 = ')';
            Objectret = Objectret.replace(b_2 + s_b_3, b_2);
            Objectret = Objectret.replace(b_1, s_b_3 + b_1);
            key.return = Objectret;
            pass = generateQueryString(key, 'select');
            let finalUpdateFields = JSON.stringify(options.fields);
            return queryString = `UPDATE { _key :( ${pass}} WITH ${finalUpdateFields} IN ${collection}  `
        }
        if (typeof key === 'string') {
            simpleupdatecasefields = JSON.stringify(options.fields);
            return queryString = ` UPDATE {_key :  '${key}' }  WITH ${simpleupdatecasefields} IN ${collection}`;
        }
    }
    // DELETE QUERY
    if (type === 'delete') {
        let collection = options.table;
        let filters = (typeof options.conditions !== 'undefined') ? ' FILTER ' + formatCondition(options.conditions, collection) : null;
        if(filters == null){
        return queryString = `FOR ${collection} IN ${collection} REMOVE ${collection} IN ${collection}`
       }
       else{
        return queryString = ` FOR ${collection} IN ${collection} ${filters}  REMOVE ${collection} IN ${collection}`;
       }
    }
}


//console.log('ildiufiwe');
// exports.getFile = (options) => {
//     return options.submit_rule;
//     const path = options.path;
//     fs.readFile(path, {encoding: "base64"}, (err, data) => {
//         if (!err) {
//             cb(null, data);
//         } else {
//             cb(err, null);
//             console.log("Error in Get File", err);
//         }
//     })
//     return;
// }

exports.updateDoc = (options, cb) => {
    const query = generateQueryString(options, 'update');
    console.log('UPDATE Query::', query);
    db.query(query).then(cursor => cursor.all()).then(
        res => cb(null, res),
        err => cb(err.response.body, null)
    )
}

exports.insertDoc = (options, cb) => {
    // return options.data1;
    if (typeof options.data !== "undefined" && typeof options.schema !== "undefined") {
        // validate data according to schema

        if (typeof options.schema.schema !== 'undefined') {
            const valid = ajv.validate(options.schema.schema, options.data);
            console.log("valid:  ", valid);
            if (valid) {
                options.data = separateFilesFromData(options.data);
                rule.checkSubmitRule(options, callback => {
                    if (Array.isArray(callback)) {
                        console.log('callback 52: ', callback);
                    }
                });

                // if data is valid check submit rule and resolve all values according to it 
                // checkSubmitRule(options, options.schema.submit_rule, res => {
                //     console.log('INSERT Query::', res);
                //     // get the array of queries and pass to a function where each query will be implemented and result is generated
                //     implementQueries(res, callback => {
                //         // if result is truly equal to 1 that means query is implemented successfully 
                //         // console.log('Callback: ', callback);
                //         if (callback.error === true) {
                //             // error block below
                //             // console.log("Temp Saved? in Error Block ", fileSavedtoTemp);
                //             cb(callback, null);
                //         } else {
                //             // success block
                //             // console.log('2');
                //             // console.log("temp Saved? ", fileSavedtoTemp);
                //             cb(null, []);
                //         }
                //     })
                // });

            } else {
                // if data is invalid to given schema LOG errors 
                console.log("AJV ERROR: ", ajv.errorsText());
            }
            // return;
        } else {
            //  return;

            submit(options).then(res => {
                console.log("RES: ", res);
                if (typeof res.errorMessage !== "undefined") {
                    cb(res, null);
                } else {
                    cb(null, res);
                }
            });
        }
    } else {
        // if request is without schema 
        const query = generateQueryString(options, 'insert');
        console.log('INSERT Query2::', query);
        // return;
        db.query(query).then(cursor => cursor.all()).then(
            res => cb(null, res),
            err => cb(err.response.body, null)
        )
    }
}

// For Data containing Files to be Uploaded 
function separateFilesFromData(data) {
    let filesArr = [];
    let _keys = Object.keys(data);
    _keys.forEach((key, j) => {
        if (Array.isArray(data[key])) {

            data[key].forEach((e, i) => {
                if (e.filename) {
                    // console.log(e['filename']);
                    let name = e.filename;
                    let ext = name.split(".")[1]; // file extension
                    name = Date.now().toString() + j + i + "." + ext;
                    e.filename = name.toString();
                    filesArr.push(e);
                    let newObj = {
                        type: "file",
                        path: permanent_path + e.filename
                    };
                    data[key].splice(i, 1, newObj);
                    // console.log(i);
                }
            })

        }
    })

    // console.log(data, filesArr.length);
    storeFiletoTemp(filesArr, res => {
        fileSavedtoTemp = res;
        console.log('File Saved Status: ', res);

    });
    return data;
}

// Store files in storage for temporary purpose
function storeFiletoTemp(filesArr, callback) {
    filesArr.forEach((file, i) => {
        // console.log(file);
        const base64data = file.value.replace(/^data:.*,/, '');
        fs.writeFile(temp_path + file.filename, base64data, 'base64', (err) => {
            if (err) {
                console.log('Temp File Save Error: ', err);
                return callback(0);
            } else {
                console.log('File Saved in Temp: ', file.filename);
            }
            if (i === filesArr.length - 1) {
                return callback(1);
            }

        })
    })
}

function moveFilesTemptoAttachments(data, callback) {
    let _keys = Object.keys(data);
    _keys.forEach((key, j) => {
        if (Array.isArray(data[key])) {
            data[key].forEach((file, i) => {
                if (file.path) {
                    const oldPath = file.path.replace('attachments', 'temp');
                    fs.rename(oldPath, file.path, err => {
                        if (err) {
                            console.log("Error while Moving Files: ", err);
                            return callback(0);
                        } else {
                            console.log("file moved successfully");
                            // callback(1);
                        }
                        // if (i === data[key].length-1) {
                        //     return callback(1);       
                        // }
                    });
                    // console.log(oldPath);
                }
            })
        }
        if (j === _keys.length - 1) {
            return callback(1);
        }
    });
}

async function submit(options) {
    const data = options.data;
    const rule = options.schema.submit_rule;
    // console.log(JSON.stringify(rule));
    let insertCollections = (typeof rule.insert !== "undefined") ? Object.keys(rule.insert) : [];
    let updateCollections = (typeof rule.update !== "undefined") ? Object.keys(rule.update) : [];
    let deleleCollections = (typeof rule.delete !== "undefined") ? Object.keys(rule.delete) : [];
    let allCollections = insertCollections.concat(updateCollections, deleleCollections);
    allCollections = [...new Set(allCollections)];
    console.log('Collections in SUBMIT()', allCollections);
    const action = String(function (params) {
        const db = require("@arangodb").db;

        let results = [];
        if (params.insert.length > 0) {
            params.insert.forEach(col => {
                const res = db[col].save(params.data);
                results.push(res);
            });
        }
        if (params.update.length > 0) {
            params.update.forEach(col => {
                if (Array.isArray(params.data)) {
                    let testArr = [];
                    params.data.forEach(obj => {
                        if (obj._key) {
                            let set = params.rule['update'][col].set;

                            const set_keys = Object.keys(set);
                            set_keys.forEach(key => {
                                // console.log("Set: ", key, obj);
                                if (typeof set[key] === "string") {
                                    if (set[key].charAt(0) === "$") {
                                        if (set[key].charAt(1) === "d") {
                                            set[key] = set[key].split(".")[1];
                                            if (obj[key]) {
                                                set[key] = obj[key];
                                                // console.log("If: ", set);
                                            }
                                        }

                                    } else {
                                        if (obj[key]) {
                                            set[key] = obj[key];
                                            // console.log("Else: ", set);
                                        }
                                    }
                                }
                            })
                            const res = db[col].update(obj._key, set, {
                                returnNew: true
                            });
                            results.push(res);


                        }

                    });

                }

            });
        }
        if (params.delete.length > 0) {
            params.delete.forEach(col => {
                if (Array.isArray(params.data)) {
                    params.data.forEach(obj => {
                        if (obj._key) {
                            // collection.remove(obj._key).then(res => response = res);
                            db[col].remove(obj._key);
                        }
                    })
                }
            });
        }
        return results;

    });
    const params = {
        insert: insertCollections,
        update: updateCollections,
        delete: deleleCollections,
        data: data, // data is an Array of Data
        rule: rule
    };

    let result;

    try {
        result = await db.transaction({
            write: allCollections
        }, action, params);
        // console.log('RESULT: ', result);

    } catch (e) {
        console.error('Thrown ERROR: ', e.response.body);
        result = e.response.body;
    }

    return result;
}

exports.selectDoc = (options) => {

    db.getVersion()
    //  return options.submit_rule;
    let query = '';
    // if ( Array.isArray(options.table)) {
    //     query = selectQuery(options);
    if (typeof options.queryStr !== 'undefined') {
        query = options.queryStr;
    } else {
        query = generateQueryString(options, 'select');
    }
    // const query = "FOR result IN " + collection + " RETURN result"; // Query to get results from collection in a result object ** Miantain spaces correctly
    console.log("SELECT QUERY::", query);
    // return;
    db.query(query).then(cursor => cursor.all()).then(
        res => {
            cb(null, res)
        },
        err => {
            console.log("ERROR IN SELECT DOC: ", err);
            cb(err, null);
        }
    )
}

// Implements array of multiple queries 
let k = 0;
function implementQueries(queries, c) {
    if (k == 0) response = 0;
    if (k < queries.length) {
        db.query(queries[k]).then(cursor => cursor.all()).then(
            res => {
                moveFilesTemptoAttachments(res[0], callback => {

                    response = 1;
                    implementQueries(queries, c);

                });
            },
            err => {
                if (err.response.body.code === 404) {
                    // db._create('');
                }
                return c(err.response.body);
            })
    } else {
        k = 0;
        return c(response);
    }
}




function formatFields(fields, type) {
    newfields = "";
    let qoma = ',';
    let length = fields.length;
    if (type === 'select') {
        fields.forEach(e => {
            length--;
            qoma = (length > 0) ? ',' : '';
            newfields += `${e}: doc.${e} ${qoma}`;
        });
    }
    if (type === 'subQuery') {
        fields.forEach(e => {
            qoma = (length > 0) ? ',' : '.';
            length--;
            newfields += `${e}: d.${e} ${qoma}`;
        });
    }
    // if(type === 'insert') {
    //     length = (Object.keys(fields[0])).length;
    //     for (const key in fields[0]){
    //         length--;
    //         qoma = (length > 0) ? ',' : '';
    //         newfields += ` ${key} `
    //     }
    // }
    return newfields;
}

function formatCondition(cond, collection) {
    if (typeof cond == "object") {
        const op = ['and', 'or'];
        let filter = "";
        // in case of AND &&
        if (cond.and) {
            // console.log('check');
            let countAnd = (Object.keys(cond.and)).length;
            let operator = 'AND';
            for (let key in cond.and) {
                //console.log('check');
                countAnd--;
                operator = (countAnd > 0) ? ' AND ' : '';
                if (typeof cond.and[key] === 'string') {
                    filter += `${collection}.${key} == '${cond.and[key]}'${operator} `;
                }
                if (typeof cond.and[key] === 'number') {
                    filter += `${collection}.${key} == ${cond.and[key]} ${operator} `;
                }
            }
            return filter;
        }

        // in case of OR ||
        if (cond.or) {
            let countOr = (Object.keys(cond.or)).length;
            let operator = 'OR';
            for (let key in cond.or) {
                countOr--;
                operator = (countAnd > 0) ? ' OR ' : '';
                filter += `doc.${key} == '${cond.or[key]}'${operator} `;
            }
            return filter;
        }
        // Single field 
        else {
            for (let key in cond) {
                if (typeof (cond[key]) === 'string') {
                    filter += `${collection}.${key} == "${cond[key]}" `;
                } else if (typeof (cond[key]) === 'number' || typeof (cond[key]) === 'boolean') {
                    filter = `${key} = ${cond[key]} `;
                } else {
                    filter = `doc.${key} == ${cond[key]} `;
                }
            };
            return filter;
        }
        // for ( let key in cond) {
        //     for( let innerKey in key ) {

        //         // console.log(innerKey);
        //     }
        //     if(cond.hasOwnProperty(key)) {
        //         if(op.indexOf(key) > -1) {
        //             const and_or = key.toUpperCase();
        //         }
        //     }
        // }
    }
}

// function generateLetJoinQueryString(letjoin) {
//     let collection = subQuery.table;
//     let fields = (typeof subQuery.fields !== 'undefined') ? '{' + formatFields(subQuery.fields, 'subQuery') + '}' : 'd';
//     let conditions = (typeof subQuery.conditions !== 'undefined') ? `FILTER ${subQuery.conditions}` : '';
//     return queryString = `LET secDoc = (
//         FOR d IN ${collection} 
//             ${conditions}
//             RETURN ${fields})`;
// }


function generateSubQueryString(subQuery) {
    let collection = subQuery.table;
    let fields = (typeof subQuery.fields !== 'undefined') ? '{' + formatFields(subQuery.fields, 'subQuery') + '}' : 'd';
    let conditions = (typeof subQuery.conditions !== 'undefined') ? `FILTER ${subQuery.conditions}` : '';
    return queryString = `LET secDoc = (
        FOR d IN ${collection} 
            ${conditions}
            RETURN ${fields})`;
}

function generateJoinQueryString(join) {
    let queryString = '';
    let collection = join.table;
    let conditions = (typeof join.conditions !== 'undefined') ? `FILTER ${format_conditions(join.conditions)}` : '';
    return queryString = `${collection}: ( 
        FOR ${collection} IN ${collection}
            ${conditions} `;
    // RETURN ${collection}
}

function generateJoinLetQueryString(letVar) {
    let QueryStringofLet = '';
    for (let i = 0; i < letVar.length; i++) {
        let LETPART = "LET ";
        let VariableOfLet = Object.keys(letVar[i]);
        let ObjectoFLetVariable = Object.values(letVar[i]);
        let query = generateQueryString(ObjectoFLetVariable[0], 'select');
        QueryStringofLet += LETPART + VariableOfLet + " = " + '(' + query + ')';
    }
    //    console.log(QueryStringofLet);
    return QueryStringofLet
}

//  console.log(ObjectOfValues);

function generateCollectQueryString(collect) {
    let collection = format_collection_condition(collect);
    return `COLLECT  ${collection} `;
}

function format_collection_condition(opts) {
    var query = "";
    var arr = [];
    if (typeof opts === "object") {
        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                if ("into".indexOf(key) > -1) {
                    if (typeof opts[key] === "string") {
                        query = "INTO " + opts[key];
                    }
                }
                if ("into".indexOf(key) > -1) {
                    if (typeof opts[key] === "object") {
                        query = "INTO " + reformat_fields_collect('', opts[key]);
                    }
                }
                else if ("count".indexOf(key) > -1) {
                    if (typeof opts[key] === "string") {
                        query = "WITH COUNT INTO " + opts[key];
                    }
                }
                else {
                    var _arr = {};
                    _arr[key] = opts[key];
                    arr.push(reformat_fields_collect('', _arr));
                }
            }
        }
    }
    var res = arr.join(',').replace(', ,', ',').replace(/,\s*$/, "");
    return res + query;
}
function reformat_fields_collect(key, fields) {
    var arr = [];
    for (var key in fields) {
        if (typeof fields[key] === 'string') {
            arr.push(key + ' = ' + fields[key] + ' ');
        }
    }
    return arr;
}


function formatReturn(_return, options) {
    let queryStr = '';
    let b_1 = '[';
    let b_2 = ']';
    let s_b_3 = ')';

    if (typeof _return === 'object') {
        for (let [key, keyValue] of Object.entries(_return)) {
            queryStr += ` "${key} "  : ${keyValue} , `;
        }
        let abc = queryStr.replace(/,\s*$/, "");
        return '{' + abc + '}';
    }
    if (typeof _return === 'string') {
        return options.return;
    }
}
function selectQuery(opts) {
    let queryStr = '';
    for (let i = 0; i < opts.table.length; i++) {
        if (i == 0) {
            queryStr = ' FOR ' + opts.table[i] + ' IN ' + opts.table[i] + ' ';
        } else {
            queryStr += format_let_condition(opts.table[i], opts.conditions);
        }
    }
    // console.log();
    return queryStr;
    let filter = (typeof opts.conditions !== 'undefined') ? 'FILTER ' + format_conditions(opts.conditions) + ' ' : '';
    queryStr += filter;
    let return_fields = (typeof opts.fields !== 'undefined') ? ' RETURN { ' + reformat_fields('', opts.fields) + ' }' : ' RETURN {' + opts.table[0] + ' }';
    queryStr += return_fields;
}

function format_let_condition(table, cond) {
    let _let = ' LET ' + table + ' = ( FOR ' + table + ' IN ' + table + ' RETURN '; // LET table = ( FOR table IN table RETURN table.field 
    if (typeof cond !== 'undefined') {
        let keys = Object.keys(cond);
        keys = cond[keys[0]];
        console.log(keys);
        // _let += cond[keys[0]][table] +  ' )';
    } else {
        _let += table + ' )';
    }
    console.log(_let);
    return _let;
}

function newSubmitRule(options, rule, callback) {
    let actions = Object.keys(rule);
    let queryObj = {};
    let queryStr = '';
    let queries = [];
    let response;
    actions.forEach(act => {
        // console.log('ACT: ', act);
        if (act === 'insert') {

            let collections = Object.keys(rule[act]);
            // console.log("IN", collections);
            collections.forEach(col => {
                const collection = db.collection(col);
                response = collection.save(options.data).then(res => {
                    return res
                });
                //     newCheckInsert(rule[act][col], options, col, cb => {
                //         // console.log("insert", cb);
                //         // queries = cb;


                //     })
            });
        }
        // UPDATE ------> 
        if (act === 'update') {

            let collections = Object.keys(rule[act]);

            console.log("Upd", collections);
            collections.forEach(col => {
                let updatedData = options.data;
                if (Array.isArray(updatedData)) {
                    updatedData.forEach(obj => {
                        Object.assign(obj, rule[act][col].set);
                    });
                    const collection = db.collection(col);
                    // BULK UPDATE
                    response = collection.bulkUpdate(updatedData, {
                        returnNew: true
                    }).then(res => {
                        console.log(res)
                        return res;
                    });
                }

                // newCheckUpdate(rule[act][col], options, col, cb => {

                //     // console.log("update", cb);
                //     queries = cb;


                // })
            });
        }

        // UPSERT ------> 
        if (act === 'upsert') {

            let collections = Object.keys(rule[act]);
            console.log("Ups", collections);
            collections.forEach(col => {
                const collection = db.collection(col);

                // newCheckUpdate(rule[act][col], options, col, cb => {

                //     // console.log("update", cb);
                //     queries = cb;


                // })
            });
        }

        // DELETE ---------->
        if (act === 'delete') {

            let collections = Object.keys(rule[act]);
            console.log("Del", collections);
            collections.forEach(col => {

                const collection = db.collection(col);
                const data = options.data;
                if (Array.isArray(data)) {
                    data.forEach(obj => {
                        if (obj._key) {
                            collection.remove(obj._key).then(res => response = res);
                        }
                    })
                }
                // newCheckDelete(rule[act][col], options, col, cb => {

                //     // console.log("update", cb);
                //     queries = cb;

                // })
            });
        }
    });


    return callback(response);

}

let j = 0;
function checkSubmitRule(options, rule, callback) {
    // console.log(Object.keys(rule));

    let collections = Object.keys(rule);
    let queryObj = {};
    let queryStr = '';
    // let queries = [];
    if (j == 0) queries = [];
    if (j < collections.length) {
        let col = collections[j];
        let new_rule = rule[col];
        // console.log("COLLECTION:", new_rule); // Table or Collection
        // ORDER ~ UPSERT, INSERT, UPDATE : T for true, F for false
        // 1    T F F
        if (typeof new_rule.upsert !== 'undefined' && typeof new_rule.insert === 'undefined' && typeof new_rule.update === 'undefined') {
            // console.log(new_rule);
            let upsert, insert, update = '';
            checkUpsert(new_rule, options, cb => {
                // console.log("US RES: ", cb);
                upsert = cb;
                checkInsert(new_rule.upsert, options, cb => {
                    // console.log("IN RES: ", cb);
                    insert = cb;
                    checkUpdate(new_rule.upsert, options, cb => {
                        update = cb;
                        queryStr = `${upsert} ${insert} ${update} IN ${col}`;
                        queries.push(queryStr);
                        // console.log("UP RES: ", queries, j);
                        j++;
                        checkSubmitRule(options, rule, callback);
                    });
                });
            });
        }

        // 2    T T F
        if (typeof new_rule.upsert !== 'undefined' && typeof new_rule.insert !== 'undefined' && typeof new_rule.update === 'undefined') {
            let upsert, insert, update = '';
            checkUpsert(new_rule, options, cb => {
                // console.log("US RES: ", cb);
                upsert = cb;
                checkInsert(new_rule.upsert, options, cb => {
                    // console.log("IN RES: ", cb);
                    insert = cb;
                    checkUpdate(new_rule.upsert, options, cb => {
                        update = cb;
                        queryStr = `${upsert} ${insert} ${update} IN ${col}`;
                        queries.push(queryStr);
                        // console.log("UP RES: ", queries, j);
                        checkInsert(new_rule, options, cb => {
                            queryStr = `${cb} IN ${col}`;
                            // console.log("insert");
                            queries.push(queryStr);

                            j++;
                            // console.log("UP",j);
                            checkSubmitRule(options, rule, callback);
                        })
                        // j++;
                        // checkSubmitRule(options, rule, callback);
                    });
                });
            });
        }

        // 3    T T T 
        if (typeof new_rule.upsert !== 'undefined' && typeof new_rule.insert !== 'undefined' && typeof new_rule.update !== 'undefined') {
            let upsert, insert, update = '';
            checkUpsert(new_rule, options, cb => {
                // console.log("US RES: ", cb);
                upsert = cb;
                checkInsert(new_rule.upsert, options, cb => {
                    // console.log("IN RES: ", cb);
                    insert = cb;
                    checkUpdate(new_rule.upsert, options, cb => {
                        update = cb;
                        queryStr = `${upsert} ${insert} ${update} IN ${col}`;
                        queries.push(queryStr);
                        checkInsert(new_rule, options, cb => {
                            queryStr = `${cb} IN ${col}`;
                            // console.log("insert");
                            queries.push(queryStr);
                            checkUpdate(new_rule, options, cb => {
                                queryStr = `FOR doc IN ${col} ${cb} IN ${col}`;
                                queries.push(queryStr);
                                j++;
                                checkSubmitRule(options, rule, callback);
                            });
                        });
                    });
                });
            });
        }

        // 4    F T T 
        if (typeof new_rule.upsert === 'undefined' && typeof new_rule.insert !== 'undefined' && typeof new_rule.update !== 'undefined') {
            checkInsert(new_rule, options, cb => {
                queryStr = `${cb} IN ${col}`;
                // console.log("insert");
                queries.push(queryStr);
                checkUpdate(new_rule, options, cb => {
                    queryStr = `FOR doc IN ${col} ${cb} IN ${col}`;
                    queries.push(queryStr);
                    j++;
                    checkSubmitRule(options, rule, callback);
                });
            });

        }

        // 5    F F T
        if (typeof new_rule.upsert === 'undefined' && typeof new_rule.insert === 'undefined' && typeof new_rule.update !== 'undefined') {
            // console.log(new_rule);
            checkUpdate(new_rule, options, cb => {
                queryStr = `FOR doc IN ${col} ${cb} IN ${col}`;
                queries.push(queryStr);
                j++;
                checkSubmitRule(options, rule, callback);
            })
        }

        // 6    T F T
        if (typeof new_rule.upsert !== 'undefined' && typeof new_rule.insert === 'undefined' && typeof new_rule.update !== 'undefined') {
            let upsert, insert, update = '';
            checkUpsert(new_rule, options, cb => {
                // console.log("US RES: ", cb);
                upsert = cb;
                checkInsert(new_rule.upsert, options, cb => {
                    // console.log("IN RES: ", cb);
                    insert = cb;
                    checkUpdate(new_rule.upsert, options, cb => {
                        update = cb;
                        queryStr = `${upsert} ${insert} ${update} IN ${col}`;
                        queries.push(queryStr);

                        checkUpdate(new_rule, options, cb => {
                            queryStr = `FOR doc IN ${col} ${cb} IN ${col}`;
                            queries.push(queryStr);
                            j++;
                            checkSubmitRule(options, rule, callback);
                        });

                    });
                });
            });
        }

        // 7    F T F
        if (typeof new_rule.upsert === 'undefined' && typeof new_rule.insert !== 'undefined' && typeof new_rule.update === 'undefined') {
            // console.log("IN", j);
            checkInsert(new_rule, options, cb => {
                queryStr = `${cb} IN ${col} RETURN NEW`;
                // console.log("insert");
                queries.push(queryStr);

                j++;

                checkSubmitRule(options, rule, callback);
            })
        }
        // When all values resolved against all collections
    } else {
        // console.log("::",j, queries);
        j = 0;
        return callback(queries);
    }
}

function checkUpsert(rule, options, callback) {
    let queryStr = '';
    let upsert = {};
    let data = options.data;
    // let token = data.token;
    if (typeof rule.upsert !== 'undefined') {
        upsert = rule.upsert;
        if (upsert.conditions) {
            if (upsert.conditions.fields) {
                if (upsert.conditions.fields === '$data') {
                    upsert = data;
                    queryStr = `UPSERT ${JSON.stringify(upsert)}`;
                    return callback(queryStr);
                }
                if (typeof (upsert.conditions.fields) === 'object') {
                    resolveFields(upsert.conditions.fields, options, cb => {
                        upsert = cb;
                        // console.log("Upsert:::", upsert);
                        queryStr = `UPSERT ${JSON.stringify(upsert)}`;
                        return callback(queryStr);
                    })
                }
            }
        }
    }
    // return cb(queryStr);
}

function checkInsert(rule, options, callback) {
    let queryStr = '';
    // console.log("checkInsert: ", rule);
    let queries = [];
    let insert = rule;
    let formdata = options.data;
    if (typeof rule.insert !== 'undefined') {
        insert = rule.insert;
        // if (typeof insert.fields !== 'undefined') {
        if (insert.fields === '$data') {
            insert = formdata;
            if (typeof insert !== 'object') {
                insert.forEach(element => {
                    queryStr = `INSERT ${JSON.stringify(element)}`;

                });
            } else {
                queryStr = `INSERT ${JSON.stringify(insert)}`;
                return callback(queryStr);
            }
        }
        if (typeof (insert.fields) === 'object') {
            resolveFields(insert.fields, options, cb => {
                insert = cb;
                // console.log("INSERT:::", insert);
                queryStr = `INSERT ${JSON.stringify(insert)}`;
                return callback(queryStr);
            })
        }
    } else {

        return callback(queryStr);
    }
}

function checkUpdate(rule, options, callback) {
    let queryStr = '';
    let filter = {};
    let _with = {};
    let formdata = options.data;
    if (typeof rule.update !== 'undefined') {
        // FOR UPDATE ONLY 
        if (typeof rule.update.conditions !== "undefined" && typeof rule.update.set !== "undefined") {
            // console.log(rule.update);
            resolveFields(rule.update.conditions.fields, options, cb1 => {
                filter = format_conditions(cb1);
                resolveFields(rule.update.set.fields, options, cb2 => {
                    _with = JSON.stringify(cb2);
                    queryStr = ' FILTER ' + filter + ' UPDATE doc WITH ' + _with;
                    // console.log('QUERY', queryStr);
                    return callback(queryStr);

                })
            })
        }


        // FOR UPSERT.UPDATE 
        if (typeof rule.update.conditions === "undefined" && typeof rule.update.set !== "undefined") {

            if (typeof rule.update.set.fields !== "undefined") {
                if (rule.update.set.fields === '$data') {
                    update = formdata;
                    queryStr = `UPDATE ${JSON.stringify(update)}`;
                    return callback(queryStr);
                }
                if (typeof rule.update.set.fields === 'object') {
                    resolveFields(rule.update.set.fields, options, cb => {
                        update = cb;
                        queryStr = `UPDATE ${JSON.stringify(update)}`;
                        // console.log(queryStr);

                        return callback(queryStr);
                    })
                }
            }
        }

    }
    // return cb(queryStr);
}


function newCheckInsert(rule, options, col, callback) {
    let queryStr = '';
    // console.log("checkInsert: ", options);
    let queries = [];
    let insert = rule;
    let formdata = options.data;
    // if (typeof rule.insert !== 'undefined') {
    //     insert = rule.insert;
    if (typeof insert.fields !== 'undefined') {
        if (insert.fields === '$data') {
            // insert = formdata;
            // console.log(typeof formdata);

            if (Array.isArray(formdata)) {
                formdata.forEach(element => {
                    queryStr = `INSERT ${JSON.stringify(element)} IN ${col}`;
                    // console.log("INSERT: ", queryStr);
                    queries.push(queryStr);
                });
                return callback(queries);
            } else {
                // queryStr = `INSERT ${JSON.stringify(insert)}`;
                // return callback(queryStr);
            }
        }
        if (typeof (insert.fields) === 'object') {
            resolveFields(insert.fields, options, cb => {
                insert = cb;
                // console.log("INSERT:::", insert);
                queryStr = `INSERT ${JSON.stringify(insert)}`;
                return callback(queryStr);
            })
        }
    }

    // }
    // return callback(queryStr);
}

function newCheckUpdate(rule, options, col, callback) {
    let queryStr = '';
    let queries = [];
    let upd = rule;
    let formdata = options.data;
    if (typeof upd.conditions !== 'undefined') {
        if (Array.isArray(formdata)) {
            resolveFields(upd.conditions, options, cb => {
                queryStr = `FOR doc IN ${col} FILTER ${cb} UPDATE doc WITH ${objToStr(upd.set)} IN ${col}`;
                // queryStr = `FOR doc IN ${col} FILTER ${cb} REMOVE { _key: doc._key } IN ${col}`;
                console.log('UPD ', queryStr);
                queries.push(queryStr);
            });
        }
    }
    return callback(queries);
}


function newCheckDelete(rule, options, col, callback) {
    let queryStr = '';
    let queries = [];
    let del = rule;
    let formdata = options.data;
    if (typeof del.conditions !== 'undefined') {
        if (Array.isArray(formdata)) {
            resolveFields(del.conditions, options, cb => {
                // queryStr = `FOR doc IN ${col} FILTER ${cb} RETURN doc`;
                queryStr = `FOR doc IN ${col} FILTER ${cb} REMOVE { _key: doc._key } IN ${col}`;
                console.log('DEL', queryStr);
                queries.push(queryStr);
            });
        }
    }
    return callback(queries);

}


let i = 0;

function resolveFields(obj, options, cb) {
    let keys = Object.keys(obj);
    // console.log(obj);
    let data = options.data;
    let token = options.token;
    if (i === "undefined") {
        i = 0;
    };
    if (i == 0) newObj = {};
    if (i < keys.length) {
        if (typeof obj[keys[i]] === 'object') {
            let query = generateQueryString(obj[keys[i]], 'select');
            // console.log("Q", query);
            db.query(query).then(cursor => cursor.all()).then(
                res => {
                    let newVal = {};
                    newVal = Object.values(res[0]);
                    newVal = newVal[0];
                    newObj[keys[i]] = newVal;
                    // console.log(i, newVal);
                    i++;
                    resolveFields(obj, options, cb);
                },
                err => {
                    console.log("ERR", err);
                }
            )
        } else {
            let newVal;

            let val = obj[keys[i]];

            // check if type of value is string 
            if (typeof (val) === "string") {

                if (val.charAt(0) === '$') {
                    // ALL FORM DATA
                    // FROM FORM DATA
                    if (val.charAt(1) === 'd') {
                        val = val.split(".")[1];
                        // console.log(val);
                        if (Array.isArray(data)) {
                            value_arr = [];
                            data.forEach(e => {
                                for (let _key in e) {
                                    if (_key === val) {
                                        newVal = e[_key];
                                        // newObj[keys[i]] = newVal;
                                        if (typeof newVal === 'string') {
                                            value_arr.push(`"${newVal}"`);
                                        } else {
                                            value_arr.push(newVal);

                                        }
                                        // console.log('DATA: ', typeof newVal);
                                    }
                                }
                            });
                            let someStr = sameKeyDifferentValues(keys[i], value_arr);
                            return cb(someStr);

                        } else {
                            for (let _key in data) {
                                if (_key === val) {
                                    newVal = data[_key];
                                }
                            }
                        }
                    }
                    //  FROM TOKEN
                    if (val.charAt(1) === 't') {
                        val = val.split(".")[1];
                        for (let _key in token) {
                            // console.log(_key, val);
                            if (_key === val) {
                                newVal = token[_key];
                            }
                        }
                    }
                    newObj[keys[i]] = newVal;
                    i++;
                    resolveFields(obj, options, cb);

                } else {
                    newVal = val;
                    newObj[keys[i]] = newVal;
                    i++;
                    resolveFields(obj, options, cb);
                }
            }
            if (typeof (val) === "boolean" || typeof (val) === "number") {
                newObj[keys[i]] = obj[keys[i]];
                i++;
                resolveFields(obj, options, cb);
            }
        }
    } else {
        if (obj === "$data") {
            newObj = data;
        }
        i = 0;
        return cb(newObj);
    }

}


function sameKeyDifferentValues(key, value_arr) {
    let str = '';
    let _length = value_arr.length;
    let _or = 'OR';
    value_arr.forEach(value => {
        _length--;
        _or = (_length > 0) ? ' OR ' : '';
        str += ` doc.${key} == ${value} ${_or} `;
    });

    return str;
}

// CONDITIONS BUILDER
function format_conditions(opts) {
    var arr = [];
    if (typeof opts === "object") {
        var or_and = ['and', 'or', 'not', ','];

        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                if (or_and.indexOf(key) > -1) {
                    arr.push(reformat_fields(key, opts[key]));
                } else {
                    var _arr = {};
                    _arr[key] = opts[key];
                    arr.push(reformat_fields('', _arr));
                }
            }
        }
    } else {
        arr.push(reformat_fields('AND', opts));
    }

    var res = arr.join(' AND ').replace('AND AND', 'AND').replace('AND OR', 'OR').replace(/\s+/g, ' ').replace("= 'IS NULL'", 'IS NULL').replace("= 'IS NOT NULL'", 'IS NOT NULL');
    return res;
}

//  Collection Builder 

// function format_collection_condition (opts){
//     var query = "";
//     var count = "";
//     var arr = [];
//     //var cooma = ',';
//     if (typeof opts === "object") {
//         for(var key  in opts){
//             if(opts.hasOwnProperty(key)){
//                 if("into".indexOf(key) > -1 ){
//                     if( typeof opts[key] === "string"){
//                          query= "INTO "+opts[key];
//                     }
//                 }
//                 if("into".indexOf(key) > -1 ){
//                     if(typeof opts[key] === "object"){
//                         query = "INTO " +reformat_fields('',opts[key]); 
//                     }
//                 }
//                 if("count".indexOf(key) > -1){
//                     if(typeof opts[key] === "string"){
//                         query = "WITH COUNT INTO "+ opts[key];
//                     }
//                 }
//                 // if(cooma.indexOf(key)> -1){
//                 //     arr1.push(reformat_fields(key, opts[key]));
//                 // } 
//                 else {
//                     var _arr = {};
//                     _arr[key] = opts[key];
//                     arr.push(reformat_fields('',_arr));
//                 }
//             }
//         }
//     }
//     var res = arr.join(' , ').replace(', ,', ',').replace(/\s+/g, ' ');
//     return res + query;
// }


function reformat_fields(or_and, fields) {
    var arr = [];
    if (Array.isArray(fields)) {
        for (let i = 0; i < fields.length; i++) {
            if (i + 1 !== fields.length) {
                arr.push(fields[i].split('.')[1] + ' : ' + fields[i])
            } else {
                arr.push(fields[i].split('.')[1] + ' : ' + fields[i])

            }
        }
        return arr;
    }
    for (var key in fields) {

        if (fields.hasOwnProperty(key)) {
            if (['and', 'or', 'not'].indexOf(key) > -1 && size(fields[key]) > 0 && typeof fields[key] === "object") {
                if (['and', 'or', 'not'].indexOf(key) > -1) {
                    arr.push(reformat_fields(key, fields[key]));
                } else {
                    var _arr = {};
                    _arr[key] = fields[key];

                    arr.push(reformat_fields('', _arr));
                }
            }

            if (['and', 'or', 'not'].indexOf(key) == -1) {
                if (typeof fields[key] === "object" && size(fields[key]) > 0) {
                    var e = [];

                    if (
                        typeof fields[key] !== "undefined" &&
                        typeof fields[key][0] !== "undefined" &&
                        typeof fields[key][0][0] !== "undefined" &&
                        typeof fields[key][0] === "object"
                    ) {
                        for (var key1 in fields[key]) {
                            if (fields[key].hasOwnProperty(key1)) {
                                for (var key2 in fields[key][key1]) {
                                    if (fields[key][key1].hasOwnProperty(key2)) {
                                        e.push(fields[key][key1][key2]);
                                    }
                                }
                            }
                        }
                    } else {
                        for (var key1 in fields[key]) {
                            if (fields[key].hasOwnProperty(key1)) {
                                e.push(fields[key][key1]);
                            }
                        }
                    }
                }

                if (typeof fields[key] === "object" && size(fields[key]) > 0) {
                    if (or_and.toLowerCase() == 'or' && key.toLowerCase().indexOf('like') == -1) {
                        arr.push(mysql.escapeId(key) + ' IN ( \'' + e.join('\', \'') + '\' ) ' + ' ');
                    } else if (or_and.toLowerCase() == 'not') {
                        if (key.toLowerCase().indexOf('like') == -1)
                            arr.push(mysql.escapeId(key) + ' NOT IN (\'' + e.join('\', \'') + '\' ) ' + ' ');
                        else {
                            for (var e_key in e) {
                                if (e.hasOwnProperty(e_key)) {
                                    arr.push(mysql.escapeId(key.replace(' LIKE').replace(' like')) + ' NOT LIKE ' + mysql.escape(e[e_key]) + ' ');
                                }
                            }
                        }
                    } else {
                        if (size(e) > 1) {
                            arr.push(mysql.escapeId(key) + ' IN ( \'' + e.join('\', \'') + '\' ) ' + ' ');
                        } else {
                            matches = key.match(/(.*)([\>|\<|\!\=|\=|\>\=|\<\=])/);
                            if (
                                matches != null &&
                                size(matches) > 0
                            )
                                arr.push(matches[1] + '' + matches[2] + ' ' + mysql.escape(e[0]) + ' ');
                            // else
                            //     arr.push(mysql.escapeId(key1) + ' == ' + mysql.escape(e[0]) + ' ');
                        }
                    }
                } else {

                    if (or_and.toLowerCase() == 'not_in') {
                        arr.push(key + ' NOT IN ' + fields[key].split('.')[1]);
                    }
                    if (or_and.toLowerCase() == 'not') {
                        if (key.toLowerCase().indexOf('like') > -1) {
                            arr.push((key.replace(' LIKE').replace(' like')) + ' NOT LIKE ' + mysql.escape(fields[key]) + ' ');
                        } else {
                            matches = key.match(/(.*)([\>|\<|\!\=|\=|\>\=|\<\=])/);
                            if (size(matches) > 0)
                                arr.push(matches[1] + '' + matches[2] + ' ' + (fields[key]) + ' ');
                            else
                                arr.push((key) + ' != ' + (fields[key]) + ' ');
                        }
                    } else {
                        if (key.toLowerCase().indexOf('like') > -1)
                            arr.push(key + ' ' + (fields[key]) + ' ');
                        else {
                            matches = key.match(/(.*)([\>|\<|\!\=|\=|\>\=|\<\=])/);
                            if (
                                matches != null &&
                                size(matches) > 0
                            )
                                arr.push(matches[1] + '' + matches[2] + ' ' + (fields[key]) + ' ');
                            else {
                                if (typeof fields[key] === 'string') {
                                    arr.push(key + ' == ' + fields[key] + ' ');
                                } else {
                                    arr.push(key + ' = ' + fields[key] + ' ');
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    var arr_size = size(arr);
    if (arr_size > 0) {
        var a = '';
        if (arr_size == 1)
            // a = ( or_and.toLowerCase() == 'not' ) ? 'AND' : or_and + ' ' + arr[0]; 
            a = arr[0];
        else
            a = ' ( ' + arr.join(' ' + (or_and.toLowerCase() == 'not' ? 'AND' : or_and) + ' ').replace('AND AND', 'AND').replace('AND OR', 'OR') + ' ) ';
        return a;
    } else
        return;
}

function size(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}


function objToStr(obj) {
    let keys = Object.keys(obj);
    let size = keys.length;
    let end = ',';
    let str = '{ ';
    keys.forEach(key => {
        size--;
        end = (size > 0) ? ' , ' : ' }';
        if (typeof obj[key] === 'string')
            str += `${key} : "${obj[key]}" ${end}`;
        else
            str += `${key} : ${obj[key]} ${end}`;

    });
    return str;
}
module.exports = {
    generateQueryString: generateQueryString
};


// const fs = require('fs');
// // path should be ./FOLDER_NAME_IN_THE_ROOT/
// const permanent_path = './attachments/';
// const temp_path = './temp/';

// // const aql = arangojs.aql;
// const Ajv = require('ajv');
// const ajv = new Ajv();
// const mysql = require('mysql');
// const rule =  require("./submit-ruPle-helper");

//               console.log(or);
                // if(!b_1){
                //     fields[field] = '~-~(' + generateQueryString(fields[field], "select") + ')~-~';
                // }
                // else {
                //     fields[field] = '~-~(' + generateQueryString(fields[field], "select") + or + `~-~`;
                // }

//console.log(finalFields);
        // obj = Object.keys(finalIncludefields);
        // obj.forEach(key => {
        //     keyValue = finalIncludefields[key];
        //     if (typeof keyValue === 'object') {
        //         ifObject = generateQueryString(keyValue, 'select');
        //         finalIncludefields[key] = '~-~(' + ifObject + ')~-~';
        //     }
        //     if (typeof keyValue === 'string') {
        //     }
        // })
        // finalIncExcFields = (JSON.stringify(finalIncludefields));