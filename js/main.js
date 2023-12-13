let map = L.map('map', {zoomControl: false}).setView([47.60, -122.33], 12);


/* ---------------------- MAP TILES ---------------------- */
let tiles_lght = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/{tileType}/{z}/{x}/{y}{r}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    tileType: 'light_all',
    maxZoom: 20
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
      maxZoom: 20
  });


// esri world imagery satellite tiles
let tiles_ewi = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

// esri world topo map tiles
let tiles_ewt = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
  });


// default tile
tiles_lght.addTo(map);

let baseLayers = {
    "Light (CartoDB)": tiles_lght,
    "Dark (CartoDB)": tiles_drk,
    "Color (Voyager)": tiles_vgr,
    "Satellite (ESRI)":  tiles_ewi,
    "Terrain (ESRI)": tiles_ewt
};


/* ---------------------- MAP CONTROL ---------------------- */
L.control.zoom({position: 'topleft'}).addTo(map);
L.control.scale({maxWidth: 200, position: 'bottomright'}).addTo(map);

let overlayLayers = {};
let layerControl = L.control.layers(baseLayers,overlayLayers, {position: 'topleft'}).addTo(map);

let scoreFilterControl = L.control({ position: 'bottomleft' });

let layerLegend = L.control({ position: 'bottomleft' });


/* ---------------------- MAP LAYERS ---------------------- */
/* -------- FUNCTIONS FOR ALL LAYER -------- */
function popup_attributes(feature, layer) {
    let html = '<table>';
    for (attrib in feature.properties) {
        html += '<tr><td>' + attrib + '</td><td>' + feature.properties[attrib] + '</td></tr>';
    }
    layer.bindPopup(html + '</table>');
}

/* -------- OSM LAYER -------- */
let osmLayer;
let osm;
const t_osm = d3.json("data/metrics_osm_3.geojson");
t_osm.then(data => {
    osm = data;
    // add features to map
    osmLayer  = L.geoJSON(osm, {
        style: function(e) { return { weight: 5, opacity: 0.8, color:  "#BAD4E4" } },
        onEachFeature: popup_attributes
    });
});

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


/* -------- SDOT LAYER -------- */
let sdotLayer;
let sdot;
const t_sdot = d3.json("data/metrics_sdot_3.geojson");
t_sdot.then(data => {
    sdot = data;
    // add features to map
    sdotLayer = L.geoJSON(sdot, {
        style: function(e) { return { weight: 5, opacity: 0.5, color:  "#E4C1BA" } },
        onEachFeature: popup_attributes
    });
});

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


/* -------- CONFLATION LAYER -------- */
let conflationLayer;
let conflation;
let mode = 'view'; // 'view' mode by default

function score_bin(s) {
    if (s === null) { return '#999'; }
    else if (s >= 0.8) { return '#090'; }
    else if (s >= 0.5) { return '#c90'; }
    else if (s > 0) { return '#c00'; }
    else { return '#999'; }
}

let filterConditions = {
    score_08: true,
    score_05_08: true,
    score_lt_05: true,
    score_null: true
};

function getDefaultStyle(conflated_score) {
    return {
        weight: 5,
        opacity: 0.5,
        color: score_bin(conflated_score)
    };
}

let conf_length;
let osm_ids = [];
const t_conflation = d3.json("data/conflated_osm_3.geojson");
t_conflation.then(data => {
    conflation = data;
    let highlightedFeature = null; 

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
                if (mode === 'view') {
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
        
                    map.flyToBounds(layer.getBounds(), { maxZoom: 18, duration: 1.5 });

                    // Set the currently highlighted feature
                    highlightedFeature = layer;
                    
                    // Get the sdot_objectid and osm_id from the clicked feature
                    const sdot_objectid = feature.properties.sdot_objectid;
                    const osm_id = feature.properties.osm_id;
                    // Highlight the features in the sdot and osm layers with matching IDs
                    highlightFeaturesInSDOT(sdot_objectid);
                    highlightFeaturesInOSM(osm_id);
                    popup_attributes(highlightedFeature.feature, highlightedFeature);
                }
                
                else {
                    popup_attributes(layer.feature, layer);
                }
            });
        }
    });


    osmLayer.addTo(map);
    sdotLayer.addTo(map);
    conflationLayer.addTo(map);

    map.fitBounds(conflationLayer.getBounds());


    // get a list of osm_id
    for (let i = 0; i < conflation.features.length; i++) {
        osm_ids[i] = conflation.features[i].properties.osm_id;
    }
});

 /* -------- LEGEND -------- */
    // Add a legend control to toggle feature visibility based on layer and score conditions
