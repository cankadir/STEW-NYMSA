// - Define Object ID in Survey123 for editting capabilities
// localhost:63827 -> python -m http.server 63827

import { config } from "./config.js";

// Enter you local host url to Developper Auto 2.0 in ArcGIS Developper account.
// All Survey Info comes from Config
var esri_key = config.esri_key;
var clientId = config.clientId;
var itemId = config.itemId;
var fl_Y = config.fl_url_Y;
var fl_N = config.fl_url_N;


const colors = ["#A8A8A9", "#A8A8A9", "#AD3C0E"]; // Marker Colors, time based rendering
const circle_size = 6; // Markersize

require(["esri/config", "esri/views/MapView", "esri/Map", "esri/WebMap", "esri/layers/FeatureLayer", "esri/widgets/Legend", "esri/renderers/visualVariables/SizeVariable", "esri/geometry/Extent"], (esriConfig, MapView, Map, WebMap, FeatureLayer, Legend, SizeVariable, Extent) => {
    esriConfig.apiKey = esri_key;

    // ----------- BUTTONS FOR SURVEYS -----------------
    // Add a Group
    const add_button = document.getElementById("add-group");
    add_button.addEventListener("click", () => {

        //This is the Survey123 -- Add
        document.getElementById("formDiv").setAttribute("style", "height:100%");
        document.getElementById("formDiv-edit").setAttribute("style", "height:1px");
        document.getElementsByClassName('left-panel')[0].setAttribute("style", "min-height:400px");

        var webform = new Survey123WebForm({
            clientId: clientId, // Oath only is allowed in local host 50905 for now.
            container: "formDiv",
            itemId: itemId,
            //autoRefresh: 3,
            //isDisabedSubmittoFeatureService: false,
            hideElements: ["theme", "navbar", "header", "description"], // Hide cosmetic elements
            onFormLoaded: (data) => { // Place point to current location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(position => {
                        webform.setGeopoint({
                            x: position.coords.longitude,
                            y: position.coords.latitude
                        });
                    }, () => {
                        //console.error('Unable to retrieve your location');
                        webform.setGeopoint({
                            // If current location is not know, go to the center
                            x: -73.957,
                            y: 40.733
                        });
                    });
                } else {
                    console.error('Geolocation is not supported by your browser');
                }
            },
            onFormSubmitted: (data) => { // Show me the submitted data
                console.log("New Group Submitted")
                console.log(data);

                let tt = document.getElementsByClassName('left-panel');
                tt = [...tt][0];
                tt.setAttribute("style", "min-height:0px");
                console.log("all done ")

                setTimeout(function() {
                    layer.refresh();
                    no_layer.refresh();
                    myMap.removeAll()
                    myMap.addMany([layer, no_layer])

                }, 500);

            }
        })
    });

    // ------------------ ESRI ELEMENTS DEFINED HERE ----------------------
    // -------- SURVEY RESPONSES ----------
    // Pop up Template
    var template_groups = {
        title: "",
        content: "<p style='font-weight:bold;margin-bottom:10px!important'>{OrgName}</p> <p>{OrgStreet1}, {OrgCity}/ {OrgState}, {OrgZip}</p> <p> <b>Org. Focus:</b> {PrimFocus}</p>"
    };

    // Render Styline
    const markercolor = '#4664a4';
    const renderer_Rule = {
            type: "unique-value",
            legendOptions: {
                title: "Stewardship Groups"
            },
            field: "Stew_Gr",
            uniqueValueInfos: [{
                value: -1,
                label: "Stew-Map Group",
                symbol: {
                    type: "simple-marker",
                    size: 4,
                    color: markercolor,
                    outline: { //Stroke Settings
                        width: 1,
                        color: "#79C99E"
                    }
                }
            }, {
                value: 0,
                label: "990 Group",
                symbol: {
                    type: "simple-marker",
                    size: 4,
                    color: markercolor,
                    outline: { //Stroke Settings
                        width: 1,
                        color: "#E5E5E5"
                    }
                }
            }]
        }
        // Adjust Scale in Zoom
    renderer_Rule.visualVariables = [{ // Scale at zoom
        type: "size",
        valueExpression: "$view.scale",
        stops: [{
            size: 7,
            value: 50000
        }, {
            size: 3,
            value: 250000
        }, {
            size: 1,
            value: 1000000
        }]
    }];

    //Connect to Group Data as feature layer
    const layer = new FeatureLayer({
        url: fl_Y,
        outFields: ["*"],
        renderer: renderer_Rule,
        popupTemplate: template_groups,
    });

    const no_renderer_Rule = {
        type: "simple",
        symbol: {
            type: "simple-marker",
            size: 4,
            color: "red",
            outline: { //Stroke Settings
                width: 0.4,
                color: "#E5E5E5"
            }
        }
    }

    // Adjust Scale in Zoom
    no_renderer_Rule.visualVariables = [{ // Scale at zoom
        type: "size",
        valueExpression: "$view.scale",
        stops: [{
            size: 7,
            value: 50000
        }, {
            size: 3,
            value: 250000
        }, {
            size: 1,
            value: 1000000
        }]
    }];

    var no_template_groups = {
        title: "Suggested Group",
        content: "<p style='font-weight:bold;margin-bottom:10px!important'>{OrgName}</p>"
    };

    const no_layer = new FeatureLayer({
        url: fl_N,
        outFields: ["OrgName"],
        renderer: no_renderer_Rule,
        popupTemplate: no_template_groups,
    });

    // ----- BASEMAP ------
    const myMap = new Map({
        basemap: "osm-light-gray",
        layers: [no_layer, layer]
    });

    // Create a MapView instance (for 2D viewing) and reference the map instance
    let view = new MapView({
        map: myMap,
        container: "viewDiv",
        zoom: 8,
        center: [-73.957, 40.733]
    });

    /*/ ------------ Legend -----------------
    let legend = new Legend({ view: view });
    legend.label = "Stewardship Groups"
    view.ui.add(
        legend, {
            position: "bottom-right",
        }
    );
    /*/

    // -------- INTERACTIONS -----------------
    // When a group is clicked on the map, filter the side bar to that group
    view.on("click", (event) => {
        view.hitTest(event.screenPoint, { include: layer }) // Is it clicked?
            .then(function(response) {
                var graphic = response.results[0].graphic;
                // Filter the info element to clicked group
                layer.queryFeatures({
                    where: `PopID = '${graphic.attributes.PopID}'`,
                    outFields: ["*"]
                }).then(function(results) {
                    console.log(results.features);
                    injectList(results); // Only 1 group
                    document.getElementById("group-search").value = results.features[0].attributes.OrgName //Change input value to this so you can delete later.
                });
            });
    })

    // -------------------- INPUT ------------------------
    //Convert text to title case
    function titleCase(str) {
        str = str.toLowerCase().split(' ');
        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
        }
        return str.join(' ');
    }

    //Everything about the group-list is here
    function injectList(results) {

        console.log(results.features[0].attributes);

        /* Inject List Controls the right panel element
        0. Empty the Group List
        1. Sort List
        2. For Loop Elements and insert Group Name and Address
        3. Add "Edit This Group" button at the bottom
        4. When Edit button is clicked, launch a new survey in edit mode at the side. */

        //Empty the div
        document.getElementById("group-list").innerHTML = "";
        //console.log(`There are ${results.features.length} groups in the list`);
        //Sort List
        results.features.sort((a, b) => a.attributes.OrgName > b.attributes.OrgName ? 1 : -1);

        //Ierate over each element to generate the list
        results.features.forEach(function(feat) {
            // ----- Insert Name and Address
            var htmlString = `<div class="group-text"><p style="font-size:10pt;" class="group-content" id="group-title">${titleCase(feat.attributes.OrgName)}</p><hr id="group-sep"><p style="font-size:8pt" class="group-content">${titleCase(feat.attributes.OrgStreet1)},${feat.attributes.OrgCity}/${feat.attributes.OrgState}</p></div>`;
            let div = document.createElement('div');
            div.setAttribute("id", `${feat.attributes.PopID}`);
            div.setAttribute("class", "group-container");
            div.innerHTML = htmlString;
            document.getElementById("group-list").appendChild(div);

            //Go to clicked Group on Click
            div.addEventListener('click', function change(event) {
                // Clicked group gets a border
                let grs = document.getElementsByClassName("group-container")
                Array.from(grs).forEach(function(gr) {
                    gr.setAttribute("class", "group-container");
                })

                div.setAttribute("class", "group-container clicked");
                // Goto the group on the map
                view.goTo({
                    target: feat,
                    zoom: 15,
                    duration: 2500
                });
            });


            // ----- Button in each group element
            // - Rigth panel actions
            let button = document.createElement('div');
            button.setAttribute("id", `${feat.attributes.OrgName}`);
            button.setAttribute("class", "edit-button");
            button.innerHTML = `<p style="pointer-events:none;">Edit This Group</p>`;

            // ----- On click
            button.addEventListener("click", function change(event) {
                //console.log(event.target.attributes.id.value);
                // Query group by to get GlobalID
                layer.queryFeatures({
                    where: `OrgName = '${event.target.attributes.id.value}'`,
                    outFields: ['*'],
                    returnGeometry: true
                }).then(function(results) {

                    document.getElementById("formDiv-edit").setAttribute("style", "height:100%");
                    document.getElementById("formDiv").setAttribute("style", "height:1px");
                    document.getElementsByClassName('left-panel')[0].setAttribute("style", "min-height:400px");

                    var obj = results.features[0];
                    console.log(obj.geometry.x, obj.geometry.y)

                    var webform_edit = new Survey123WebForm({
                        clientId: clientId,
                        container: "formDiv-edit",
                        itemId: itemId,
                        width: 250,
                        //autoRefresh: 3,
                        hideElements: ["theme", "navbar", "header", "description"], // Hide cosmetic elements,
                        defaultQuestionValue: {
                            "OrgName": obj.attributes.OrgName,
                            "OrgStreet1": obj.attributes.OrgStreet1,
                            "OrgCity": obj.attributes.OrgCity,
                            "OrgState": obj.attributes.OrgState,
                            "OrgZip": obj.attributes.OrgZip,
                            "PrimFocus": obj.attributes.PrimFocus,
                            "Accept": "N"
                        },
                        onFormLoaded: (data) => { // Place point to current location
                            webform_edit.setGeopoint({
                                x: obj.geometry.x,
                                y: obj.geometry.y
                            });
                        },
                        onFormSubmitted: (data) => {
                            console.log('Form submitted: ', data);

                            setTimeout(function() {
                                layer.refresh();
                                no_layer.refresh();
                                myMap.removeAll()
                                myMap.addMany([layer, no_layer])
                            }, 500);

                            let tt = document.getElementsByClassName('left-panel');
                            tt = [...tt][0];
                            tt.setAttribute("style", "min-height:0px");
                        }
                    });
                });
            });
            // On Click Finishes Here
            div.appendChild(button); // Add edit button to the end of div
        })
    }

    // Queries for all the features in the service to fill the right panel for the first time. 
    layer.queryFeatures().then(function(results) {
        injectList(results)
    });

    //-----------------------  When there is input in the SEARCH BAR
    document.getElementById("group-search").addEventListener("input", function change(event) { //if there is change
        if (event.target.value) { //If the input exists
            // Search FL for similar enteries
            layer.queryFeatures({
                where: `OrgName LIKE '%${event.target.value.toUpperCase()}%'`,
                outFields: ['*']
            }).then(function(results) {
                injectList(results);
            });
        } else { //If the input is empty, then run with all the values. 
            layer.queryFeatures().then(function(results) {
                injectList(results)
            });
        }

    });


});