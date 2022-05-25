/**
* Lösung zu Aufgabe 3, Geosoft 1, SoSe 2022
* @author Luca Hesse   Matr.-Nr.: 504871 
* @version 1.0.0
*/

"use strict";

//declaration of global variables
var pointcloud;
var point;
var map = L.map('map').setView([51.9606649 , 7.6261347], 14);
var boundingbox = [];
var markers = [];

/**
* @function onLoad function that is executed when the page is loaded
*/
function onLoad() {
  //event listener
  document.getElementById("refreshBtn").addEventListener("click",
    () => {
      refresh()
    }
  );
  document.getElementById("getLocationBtn").addEventListener("click",
    () => {
      var x = document.getElementById("userPosition");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
      } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
      }
    }
  );
  document.getElementById("getDataBtn").addEventListener("click",
  () => {
    getData();
  }
  );
  document.getElementById("toolbarBtn").addEventListener("click",
  () => {
   addToolbar();
   fetch();
   
  }
  );
  document.getElementById("cutSelectionBtn").addEventListener("click",
  () => {
    cutSelection(boundingbox);
  }
  );
  
  pois = JSON.parse(pois);
  main(point, pointcloud);
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiZHdlaXNzd3d1IiwiYSI6ImNsM2lodm83YjA3YmUzam83djZxb2p5amcifQ.4MjT-si3woW0JUIrZ9Jv6A'
}).addTo(map);
}

//##############################################################################
//## FUNCTIONS
//##############################################################################

/**
* @function main the main function
*/
function main(point, pointcloud) {
  //sortiere Daten nach distanz und mach damit eine Tabelle auf der HTML
  let results = sortByDistance(point, pois);
  drawTable(results);
}

/**
* @function refresh
* @desc is called when new coordinates are inserted. refreshes the data on the site
*/
function refresh() {
  let positionGeoJSON = document.getElementById("userPosition").value;

  //remove all table rows
  var tableHeaderRowCount = 1;
  var table = document.getElementById('resultTable');
  var rowCount = table.rows.length;
  for (var i = tableHeaderRowCount; i < rowCount; i++) {
    table.deleteRow(tableHeaderRowCount);
  }

  try {
    positionGeoJSON = JSON.parse(positionGeoJSON);
    //check validity of the geoJSON. it can only be a point
    if (validGeoJSONPoint(positionGeoJSON)) {
      point = positionGeoJSON.features[0].geometry.coordinates;
      main(point, pointcloud);
    } else {
      alert("invalid input.please input a single valid point in a feature collection");
    }
  }
  catch (error) {
    console.log(error);
    alert("invalid input. see console for more info.");
  }
}

/**
* @function sortByDistance
* @desc takes a point and an array of points and sorts them by distance ascending
* @param point array of [lon, lat] coordinates
* @param pointArray array of points to compare to
* @returns Array with JSON Objects, which contain coordinate and distance
*/
function sortByDistance(point, pointArray) {
  let output = [];

  for (let i = 0; i < pointArray.features.length; i++) {
    let distance = twoPointDistance(point, pointArray.features[i].geometry.coordinates);
    let j = 0;
    //Searches for the Place
    while (j < output.length && distance > output[j].distance) {
      j++;
    }
    let newPoint = {
      coordinates: pointArray.features[i].geometry.coordinates,
      distance: distance,
      name: pointArray.features[i].properties.name
    };
    output.splice(j, 0, newPoint);
  }

  return output;
}

/**
* @function twoPointDistance
* @desc takes two geographic points and returns the distance between them. Uses the Haversine formula (http://www.movable-type.co.uk/scripts/latlong.html, https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula)
* @param start array of [lon, lat] coordinates
* @param end array of [lon, lat] coordinates
* @returns the distance between 2 points on the surface of a sphere with earth's radius
*/
function twoPointDistance(start, end) {
  //variable declarations
  var earthRadius; //the earth radius in meters
  var phi1;
  var phi2;
  var deltaLat;
  var deltaLong;

  var a;
  var c;
  var distance; //the distance in meters

  //function body
  earthRadius = 6371e3; //Radius
  phi1 = toRadians(start[1]); //latitude at starting point. in radians.
  phi2 = toRadians(end[1]); //latitude at end-point. in radians.
  deltaLat = toRadians(end[1] - start[1]); //difference in latitude at start- and end-point. in radians.
  deltaLong = toRadians(end[0] - start[0]); //difference in longitude at start- and end-point. in radians.

  a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLong / 2) * Math.sin(deltaLong / 2);
  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  distance = earthRadius * c;

  return distance;
}

/**
* @function validGeoJSONPoint
* @desc funtion that validates the input GeoJSON so it's only a point
* @param geoJSON the input JSON that is to be validated
* @returns boolean true if okay, false if not
*/
function validGeoJSONPoint(geoJSON) {
  if (geoJSON.features.length == 1
    && geoJSON.features[0].geometry.type.toUpperCase() == "POINT"
  ) {
    return true;
  } else {
    return false;
  }
}

/**
* @function toRadians
* @desc helping function, takes degrees and converts them to radians
* @returns a radian value
*/
function toRadians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