layerLegend.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'legend');
    div.innerHTML += '<h4>SDOT Layer</h4>';
    div.innerHTML += '<input type="checkbox" id="sdotLayerControl" checked><span class="legend-color" style="background-color: #E4C1BA"></span><label>SDOT</label><br><br>';

    // Add more legend items as needed for different styles/colors
    div.innerHTML += '<h4>Conflation Layer</h4>';
    div.innerHTML += '<input type="checkbox" id="scoreFilter08" checked><span class="legend-color" style="background-color: #090"></span><label>Score >= 80</label><br>';
    div.innerHTML += '<input type="checkbox" id="scoreFilter05_08" checked><span class="legend-color" style="background-color: #c90"></span><label>Score >= 50</label><br>';
    div.innerHTML += '<input type="checkbox" id="scoreFilterLt05" checked><span class="legend-color" style="background-color: #c00"></span><label>Score >= 15</label><br>';
    div.innerHTML += '<input type="checkbox" id="scoreFilterNull" checked><span class="legend-color" style="background-color: #999"></span><label>Score NULL</label><br><br>';

    div.innerHTML += '<h4>OSM Layer</h4>';
    div.innerHTML += '<input type="checkbox" id="osmLayerControl" checked><span class="legend-color" style="background-color: #BAD4E4"></span><label>OSM</label><br>';
    
    // Add event listeners to the layer control checkboxes
    div.querySelector('#osmLayerControl').addEventListener('change', function () {
        map.removeLayer(osmLayer);
        this.checked ? map.addLayer(osmLayer) : null;
    });

    div.querySelector('#sdotLayerControl').addEventListener('change', function () {
        map.removeLayer(sdotLayer);
        this.checked ? map.addLayer(sdotLayer) : null;
    });

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
layerLegend.addTo(map);

