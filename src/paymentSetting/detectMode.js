function detectMode(keyId){

    if(keyId.startsWith("rzp_test")){
     return "TEST"
    }
   
    if(keyId.startsWith("rzp_live")){
     return "LIVE"
    }
   
    return "UNKNOWN"
   }
   
   module.exports = detectMode