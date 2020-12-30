const f = require("helper-functions");
function replaceVariableValues(string, replacementObject, prefix = "$", postfix = ".") {
    //  console.log(string);
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
    //   console.log(string);
    //   console.log("postfix",numberOfreplacementInstancesOfPostfix);
    //   console.log("prefix",numberOfreplacementInstancesOfPrefix);

      if (!isPrefixExist) return string;  

      if(isPrefixExist  && !isPostfixExist ){
          let indexOfPrefix = string.indexOf(prefix);
         let replacementVariable = (string.indexOf(" ", indexOfPrefix) == -1) ? 
         string.substring(indexOfPrefix+1,totalLengthofString): string.indexOf(" ", indexOfPrefix);
//         console.log(replacementVariable);
         return replacementObject [replacementVariable];
      }
      if (isPrefixExist && isPostfixExist) {
          for (let i = 1; i < numberOfreplacementInstancesOfPrefix; i++) {
              indexOfFoundPRefix = string.indexOf(prefix, startingIndexofPrefix);
              StringWithReplacedVariables += string.substring(endingOfFoundkey, indexOfFoundPRefix);
              let indexOfFoundPostfix = string.indexOf(postfix, indexOfFoundPRefix);
              let nameOfreplacementObject = string.substring(indexOfFoundPRefix + 1, indexOfFoundPostfix);
              endingOfFoundkey = (string.indexOf(" ", indexOfFoundPostfix) == -1) ? totalLengthofString
              : string.indexOf(" ", indexOfFoundPostfix);
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
 let s = "'$data.unit' IN Unit_Validator.$data.category ? 1 : 0";
  console.log(replaceVariableValues(s,{data:{unit:"kg",category:"weight"}}));
  