function updateFilteredFeatures() {
    const filteredFeatures = conflation.features.filter(feature => {
        const score = feature.properties.conflated_score;

        if (filterConditions.score_null && score === null)  {
            return true;
        } else if (filterConditions.score_08 && score >= 0.8) {
            return true;
        } else if (filterConditions.score_05_08 && score >= 0.5 && score < 0.8) {
            return true;
        } else if (filterConditions.score_lt_05 && score >= 0.15 && score < 0.5 && score !== null) {
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


/* -------- SEARCH -------- */
let osm_ids1 = [123, 456, 789, 101112];

function focusFormContainer() {
    // Get the form container element
    const formContainer = document.querySelector('.form-container');
  
    // Add a class to simulate focus effect
    formContainer.classList.add('focused');
    
    document.getElementsByClassName("results-container")[0].style.display = "block";
    
    // Add an event listener to remove the class when clicking outside the form container
    document.addEventListener('click', function removeFocus(e) {
      if (!formContainer.contains(e.target)) {
        formContainer.classList.remove('focused');
        document.removeEventListener('click', removeFocus);
        document.getElementsByClassName("results-container")[0].style.display = "none";
      }
    });
  }
  

function search_function() {
    let input = document.getElementById('searchbar').value.toLowerCase();

    if (input.trim() === '') {
        // If the input is empty, clear the results
        clearResults();
        document.getElementsByClassName("results-container")[0].style.display = "none";
    } else {
        // Filter the osm_ids array based on the input pattern (starts with)
        let matchingItems = osm_ids.filter(item => item.toString().startsWith(input));
        document.getElementsByClassName("results-container")[0].style.display = "block";
        // Display the matching items
        displayMatchingItems(matchingItems);
    }
}

function clearResults() {
    // Assuming you have an element with the id "results" to display the matching items
    let resultsElement = document.getElementById('results');

    // Clear previous results
    resultsElement.innerHTML = '';
}

function displayMatchingItems(matchingItems) {
    // Assuming you have an element with the id "results" to display the matching items
    let resultsElement = document.getElementById('results');

    // Clear previous results
    clearResults();

    // Display the matching items
    matchingItems.forEach(item => {
        let listItem = document.createElement('li');
        listItem.textContent = item;
        resultsElement.appendChild(listItem);
    });
}


/* -------- SIDE PANEL -------- */
function openNav() {
    document.getElementById("side-panel").style.display = "block";
    document.getElementById("side-panel").style.width = "400px";
    document.getElementById("openbtn").style.display = "none";
}

function closeNav() {
    document.getElementById("side-panel").style.display = "none";
    document.getElementById("openbtn").style.display = "block";
}


/* -------- MODES: REVIEW vs VIEW -------- */
// Add these global variables to keep track of the current index and highlighted feature
let currentIndex = 0;
let currentOSM;
let currentSDOT;
let highlightedFeature = null;
let filteredFeatures;

function filterAndSort() {
    const filterButton = document.getElementById("filter-button");

    if (!map.hasLayer(sdotLayer)) {
        map.addLayer(sdotLayer);
        document.getElementById('sdotLayerControl').checked = true;
    }

    if (!map.hasLayer(osmLayer)) {
        map.addLayer(osmLayer);
        document.getElementById('osmLayerControl').checked = true;
    }


    if (mode === 'view') {
        // Toggle mode between 'view' and 'review'
        mode = 'review';

        // Update button text
        if (filterButton) {
            filterButton.innerText = 'View Features';
            filterButton.className = 'review';
        } 

        // Filter features based on conflated_score
        filteredFeatures = conflation.features.filter(feature => {
            const score = feature.properties.conflated_score;
            return (score < 0.8 && score !== null); // Adjust the condition as needed
        });

        // Sort the filtered features based on osm_id, start_end_seg, and sdot_objectid
        filteredFeatures.sort((a, b) => {
            if (a.properties.osm_id !== b.properties.osm_id) {
                return a.properties.osm_id - b.properties.osm_id;
            } else if (a.properties.start_end_seg !== b.properties.start_end_seg) {
                return a.properties.start_end_seg.localeCompare(b.properties.start_end_seg);
            } else {
                return a.properties.sdot_objectid - b.properties.sdot_objectid; }
        });

        // Update the GeoJSON layer with the filtered and sorted features
        conflationLayer.clearLayers();
        conflationLayer.addData({
            type: 'FeatureCollection',
            features: filteredFeatures
        });

        currentOSM = filteredFeatures[currentIndex].properties.osm_id;
        currentSDOT = filteredFeatures[currentIndex].properties.sdot_objectid;

        // Turn on elements
        document.getElementById("review-mode").style.display = "block";
        document.getElementById("focusbtn").style.display = "inline-block";

        // Disable the scoreFilterControl
        disableScoreFilterControl();

        // Highlight and zoom to the current (if not first) feature
        highlightAndZoomToFeature(filteredFeatures[currentIndex]);

        showOSM();
        showSDOT();
    }
    else {
        mode = 'view';

        // Turn off elements
        document.getElementById("review-mode").style.display = "none";
        document.getElementById("focusbtn").style.display = "none";

        // Update button text
        if (filterButton) {
            filterButton.innerText = 'Review Features';
            filterButton.className = 'view';
        }

        // Reload the original GeoJSON data into the conflationLayer
        conflationLayer.clearLayers();
        conflationLayer.addData({
            type: 'FeatureCollection',
            features: conflation.features
        });

        map.flyToBounds(conflationLayer.getBounds(), { duration: 1.5 });

        // Enable the scoreFilterControl
        enableScoreFilterControl();
    }
}

function focusOnFeature() {
    if (highlightedFeature) {
        const bounds = highlightedFeature.getBounds();
        // Adjust the duration and maxZoom values as needed
        map.flyToBounds(bounds, { duration: 1.5, maxZoom: 18 });
    }

}

// Function to highlight and zoom to a specific feature
function highlightAndZoomToFeature(feature) {
    // Reset the style of the previously highlighted feature
    if (highlightedFeature) {
        highlightedFeature.setStyle(getDefaultStyle(highlightedFeature.feature.properties.conflated_score));
    }

    // Find the layer corresponding to the feature in the conflationLayer
    const layer = conflationLayer.getLayers().find(layer => layer.feature === feature);

    if (layer) {
        // Highlight the clicked feature in the conflation layer
        layer.setStyle({
            weight: 10,           // Adjust the weight to highlight
            opacity: 0.7,         // Adjust the opacity to highlight
            color: score_bin(feature.properties.conflated_score)    // Set a different color for highlighting
        });

        map.flyToBounds(layer.getBounds(), { maxZoom: 18, duration: 1.5 });

        // Set the currently highlighted feature
        highlightedFeature = layer;

        // Update the index to the current feature
        currentIndex = filteredFeatures.indexOf(feature);
        currentOSM = filteredFeatures[currentIndex].properties.osm_id;
        currentSDOT = filteredFeatures[currentIndex].properties.sdot_objectid;

        // Highlight the features in the sdot and osm layers with matching IDs
        highlightFeaturesInSDOT(feature.properties.sdot_objectid);
        highlightFeaturesInOSM(feature.properties.osm_id);

        showOSM();
        showSDOT();

        // Build an HTML table for the feature's properties
        const tableHTML = buildTableHTML(feature.properties);

        // Append the table to a specific element in your HTML (change 'table-container' to your desired element ID)
        const tableContainer = document.getElementById('table-container');
        if (tableContainer) {
            tableContainer.innerHTML = tableHTML;
        } else {
            console.error("Table container element not found.");
        }

        // Display the length and the current index
        const indexHTML = currentIndex_length(currentIndex, filteredFeatures.length);

        const indexContainer = document.getElementById('feature-length');
        if (indexContainer) {
            indexContainer.innerHTML = indexHTML;
        } else {
            console.error("Index container element not found.");
        }

    } else {
        console.error("Layer not found for the feature:", feature);
    }
}

// Function to build an HTML table based on feature properties
function buildTableHTML(properties) {
    let html = '<table>';
    for (attrib in properties) {
        html += '<tr><td>' + attrib + '</td><td>' + properties[attrib] + '</td></tr>';
    }
    html += '</table>';
    return html;
}

function currentIndex_length(index, length) {
    let html = '<p>';
    html += 'Currently on feature ' + (index+1) + ' out of ' + length + ' features. </p>';
    return html;
}

// Function to handle the next button
function nextFeature() {
    if (currentIndex < filteredFeatures.length - 1) {
        currentIndex++;
        const nextFeature = filteredFeatures[currentIndex];
        highlightAndZoomToFeature(nextFeature);
    }
    if (currentIndex == filteredFeatures.length - 1) {
        currentIndex = 0;
        const nextFeature = filteredFeatures[currentIndex];
        highlightAndZoomToFeature(nextFeature);
    }
}

// Function to handle the back button
function previousFeature() {
    if (currentIndex > 0) {
        currentIndex--;
        const previousFeature = filteredFeatures[currentIndex];
        highlightAndZoomToFeature(previousFeature);
    }
    else if (currentIndex == 0) {
        currentIndex = (filteredFeatures.length - 1);
        const previousFeature = filteredFeatures[currentIndex];
        highlightAndZoomToFeature(previousFeature);
    }
}

function disableScoreFilterControl() {
    // uncheck scoreFilterControl
    document.getElementById('scoreFilter08').checked = false;
    document.getElementById('scoreFilter05_08').checked = true;
    document.getElementById('scoreFilterLt05').checked = true;
    document.getElementById('scoreFilterNull').checked = false;
}

function enableScoreFilterControl() {
    // uncheck scoreFilterControl
    document.getElementById('scoreFilter08').checked = true;
    document.getElementById('scoreFilter05_08').checked = true;
    document.getElementById('scoreFilterLt05').checked = true;
    document.getElementById('scoreFilterNull').checked = true;
}

function showOSM() {
    if(document.getElementById("show-all-osm").checked === true){
        // given this sdot id, we want to get all the osm that share the same sdot
        allOSM_givenSDOT = conflation.features.filter(feature => {
            const sdot_all = feature.properties.sdot_objectid;
            return (sdot_all == currentSDOT && feature != filteredFeatures); // Adjust the condition as needed
        });
        highlightAllOSM(allOSM_givenSDOT);
    } else {
        highlightFeaturesInOSM(currentOSM);
    }
}


function highlightAllOSM(features) {
    // Loop through each OSM feature and highlight it on the map
    features.forEach(osmFeature => {
        const osm_id = osmFeature.properties.osm_id;

        // Find the OSM layer feature with the matching osm_id
        const osmLayerFeature = osmLayer.getLayers().find(layer => layer.feature.properties.osm_id === osm_id);

        // Highlight the OSM layer feature
        if (osmLayerFeature) {
            osmLayerFeature.setStyle({
                // Add your highlight style here
                weight: 10,
                opacity: 0.7,
                color: "#0000ff" // Change the color as needed
            });
        }
    });
}



function showSDOT() {
    if(document.getElementById("show-all-sdot").checked === true){
        // given this sdot id, we want to get all the osm that share the same sdot
        allSDOT_giveOSM = conflation.features.filter(feature => {
            const osm_all = feature.properties.osm_id;
            return (osm_all == currentOSM && feature != filteredFeatures); // Adjust the condition as needed
        });
        highlightAllSDOT(allSDOT_giveOSM);
    } else {
        highlightFeaturesInSDOT(currentSDOT);
    }
}


function highlightAllSDOT(features) {
    // Loop through each OSM feature and highlight it on the map
    features.forEach(sdotFeature => {
        const sdot_id = sdotFeature.properties.sdot_objectid;

        // Find the OSM layer feature with the matching osm_id
        const sdotLayerFeature = sdotLayer.getLayers().find(layer => layer.feature.properties.objectid === sdot_id);

        // Highlight the OSM layer feature
        if (sdotLayerFeature) {
            sdotLayerFeature.setStyle({
                // Add your highlight style here
                weight: 10,
                opacity: 0.7,
                color: "#e856a6" // Change the color as needed
            });
        }
    });
}