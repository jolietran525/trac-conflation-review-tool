function score_bin(s) {
    if (s === null) { return '#999'; }
    else if (s >= 0.8) { return '#090'; }
    else if (s >= 0.5) { return '#c90'; }
    else if (s >= 0) { return '#c00'; }
    else { return '#999'; }
}

function popup_attributes(feature, layer) {
    let html = '<table>';
    for (attrib in feature.properties) {
        html += '<tr><td>' + attrib + '</td><td>' + feature.properties[attrib] + '</td></tr>';
    }
    layer.bindPopup(html + '</table>');
}

let map = L.map('map', {zoomControl: false}).setView([47.60, -122.33], 12);

// cartodb tiles - types: positron: light_[all | nolabels], dark_matter: dark_[all | nolabels]
let tiles_lght = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/{tileType}/{z}/{x}/{y}{r}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    tileType: 'light_all',
    maxZoom: 19
    }
);

let tiles_drk = L.tileLayer('https://{s}.basemaps.cartocdn.com/{tileType}/{z}/{x}/{y}{r}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    tileType: 'dark_all',
    maxZoom: 19
  });


let tiles_hyd = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/{tileType}/{z}/{x}/{y}.png', {
    attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a>',
    tileType: 'full',
    maxZoom: 20
});

// cartodb voyager - types: voyager, voyager_nolabels, voyager_labels_under
let tiles_vgr = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/{tileType}/{z}/{x}/{y}{r}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CARTO</a>',
      subdomains: 'abcd',
    tileType: 'voyager_labels_under',
      maxZoom: 19
  });


// esri world imagery satellite tiles
let tiles_ewi = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

// esri world topo map tiles
let tiles_ewt = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
  });


// default type
tiles_lght.addTo(map);

// Control
L.control.zoom({position: 'topleft'}).addTo(map);
L.control.scale({maxWidth: 200, position: 'bottomright'}).addTo(map);

let baseLayers = {
      "Light (CartoDB)": tiles_lght,
      "Dark (CartoDB)": tiles_drk,
      "Color (Voyager)": tiles_vgr,
      "Satellite (ESRI)":  tiles_ewi,
      "Terrain (ESRI)": tiles_ewt
    };
let overlayLayers = {};
let layerControl = L.control.layers(baseLayers,overlayLayers, {position: 'topleft'}).addTo(map);

// add title
// let title = L.control({position: 'topleft'});
// title.onAdd = function(mp) {
//     let _tdiv = L.DomUtil.create('div', 'title');
//     _tdiv.innerHTML = '<h2></h2>'
//     return _tdiv;
// }
// title.addTo(map);

let osmLayer;
const t_osm = d3.json("data/metrics_osm_2.geojson");
t_osm.then(osm => {
    // add features to map
    osmLayer  = L.geoJSON(osm, {
        style: function(e) { return { weight: 5, opacity: 0.8, color:  "#BAD4E4" } },
        onEachFeature: popup_attributes
    });
});


let sdotLayer;
const t_sdot = d3.json("data/metrics_sdot_2.geojson");
t_sdot.then(sdot => {
    // add features to map
    sdotLayer = L.geoJSON(sdot, {
        style: function(e) { return { weight: 5, opacity: 0.5, color:  "#E4C1BA" } },
        onEachFeature: popup_attributes
    });
});

let conflationLayer;
// get edges and add to map
const t_conflation = d3.json("data/conflated_osm_2.geojson");

let filterConditions = {
    score_08: true,
    score_05_08: true,
    score_lt_05: true,
    score_null: true
};