/**
* @function toDegrees
* @desc helping function, takes radians and converts them to degrees
* @returns a degree value
*/
function toDegrees(radians) {
  var pi = Math.PI;
  return radians * (180 / pi);
}

/**
 * @function drawTable
 * @desc inserts the calculated data into the table that's displayed on the page
 * @param {*} results array of JSON with contains
 */
function drawTable(results) {
  var table = document.getElementById("resultTable");
  //creates the Table with the direction an distances
  for (var j = 0; j < results.length; j++) {
    var newRow = table.insertRow(j + 1);
    var cel1 = newRow.insertCell(0);
    var cel2 = newRow.insertCell(1);
    var cel3 = newRow.insertCell(2);
    cel1.innerHTML = results[j].coordinates;
    cel2.innerHTML = results[j].name;
    cel3.innerHTML = results[j].distance;
  }
}

/**
 * @function drawTable1
 * @desc in this function the first table is being added to the page with important attributes of the bus station
 * @param {*} results array of bus stations that are nearby
 */
function drawTable1(results) {

  // table that is getting added to the page
  var table = document.getElementById("resultTable1");
  
  // iterate trough the array and add necessary attributes to table
  for (var j = 0; j < results.length; j++) {
    var newRow = table.insertRow(j + 1);
    var cel1 = newRow.insertCell(0);
    var cel2 = newRow.insertCell(1);
    var cel3 = newRow.insertCell(2);
    cel2.innerHTML = results[j].koordinaten;
    cel1.innerHTML = results[j].name;
    cel3.innerHTML = (twoPointDistance(results[j].koordinaten, point));
  } 
}

/**
 * @function drawTable2
 * @desc in this function the second table is being added to the page with information about the nearest busses
 * @param {*} results array of busses that are nearby the location
 */
 function drawTable2(results) {

  // table that is getting added to the page
  var table = document.getElementById("resultTable2");
  
  // iterate trough the array and add necessary attributes to table
  for (var j = 0; j < results.length; j++) {
    var newRow = table.insertRow(j + 1);
    var cel1 = newRow.insertCell(0);
    var cel2 = newRow.insertCell(1);
    var cel3 = newRow.insertCell(2);
    var cel4 = newRow.insertCell(3);
    cel1.innerHTML = results[j].lbez;
    cel2.innerHTML = results[j].richtungstext;
    cel3.innerHTML = results[j].linientext;
    cel4.innerHTML = results[j].abfahrtszeit;
  } 
}


/**
* @function arrayToGeoJSON
* @desc function that converts a given array of points into a geoJSON feature collection.
* @param inputArray Array that is to be converted
* @returns JSON of a geoJSON feature collectio
*/
function arrayToGeoJSON(inputArray) {
  //"Skeleton" of a valid geoJSON Feature collection
  let outJSON = { "type": "FeatureCollection", "features": [] };
  //skelly of a (point)feature
  let pointFeature = { "type": "Feature", "properties": {}, "geometry": { "type": "Point", "coordinates": [] } };

  //turn all the points in the array into proper features and append
  for (const element of inputArray) {
    let newFeature = pointFeature;
    newFeature.geometry.coordinates = element;
    outJSON.features.push(JSON.parse(JSON.stringify(newFeature)));
  }

  return outJSON;
}

/**
 * @function showPosition
 * @desc Shows the position of the user in the textareas
 * @param {*} position Json object of the user
 */
function showPosition(position) {
  var x = document.getElementById("userPosition");
  //"Skeleton" of a valid geoJSON Feature collection
  let outJSON = { "type": "FeatureCollection", "features": [] };
  //skelly of a (point)feature
  let pointFeature = {"type": "Feature","properties": {},"geometry": {"type": "Point","coordinates": []}};
  pointFeature.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
  //add the coordinates to the geoJson
  outJSON.features.push(pointFeature);
  x.innerHTML = JSON.stringify(outJSON);
}

/**
 * @function radiusCalculation
 * @desc this function takes an radius, aswell as an Array of bus stations. It calculates, whether a bus station is within the given radius 
 *       -> if so, this bus station gets added to a new Array and afterwards this Array is used in function "drawTable1"
 * @param {*} radius 
 * @param {*} halteStellenArray 
 */
function radiusCalculation(radius, halteStellenArray){
  
  // array to save all bus stations within that radius
  let radiusBusStation = new Array;
   
  // iterate trough every bus station and check, whether the bus station is within that radius
  for (var i = 0; i <halteStellenArray.length; i++) {

    if(twoPointDistance(halteStellenArray[i].koordinaten, point) < radius){

    // the bus station gets added to the new Array
    radiusBusStation.push(halteStellenArray[i]);

   }
  }

  // test-log to see, whether the new Array has realistic inputs
  console.log(radiusBusStation);

  // first Table gets added to the page
  drawTable1(radiusBusStation);


  // iterate trough all remaining bus stations and use an API to get information like the time of departure from the bus stations
  for (var k = 0; k <radiusBusStation.length; k++){

    const xhrnew = new XMLHttpRequest();
    const nr = radiusBusStation[k].nr;
    xhrnew.open('GET', 'https://rest.busradar.conterra.de/prod/haltestellen/'+nr+'/abfahrten');
    xhrnew.onload = () => {

      let dataNew = JSON.parse(xhrnew.response);
      drawTable2(dataNew);

    }

    xhrnew.send();

    }
  }

