const JP = require("jsonpointer");
function replaceValuesOfObject(object, replacementObject, iteration = false, currentPointer = null, objectOfKeys = {}, prefix = "$", postfix = ".") {

    objectCopy = (typeof objectCopy === 'undefined') ? Object.assign({}, object) : (iteration) ? Object.assign({}, object) : objectCopy;
    parent = (currentPointer == null) ? '' : currentPointer;

    const getObjectKeys = Object.keys(object);
    for (let i = 0; i < getObjectKeys.length; i++) {
        let key = getObjectKeys[i];
        objectOfKeys[key] = parent;
    }
    getObjectKeys.forEach(key => {
        let keyValue = object[key];
        if (typeof keyValue === 'object') {
           console.log(keyValue);
            let jsp = objectOfKeys[key] + "/" + key;
            replaceValuesOfObject(keyValue, replacementObject, false, jsp);
        }
        if (typeof keyValue === 'string') {
           // console.log(keyValue);
            let replacedString = replaceVariableValues(keyValue, replacementObject, prefix, postfix)
            let jsonpointer = objectOfKeys[key] + "/" + key;
            JP.set(objectCopy, jsonpointer, replacedString);

        }
    });
    return objectCopy;
}
function replaceVariableValues(string, replacementObject, prefix = "$", postfix = ".") {
     // console.log(string);
      var StringWithReplacedVariables = "";
      var indexOfFoundPRefix = 0;
      let assignvalues = '';
      let storevalue = '';
      var startingIndexofPrefix = 0;
      let keyofreplacementObject = '';
      var endingOfFoundkey = 0;
      let numberOfreplacementInstancesOfPrefix = string.split(prefix).length;
      let isPrefixExist = (string.indexOf(prefix)<0)?false:true;
      let isPostfixExist= (string.indexOf(postfix)<0)?false:true;
      //let numberOfreplacementInstancesOfPostfix = string.split(postfix).length;
      let totalLengthofString = string.length;

      if (!isPrefixExist) return string;  

      if(isPrefixExist  && !isPostfixExist ){
          let indexOfPrefix = string.indexOf(prefix);
         let replacementVariable = (string.indexOf(" ", indexOfPrefix) == -1) ? 
         string.substring(indexOfPrefix+1,totalLengthofString): string.indexOf(" ", indexOfPrefix);
         return replacementObject [replacementVariable];
      }
      if (isPrefixExist && isPostfixExist) {
          for (let i = 1; i < numberOfreplacementInstancesOfPrefix; i++) {
              indexOfFoundPRefix = string.indexOf(prefix, startingIndexofPrefix);
              StringWithReplacedVariables += string.substring(endingOfFoundkey, indexOfFoundPRefix);
              let indexOfFoundPostfix = string.indexOf(postfix, indexOfFoundPRefix);
              let nameOfreplacementObject = string.substring(indexOfFoundPRefix + 1, indexOfFoundPostfix);
              endingOfFoundkey = (string.indexOf("'", indexOfFoundPostfix) == -1) ? 
               ( 
                   (string.indexOf(" ", indexOfFoundPostfix) == -1)?
                   totalLengthofString : string.indexOf(" ", indexOfFoundPostfix)
               )
                :string.indexOf("'", indexOfFoundPostfix) ;
              keyofreplacementObject = string.substring(indexOfFoundPostfix + 1, endingOfFoundkey)
              startingIndexofPrefix = indexOfFoundPRefix + i;
              storevalue = replacementObject[nameOfreplacementObject];
                  if (storevalue.hasOwnProperty(keyofreplacementObject)) {
                  assignvalues = storevalue[keyofreplacementObject];
                  StringWithReplacedVariables += assignvalues;
              }
          }
          if (endingOfFoundkey < totalLengthofString) {
              let remainingPartOfString = string.substring(endingOfFoundkey, totalLengthofString);
              StringWithReplacedVariables += remainingPartOfString
          }
          return StringWithReplacedVariables;
      }
  }
// replacementObject = {
//     data: {
//         unit: " 'kg' ",
//         category: 'Weight',
//         abc: "talha"
//     }
// }
module.exports = {
    replaceValuesOfObject: replaceValuesOfObject
}
// exampleString = " $data.unit IN r.$data.category ? 1 : 0 $data.category";
// exmple2Sting = "$data.unit";
// examp3 = " hs skkdjsk dk";
// console.log(exmple2Sting.indexOf("$",))
// console.log(replaceVariableValues(exampleString, replacementObject));