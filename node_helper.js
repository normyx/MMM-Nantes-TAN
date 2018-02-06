/* Magic Mirror
 * Module: MMM-Nantes-TAN
 *
 * By Mathieu Goulène (normyx) 
 * based on a script from da4throux (https://github.com/da4throux/MMM-Paris-RATP-PG)
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const unirest = require('unirest');

module.exports = NodeHelper.create({
  start: function () {
    this.started = false;
    //this.lock = false;
  },
  
  socketNotificationReceived: function(notification, payload) {
    const self = this;
    if (notification === 'SET_CONFIG' && this.started == false) {
      this.config = payload;	     
      if (this.config.debug) {
        console.log (' *** config set in node_helper: ');
        console.log ( payload );
      }
      this.started = true;
      self.scheduleUpdate(this.config.initialLoadDelay);
    }
  },

  /* scheduleUpdate()
   * Schedule next update.
   * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
  */
  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }
    var self = this;
    clearTimeout(this.updateTimer);
    if (this.config.debug) { console.log (' *** scheduleUpdate set next update in ' + nextLoad);}
    this.updateTimer = setTimeout(function() {
      self.updateTimetable();
    }, nextLoad);
  },

  getResponse: function(_url, _processFunction, _stopConfig, _stopData) {
    var self = this;
    var retry = true;
    if (this.config.debug) { console.log (' *** fetching: ' + _url);}
      unirest.get(_url)
        .header({
          'Accept': 'application/json;charset=utf-8'
        })
        .end(function(response){
          if (response && response.body) {
            if (self.config.debug) {
              console.log (' *** received answer for: ' + _url);
              console.log (' *** stop config : ' + _stopConfig);
            }
            _processFunction(response.body, _stopConfig, _stopData);
          } else {
            if (self.config.debug) {
              if (response) {
                console.log (' *** partial response received');
                console.log (response);
              } else {
                console.log (' *** no response received');
              }
            }
          }
          if (retry) {
            self.scheduleUpdate((self.loaded) ? -1 : this.config.retryDelay);
          }
      })
  },

  /* updateTimetable(transports)
   * Calls processTrains on successful response.
  */
  updateTimetable: function() {
    var self = this;
    var urlArret, urlHoraire, stopConfig;
    if (this.config.debug) { console.log (' *** fetching update');}
    self.sendSocketNotification("UPDATE", { lastUpdate : new Date()});
    for (var index in self.config.busStations) {
        var stopData = {};
      stopConfig = self.config.busStations[index];
      urlArret = self.config.tanURL+'horairesarret.json/'+stopConfig.arret+'/'+stopConfig.ligne+'/'+stopConfig.sens;
      self.getResponse(urlArret, self.processArret.bind(this), stopConfig, stopData);
      urlHoraire = self.config.tanURL+'tempsattente.json/'+stopConfig.arret;
      self.getResponse(urlHoraire, self.processHorairesLigne.bind(this), stopConfig, stopData);
    }
  },

  processArret: function(data, stopConfig,stopData) {
      if (this.config.debug) { console.log (' *** processArret request response'); console.log (data); }
      //this.schedule = {};
      stopData.id = stopConfig.arret+'/'+stopConfig.ligne+'/'+stopConfig.sens;
      stopData.arret = data;
  },

  processHorairesLigne: function(data, stopConfig,stopData) {
      if (this.config.debug) { console.log (' *** processHorairesLigne request response'); console.log (data); }
      var self = this;
      var numLigne = stopConfig.ligne;
      var sens = stopConfig.sens;
      stopData.schedules = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].ligne.numLigne == numLigne && data[i].sens == sens) {
            stopData.schedules.push(data[i]);
        }
        
      }
      if (this.config.debug) {console.log (' *** processHorairesLigne schedules data =  '); console.log(stopData);}
      stopData.lastUpdate = new Date();
      this.loaded = true;
      this.sendSocketNotification("BUS", stopData);
  },

});