/**
 * @function getData
 * @desc this function uses an API to get all of the bus station in Münster and saves them in an Array, so that other functions can work with it.
 */
const getData = () => {

  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://rest.busradar.conterra.de/prod/haltestellen');
  xhr.onload = () => {

    const data = JSON.parse(xhr.response);
    console.log(data);

    // new Array which stores all the bus stations
    let halteStellenArray = Array.apply(null, Array[data.features.length]);

    // iterate through all bus stations and store them in "halteStellenArray"
    for(var h = 0; h < data.features.length; h++) {
     halteStellenArray[h] = new Bushaltestelle(data.features[h].properties.nr, data.features[h].properties.lbez, data.features[h].properties.richtung, data.features[h].geometry.coordinates);
     
     }
    
    // call of the function "radiusCalculation" with the new Array
    radiusCalculation(200, halteStellenArray);

    }

  xhr.send();
}

/**
 * @function fetch
 * @desc this function adds all the bus stations as markers to the map
 */
function fetch() {

  fetch("https://rest.busradar.conterra.de/prod/haltestellen")
  .then(response => {

    let resp = response.json()
    
    resp.then(data => {

     
      // array, which can save all bus stations
      let haltestellen = Array.apply(null, Array[data.features.length]);

      // iterating trough the all the data and add every bus station to the array
      for (var i = 0; i < data.features.length; i++) {
        
        haltestellen[i] = new Bushaltestelle(data.features[i].properties.nr, data.features[i].properties.lbez, data.features[i].properties.richtung, data.features[i].geometry.coordinates);
      }

      // function, to show the bus stations as markers
      showBusStations(haltestellen);

    })
  })
  .catch(error => console.log(error))
}

/**
 * @function showBusStations
 * @desc this function iterates trough all bus stations and show them as markers on the map
 * @param {*} haltestellen 
 */
function showBusStations(haltestellen){

  // iteraring trough all bus stations
  for(var i = 0; i < haltestellen.length; i++){

    // creating a marker
    var marker = L.marker([haltestellen[i].koordinaten[1], haltestellen[i].koordinaten[0]]).addTo(map);

    // push the marker into the markers array
    markers.push(marker);
    
    // creating the popup with the attributes: name, richtung and Entfernung
    marker.bindPopup("<b> "+ haltestellen[i].name + "</b><br>Richtung: " + haltestellen[i].richtung + "<br>Entfernung: " + Math.round(twoPointDistance(haltestellen[i].koordinaten, point)) + " m").openPopup();

  }

}

/**
 * @function addToolbar
 * @desc this function adds the toolbar to the map
 * @src http://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html
 */
function addToolbar(){

  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {

      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var drawnItems = new L.FeatureGroup();
  var drawControl = new L.Control.Draw({

    draw: {
      polygon: false,
      marker: false,
      circle: false,
      polyline: false,
      circlemarker: false
    },
      edit: {
          featureGroup: drawnItems
      }
  });
 
  map.on(L.Draw.Event.CREATED, (e) => {

    var layer = e.layer;

    boundingbox = layer.toGeoJSON().geometry.coordinates;
    drawnItems.addLayer(layer);
    map.addLayer(layer);
  })

  map.addLayer(drawnItems)
  map.addControl(drawControl)
}

/**
 * @function cutSelection
 * @desc This function removes all markers, which are not inside of the bounding box
 * @param {*} boundingBox - Polygon, created on the leaflet map
 */
function cutSelection(boundingBox){
  
  // array, which saves all markers, that aren't inside the bounding box and there removed afterwards
  var removedMarkers = [];
  
  // iterating trough all markers
  for(var i = 0; i < markers.length ; i++){

      var pnt = turf.point([markers[i]._latlng.lng, markers[i]._latlng.lat]);
      var polygon  = turf.polygon(boundingBox);

      // if the marker isn't inside the bounding box it gets added to the removable marker array
      if(turf.booleanPointInPolygon(pnt, polygon) == false){ 

        removedMarkers.push(markers[i]);

      }
  }

  // iterating trough all removable markers and delete them from the map
  for(var j = removedMarkers.length -1 ; j >= 0 ; j--) {

    map.removeLayer(removedMarkers[j]);

  }
  
}

/**
 * @class Bushaltestelle
 * @desc This class defines what a bus station is with its necessary attributes.
 * @param {*} nr is the number of the bus station as saved in the API.
 * @param {*} name is the name of bus station.
 * @param {*} richtung defines if the direction of the bus is inwards or outwards.
 * @param {*} koordinaten are the coordinates of the bus station.
 */
class Bushaltestelle {

  constructor(nr, name, richtung, koordinaten) {
    this.nr = nr;
    this.name = name;
    this.richtung = richtung;
    this.koordinaten = koordinaten;

  }
}