t_conflation.then(conflation => {
    let highlightedFeature = null; 

    function getDefaultStyle(conflated_score) {
        return {
            weight: 5,
            opacity: 0.5,
            color: score_bin(conflated_score)
        };
    }
    
    // add features to map
    conflationLayer = L.geoJSON(conflation, {
        style: function (e) {
            return getDefaultStyle(e.properties.conflated_score);
        },
    
        onEachFeature: function (feature, layer) {
            // Attach a mouseover event handler
            layer.on('mouseover', function (e) {
                layer.setStyle({
                    color: '#cc41f2'
                });
            });

            // Attach a mouseout event handler to reset the style
            layer.on('mouseout', function (e) {
                layer.setStyle({
                    color: score_bin(layer.feature.properties.conflated_score)
                });
            });


            layer.on('click', function (e) {
                // Reset the style of the previously highlighted feature
                if (highlightedFeature) {
                    highlightedFeature.setStyle(getDefaultStyle(highlightedFeature.feature.properties.conflated_score));
                }
    
                // Highlight the clicked feature in the conflation layer
                layer.setStyle({
                    weight: 10,           // Adjust the weight to highlight
                    opacity: 0.7,         // Adjust the opacity to highlight
                    color: score_bin(layer.feature.properties.conflated_score)    // Set a different color for highlighting
                });
    
                map.fitBounds(layer.getBounds(), { maxZoom: 18 });

                // Set the currently highlighted feature
                highlightedFeature = layer;
                
                // Get the sdot_objectid and osm_id from the clicked feature
                const sdot_objectid = feature.properties.sdot_objectid;
                const osm_id = feature.properties.osm_id;
                // Highlight the features in the sdot and osm layers with matching IDs
                highlightFeaturesInSDOT(sdot_objectid);
                highlightFeaturesInOSM(osm_id);

                popup_attributes(highlightedFeature.feature, highlightedFeature);
            });
        }
    });


    osmLayer.addTo(map);
    sdotLayer.addTo(map);
    conflationLayer.addTo(map);
    
    map.fitBounds(sdotLayer.getBounds());
    
    // add layers to layer control
    layerControl.addOverlay(osmLayer,"OSM Features");
    layerControl.addOverlay(sdotLayer,"SDOT Features");
    layerControl.addOverlay(conflationLayer,"Conflation Features");

    // Add a control to toggle feature visibility based on score conditions
    let scoreFilterControl = L.control({ position: 'bottomleft' });

    scoreFilterControl.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'score-filter-control');
        div.innerHTML += '<label>Filter Features:</label><br>';
        div.innerHTML += '<input type="checkbox" id="scoreFilter08" checked><label>Score >= 0.8</label><br>';
        div.innerHTML += '<input type="checkbox" id="scoreFilter05_08" checked><label>Score >=0.5</label><br>';
        div.innerHTML += '<input type="checkbox" id="scoreFilterLt05" checked><label>Score >= 0</label><br>';
        div.innerHTML += '<input type="checkbox" id="scoreFilterNull" checked><label>Score NULL</label><br>';

        // Add event listeners to the checkboxes
        div.querySelector('#scoreFilter08').addEventListener('change', function () {
            filterConditions.score_08 = this.checked;
            updateFilteredFeatures();
        });

        div.querySelector('#scoreFilter05_08').addEventListener('change', function () {
            filterConditions.score_05_08 = this.checked;
            updateFilteredFeatures();
        });

        div.querySelector('#scoreFilterLt05').addEventListener('change', function () {
            filterConditions.score_lt_05 = this.checked;
            updateFilteredFeatures();
        });

        div.querySelector('#scoreFilterNull').addEventListener('change', function () {
            filterConditions.score_null = this.checked;
            updateFilteredFeatures();
        });

        return div;
    };
    scoreFilterControl.addTo(map);

    function updateFilteredFeatures() {
        const filteredFeatures = conflation.features.filter(feature => {
            const score = feature.properties.conflated_score;

            if (filterConditions.score_null && score === null)  {
                return true;
            } else if (filterConditions.score_08 && score >= 0.8) {
                return true;
            } else if (filterConditions.score_05_08 && score >= 0.5 && score < 0.8) {
                return true;
            } else if (filterConditions.score_lt_05 && score >= 0 && score < 0.5 && score !== null) {
                return true;
            }  else {
                return false;
            }
        });

        // Update the GeoJSON layer with the new filtered features
        conflationLayer.clearLayers();
        conflationLayer.addData({
            type: 'FeatureCollection',
            features: filteredFeatures
        });
    }
});


