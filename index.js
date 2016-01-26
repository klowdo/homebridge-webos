var request = require("request");
var lgtv = require("lgtv");

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-webos", "webos", webosAccessory);
}

function webosAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.accessToken = config["api_token"];
  this.lockID = config["lock_id"];
  this.ip = config["ip"];
  
  this.service = new Service.LockMechanism(this.name);
  
  this.service
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getState.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.LockTargetState)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
}

webosAccessory.prototype.getState = function(callback) {
  this.log("Getting current state...");
  lgtv.connect(ip, function(err, response){
  if (!err) {
    lgtv.show_float("It works!", function(err, response){
      if (!err) {
          lgtv.set_volume(1, function(err, response){
            //   lgtv.disconnect();
             callback(null, true);
           });
        // lgtv.disconnect();
      }else{
          this.log("Error getting state (status code %s): %s", response.statusCode, err);
        callback(err);
      }
    }); // show float 
  }
}.bind(this));
  
}
  
webosAccessory.prototype.setState = function(state, callback) {
  var lockitronState = (state == Characteristic.LockTargetState.SECURED) ? "lock" : "unlock";

  this.log("Set state to %s", lockitronState);

  request.put({
    url: "https://api.lockitron.com/v2/locks/"+this.lockID,
    qs: { access_token: this.accessToken, state: lockitronState }
  }, function(err, response, body) {

    if (!err && response.statusCode == 200) {
      this.log("State change complete.");
      
      // we succeeded, so update the "current" state as well
      var currentState = (state == Characteristic.LockTargetState.SECURED) ?
        Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
      
      this.service
        .setCharacteristic(Characteristic.LockCurrentState, currentState);
      
      callback(null); // success
    }
    else {
      this.log("Error '%s' setting lock state. Response: %s", err, body);
      callback(err || new Error("Error setting lock state."));
    }
  }.bind(this));
}

webosAccessory.prototype.getServices = function() {
  return [this.service];

}