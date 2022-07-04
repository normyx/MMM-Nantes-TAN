# MMM-Nantes-TAN
This module is for viewing the Nantes Bus Traffic Timetable, from given stops, given bus / tramway & navibus number, and direction.
It is based on the module developped by da4throux : [MMM-Paris-RATP-PG](https://github.com/da4throux/MMM-Paris-RATP-PG).
## Screenshot
![screenshot](https://github.com/normyx/MMM-Nantes-TAN/blob/master/MMM-Nantes-TAN.png)
## API
This module uses the open API provided by the Nantes Bus organization, TAN. Documentation may by found [here](https://data.nantes.fr/fileadmin/nm_opendata/pdf/Semitan-Documentation-API-V3.pdf).
> The API is not fully functionnal. For instance, the line color or the line type is not correct (Navibus is not identify for instance, and the line color is always "blue").
## Install
1. Clone the repository in the module directory :
```shell=
cd ~/MagicMirror/modules/
git clone https://github.com/normyx/MMM-Nantes-TAN.git
```
2. Install the dependencies
```shell=
npm install
```
## Module Configuration
Add the module configuration in the `config/config.js` file :
```javascript=
        {
            module: 'MMM-Nantes-TAN',
            position: 'bottom_right',
            header: 'TAN',
            config: {
            }
        },
```
The `config:` values are :

| Name | Default Value | Description |
| -------- | -------- | -------- |
| maximumEntries     | 2     | if the APIs sends several results for the incoming transport how many should be displayed     |
| updateInterval | 60000 ms *(1 mins)* | time in ms between pulling request for new times (update request) |
| initialLoadDelay | 0 | start delay seconds. |
| maxLettersForDestination | 12 | will limit the length of the destination string |
| maxLettersForStop | 12 | will limit the length of the stop string |
| showSecondsToNextUpdate | true | display a countdown to the next update pull (should I wait for a refresh before going ?) |
| showLastUpdateTime | false | display the time when the last pulled occured |
| debug | false | `console.log` more things to help debugging |
| tanURL | 'http://open.tan.fr/ewp/' | URI for the TAN Open API. No modification need, just in case evolutions |
| useColor | true | Uses color set up in the lines configuration below |
| colorBlue | "rgb(0,121,188)" | The RGB color used when blue is set up in the lines configuration below |
| colorGreen | "rgb(0, 118,125)" | The RGB color used when green is set up in the lines configuration below |
| colorYellow | "rgb(253,197,16)" | The RGB color used when yellow is set up in the lines configuration below |
| colorPurple | "rgb(189,169,208)" | The RGB color used when purple is set up in the lines configuration below |
| colorWhite | "rgb(255,255,255)" | The RGB color used when white is set up in the lines configuration below |
| colorOrange | "rgb(236,114,0)" | The RGB color used when orange is set up in the lines configuration below |
| defaultSymbol | 'bus' | Default symbol that may be used in the font awesome library [here](https://fontawesome.com/icons?d=gallery&m=free) |
| busStations | Array | See below |

The bus stations (`busStations:`) configuration are :

| Name | Mandatory | Description |
| -------- | -------- | -------- |
| arret | true | The stop symbol from where you want to leave. The symbol is found in the following request : [http://open.tan.fr/ewp/arrets.json](http://open.tan.fr/ewp/arrets.json). then take `codeLieu` for instance, `'COMM'` for Commerce, and get `codeArret` in the following request : [https://open.tan.fr/ewp/tempsattente.json/COMM](https://open.tan.fr/ewp/tempsattente.json/COMM) |
| ligne | true | The line in the given stop you want to use. The line is found in the following request : [http://open.tan.fr/ewp/arrets.json](http://open.tan.fr/ewp/arrets.json), for a given stop. |
| sens | true | The direction. May be useally '1' or '2'|
| color | false | the color to use for this line. May be 'blue', 'green', 'purple', 'orange', 'white' or 'yellow'. If not set, default MagicMirro color will be used. |
| symbol | false | symbol that may be used in the font awesome library [here](https://fontawesome.com/icons?d=gallery&m=free). If not set, the config `defaultSymbol` will be used. Useally, the 'bus', 'subway' or 'ship' may be used. |

Here is an example:
```javascript=
        {
            module: 'MMM-Nantes-TAN',
            position: 'bottom_right',
            header: 'TAN',
            classes: "default everyone",
            config: {
                debug: false,
                showSecondsToNextUpdate:false,
                busStations: [
                    {arret: 'COMF1', ligne:'C3', sens:'1', color:'blue'},
                    {arret: 'COMB2', ligne:'1', sens:'1', color:'yellow', symbol:'subway'},
                    {arret: 'CDCO', ligne:'4', sens:'1', color:'purple', symbol:'bus'},
                    {arret: 'GMAR', ligne:'NL', sens:'1', color:'green', symbol:'ship'},
                    {arret: 'COMC1', ligne:'1', sens:'2', color:'orange'},
                ],
            }
        },

```
 
