/* Timetable for Nantes local transport Module */

/* Magic Mirror
 * Module: MMM-Nantes-TAN
 *
 * By Mathieu Goulène (normyx) 
 * based on a script from da4throux (https://github.com/da4throux/MMM-Paris-RATP-PG)
 * MIT Licensed.
 */
 
Module.register("MMM-Nantes-TAN",{
 
  // Define module defaults
  defaults: {
    maximumEntries: 2, //if the APIs sends several results for the incoming transport how many should be displayed
    updateInterval: 1 * 60 * 1000, //time in ms between pulling request for new times (update request)
    initialLoadDelay: 0, // start delay seconds.
    maxLettersForDestination: 12, //will limit the length of the destination string
    maxLettersForStop: 12, //will limit the length of the destination string
    showSecondsToNextUpdate: true,  // display a countdown to the next update pull (should I wait for a refresh before going ?)
    showLastUpdateTime: false,  //display the time when the last pulled occured (taste & color...)
    debug: false, //console.log more things to help debugging
    tanURL: 'http://open.tan.fr/ewp/',
    colorBlue: "rgb(0,121,188)",
    colorGreen: "rgb(0, 118,125)",
    colorYellow: "rgb(253,197,16)",
    colorPurple: "rgb(189,169,208)",
    colorWhite: "rgb(255,255,255)",
    colorOrange: "rgb(236,114,0)",
    useColor: true,
    defaultSymbol: 'bus',
    
  },
  
  // Define required scripts.
  getStyles: function() {
    return ["MMM-Nantes-TAN.css", "font-awesome.css"];
  },
  
  // Define start sequence.
  start: function() {
    Log.info("Starting module: " + this.name);
    this.sendSocketNotification('SET_CONFIG', this.config);
    this.busSchedules = {};
    this.arretData = {};
    this.busLastUpdate = {};
    this.loaded = false;
    this.updateTimer = null;
    var self = this;
    setInterval(function () {
      self.caller = 'updateInterval';
      self.updateDom();
    }, 1000);
  },

  getHeader: function () {
    var header = this.data.header;
    if (this.config.showSecondsToNextUpdate) {
      var timeDifference = Math.round((this.config.updateInterval - new Date() + Date.parse(this.config.lastUpdate)) / 1000);
      if (timeDifference > 0) {
        header += ', next update in ' + timeDifference + 's';
      } else {
        header += ', update requested ' + Math.abs(timeDifference) + 's ago';
      }
    }
    if (this.config.showLastUpdateTime) {
      var now = this.config.lastUpdate;
      header += (now ? (' @ ' + now.getHours() + ':' + (now.getMinutes() > 9 ? '' : '0') + now.getMinutes() + ':' + (now.getSeconds() > 9 ? '' : '0') + now.getSeconds()) : '');
    }
    return header;
  },
  
  setColor: function(element, codeColor) {
      if (this.config.useColor && codeColor != null) {
        var color = null;
        switch(codeColor) {
          case 'blue':
            color = this.config.colorBlue;
            break;
          case 'green':
            color = this.config.colorGreen;
            break;
          case 'yellow':
            color = this.config.colorYellow;
            break;
          case 'purple':
            color = this.config.colorPurple;
            break;
          case 'white':
            color = this.config.colorWhite;
            break;
          case 'orange':
            color = this.config.colorOrange;
            break;
          default :
            
        }
        if (color != null) {
            element.style="color:"+color+";";
        }
              
 
      }
  },

    timeCleaning: function(time) {
        return time.replace(" mn ","'").replace(" mn","'00").replace("horaire.proche","Proche");
    },
  
    transitSymbol: function(typeLigne) {
        var symbol = 'bus';
        switch(typeLigne) {
            case 1:
                symbol = 'subway';
                break;
            case 2:
            case 3:
                symbol = 'bus';
                break;
            case 4:
                symbol = 'ship';
                break;
            default :
                console.log("unknown type "+typeLigne);
                break;
        }
        return symbol;
    },
  // Override dom generator.
getDom: function() {
    var now = new Date();
    var wrapper = document.createElement("div");
    
    if (!this.loaded) {
      wrapper.innerHTML = "Loading connections ...";
      wrapper.className = "dimmed light small";
      return wrapper;
    } else {
      wrapper.className = "nantestan";
    }
    
    var table = document.createElement("table");

    var stopIndex;
    var previousRow, previousDestination, previousMessage, row, comingBus;
    var firstCell, secondCell;
    wrapper.appendChild(table);
    table.className = "small";
    for (var busIndex = 0; busIndex < this.config.busStations.length; busIndex++) {      
        var firstLine = true;
        var stop = this.config.busStations[busIndex];
        stopIndex=stop.arret+'/'+stop.ligne+'/'+stop.sens;
        var comingBuses = this.busSchedules[stopIndex];
        var comingBusLastUpdate = this.busLastUpdate[stopIndex];
        var arretData = this.arretData[stopIndex];
        row = document.createElement("tr");
        this.setColor(row,stop.color);
        var symbol = document.createElement("span");
        if (stop.symbol != null) {
            symbol.className = "fa fa-fw fa-"+stop.symbol;
        } else {
            symbol.className = "fa fa-fw fa-"+this.config.defaultSymbol;
        }
        var symbolTd = document.createElement("td");
        symbolTd.appendChild(symbol);
        row.appendChild(symbolTd);
        var busNameCell = document.createElement("td");
        
        
        busNameCell.className = "align-right bold";
        //busNameCell.style="color:rgb(255, 99, 71)";
        busNameCell.innerHTML = arretData.ligne.numLigne;
        
        row.appendChild(busNameCell);
        var trip = document.createElement("td");
        trip.innerHTML = arretData.arret.libelle.substr(0, this.config.maxLettersForStop);
        if (comingBuses.length>0) {
            trip.innerHTML = trip.innerHTML + " &rarr; " + comingBuses[0].terminus.substr(0, this.config.maxLettersForDestination);
        }
        trip.className = "align-left";
        row.appendChild(trip);
        var depCell = document.createElement("td");
        //depCell.className = "bright";
        for (var comingIndex = 0; (comingIndex < this.config.maximumEntries) && (comingIndex < comingBuses.length); comingIndex++) {
            comingBus = comingBuses[comingIndex];
            var time = this.timeCleaning(comingBus.temps);
            if (comingIndex == 0) {
                
                depCell.innerHTML=time;
            } else {
                depCell.innerHTML=depCell.innerHTML+" / " + time;
            }

        }
        row.appendChild(depCell);
        table.appendChild(row);
    }
    return wrapper;
},
  
  socketNotificationReceived: function(notification, payload) {
    var now = new Date();
    this.caller = notification;
    switch (notification) {
      case "BUS":
        this.busSchedules[payload.id] = payload.schedules;
        this.busLastUpdate[payload.id] = payload.lastUpdate;
        this.arretData[payload.id] = payload.arret;
        this.loaded = true;
        this.updateDom();
        break;

      case "UPDATE":
        this.config.lastUpdate = payload.lastUpdate;
        this.updateDom();
        break;
    }
  }
});