// Legend
let layerLegend = L.control({ position: 'bottomleft' });
layerLegend.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'legend');
    div.innerHTML += '<h4>SDOT Layer</h4>';
    div.innerHTML += '<span class="legend-color" style="background-color: #E4C1BA"></span><label>Default</label><br>';

    // Add more legend items as needed for different styles/colors
    div.innerHTML += '<h4>Conflation Layer</h4>';
    div.innerHTML += '<span class="legend-color" style="background-color: #090"></span><label>Score > 0.8</label><br>';
    div.innerHTML += '<span class="legend-color" style="background-color: #c90"></span><label>Score > 0.5</label><br>';
    div.innerHTML += '<span class="legend-color" style="background-color: #c00"></span><label>Score >= 0</label><br>';
    div.innerHTML += '<span class="legend-color" style="background-color: #999"></span><label>Score NULL</label><br>';

    div.innerHTML += '<h4>OSM Layer</h4>';
    div.innerHTML += '<span class="legend-color" style="background-color: #BAD4E4"></span><label>Default</label><br>';
    
    return div;
};
layerLegend.addTo(map);


// Function to highlight features in the sdot layer with a specific object ID
function highlightFeaturesInSDOT(sdot_objectid) {
    sdotLayer.eachLayer(function (layer) {
        // Check if the feature has a property named 'sdot_objectid' and if it matches the provided objectId
        if (layer.feature.properties.objectid === sdot_objectid) {
            // Apply a highlight style to the matching feature
            layer.setStyle({
                weight: 15,          // Adjust the weight to highlight
                opacity: 1,         // Adjust the opacity to highlight
                color: "#E4C1BA"    // Set a different color for highlighting
            });
        } else {
            layer.setStyle ({
                weight: 5,
                opacity: 0.5,
                color:  "#E4C1BA"
            })
        }
    });
}

// Function to highlight features in the osm layer with a specific osm_id
function highlightFeaturesInOSM(osm_id) {
    osmLayer.eachLayer(function (layer) {
        // Check if the feature has a property named 'osm_id' and if it matches the provided osmId
        if (layer.feature.properties.osm_id === osm_id) {
            // Apply a highlight style to the matching feature
            layer.setStyle({
                weight: 15,          // Adjust the weight to highlight
                opacity: 1,         // Adjust the opacity to highlight
                color: "#BAD4E4"    // Set a different color for highlighting
            });
        } else {
            layer.setStyle({
                weight: 5, opacity: 0.5, color:  "#BAD4E4"
            })
        }
    });
}


// Side Panel
/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
    document.getElementById("side-panel").style.display = "block";
    document.getElementById("side-panel").style.width = "400px";
    document.getElementsByClassName("openbtn")[0].style.display = "none";
}

function closeNav() {
    document.getElementById("side-panel").style.display = "none";
    document.getElementsByClassName("openbtn")[0].style.display = "block";
}

function filterAndSort() {
    // Filter features based on conflated_score
    const filteredFeatures = conflationLayer.toGeoJSON().features.filter(feature => {
        const score = feature.properties.conflated_score;
        return (score < 0.8 && score !== null); // Adjust the condition as needed
    });

    // Sort the filtered features based on osm_id and start_end_seg
    filteredFeatures.sort((a, b) => {
        if (a.properties.osm_id !== b.properties.osm_id) {
            return a.properties.osm_id - b.properties.osm_id;
        } else {
            return a.properties.start_end_seg - b.properties.start_end_seg;
        }
    });

    // Update the GeoJSON layer with the filtered and sorted features
    conflationLayer.clearLayers();
    conflationLayer.addData({
        type: 'FeatureCollection',
        features: filteredFeatures
    });

    // Disable the scoreFilterControl
    disableScoreFilterControl();
}

function disableScoreFilterControl() {
    // uncheck scoreFilterControl
    document.getElementById('scoreFilter08').checked = false;
    document.getElementById('scoreFilterNull').checked = false;

    // disable all checkboxes in the scoreFilterControl
    document.getElementById('scoreFilter08').disabled = true;
    document.getElementById('scoreFilter05_08').disabled = true;
    document.getElementById('scoreFilterLt05').disabled = true;
    document.getElementById('scoreFilterNull').disabled = true;
}
