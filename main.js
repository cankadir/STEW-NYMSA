// - Define Object ID in Survey123 for editting capabilities
// localhost:63827 -> python -m http.server 63827

import { config } from "./config.js";

// Enter you local host url to Developper Auto 2.0 in ArcGIS Developper account.
// All Survey Info comes from Config
var esri_key = config.esri_key;
var clientId = config.clientId;
var itemId = config.itemId;
var fl = config.fl_url;

const colors = ["#A8A8A9", "#A8A8A9", "#AD3C0E"]; // Marker Colors, time based rendering
const circle_size = 6; // Markersize

require(["esri/config", "esri/views/MapView", "esri/Map", "esri/WebMap", "esri/layers/FeatureLayer", "esri/widgets/Legend"], (esriConfig, MapView, Map, WebMap, FeatureLayer, Legend) => {
    esriConfig.apiKey = esri_key;

    // ----------- BUTTONS FOR SURVEYS -----------------
    // Add a Group
    const add_button = document.getElementById("add-group");
    add_button.addEventListener("click", () => {
        console.log("Initiate Survey -> Add Group")

        //This is the Survey123 -- Add
        document.getElementById("formDiv").setAttribute("style", "height:100%");
        document.getElementById("formDiv-edit").setAttribute("style", "height:1px");

        var webform = new Survey123WebForm({
            clientId: clientId, // Oath only is allowed in local host 50905 for now.
            container: "formDiv",
            itemId: itemId,
            autoRefresh: 3,
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
                layer.refresh();
            }
        })
    });

    // ------------------ ESRI ELEMENTS DEFINED HERE ----------------------
    // -------- SURVEY RESPONSES ----------
    // Pop up Template
    var template_groups = {
        // autocasts as new PopupTemplate()
        title: " Selected Group",
        content: "<b>{OrgName}</b> <br> {OrgStreet1}, {OrgCity}/ {OrgState}, {OrgZip} <br> {PrimFocus}"
    };

    //Layer Styling is here
    const renderer_Rule = {
        type: "simple",
        label: "Groups",
        symbol: {
            type: "simple-marker",
            size: 4,
            color: colors[0],
            outline: { // autocasts as new SimpleLineSymbol()
                width: 0.5,
                color: "white"
            }
        },

        visualVariables: [{
                type: "color",
                field: "Stew_Gr",
                stops: [
                    { value: 0, color: colors[0] },
                    { value: 1, color: "#354F52" },
                ]
            }
            /*{
                type: "color",
                valueExpression: "DateDiff( Now() , $feature['EditDate'], 'days')",
                valueExpressionTitle: "Days it took to close incident",
                stops: [
                    { value: 23, color: colors[0], label: "23" },
                    { value: 2, color: colors[1], label: "now" },
                    { value: 0, color: colors[2], label: "new" },
                ]
            },
            {
                type: "size",
                valueExpression: "DateDiff( Now() , $feature['EditDate'], 'days')",
                valueExpressionTitle: "Days it took to close incident",
                stops: [
                    { value: 23, size: 4, label: "23" },
                    { value: 1, size: 4, label: "now" },
                    { value: 0, size: circle_size, label: "new" },
                ]
            }*/
        ]
    }

    //Connect to Group Data as feature layer
    const layer = new FeatureLayer({
        url: fl,
        outFields: ["*"],
        renderer: renderer_Rule,
        popupTemplate: template_groups,
        //blendMode: "multiply"
    });

    // ----- BASEMAP ------
    const myMap = new Map({
        basemap: "osm-light-gray",
        layers: [layer] // Non-profits and stew-map layer
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
    view.ui.add(legend, "bottom-right");
    */


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

        /* Inject List Controls the right panel element
        0. Empty the Group List
        1. Sort List
        2. For Loop Elements and insert Group Name and Address
        3. Add "Edit This Group" button at the bottom
        4. When Edit button is clicked, launch a new survey in edit mode at the side. */

        //Empty the div
        document.getElementById("group-list").innerHTML = "";
        console.log(`There are ${results.features.length} groups in the list`);
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
                console.log(event.target.attributes.id.value);
                // Query group by to get GlobalID
                layer.queryFeatures({
                    where: `OrgName = '${event.target.attributes.id.value}'`,
                    outFields: ['*']
                }).then(function(results) {
                    //console.log(results.features[0].attributes);
                    //objectId={objectid}
                    //let web_link = `https://survey123.arcgis.com/share/${itemId}?mode=edit&objectId=${results.features[0].attributes.OBJECTID}`
                    //console.log(web_link);

                    //--------------------------- Insert Webform to formDiv-edit in Edit Mode
                    //Div must have height to insert form in to it. 
                    // Missing Object ID
                    document.getElementById("formDiv-edit").setAttribute("style", "height:100%");
                    document.getElementById("formDiv").setAttribute("style", "height:1px");

                    var webform_edit = new Survey123WebForm({
                        clientId: clientId, // Oath only is allowed in local host 50905 for now.
                        container: "formDiv-edit",
                        itemId: itemId,
                        width: 250,
                        autoRefresh: 3,
                        hideElements: ["theme", "navbar", "header", "description"], // Hide cosmetic elements
                        onFormSubmitted: (data) => {
                            //When form is submitted, refresh the feature layer. 
                            console.log("Submitted!")
                            layer.refresh();
                        }
                    });
                    webform_edit.setMode({
                        mode: 'edit',
                        globalId: `${results.features[0].attributes.GlobalID}`,
                        objectId: `${results.features[0].attributes.OBJECTID}`
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