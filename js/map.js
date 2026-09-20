const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [135.5, -31.5],
  zoom: 5
});

map.addControl(
  new maplibregl.NavigationControl(),
  "top-left"
);


// ============================================================
// MAP LOAD
// ============================================================

map.on("load", async () => {

  // ============================================================
  // LHN BOUNDARIES
  // ============================================================

  map.addSource("lhn-boundaries", {
    type: "geojson",
    data: "./data/LHN.geojson"
  });


  // ============================================================
  // LHN COLOURED FILL
  // ============================================================

  map.addLayer({
    id: "lhn-fill",
    type: "fill",
    source: "lhn-boundaries",

    paint: {
      "fill-color": [
        "match",
        ["get", "lhn_code"],

        "CALHN",  "#2E86AB",
        "SALHN",  "#F18F01",
        "NALHN",  "#D1495B",
        "BHFLHN", "#6A4C93",
        "LCLHN",  "#00A896",
        "RMCLHN", "#F4D35E",
        "EFNLHN", "#577590",
        "YNLHN",  "#43AA8B",
        "FUNLHN", "#F3722C",
        "WCHN",   "#9B5DE5",

        "#999999"
      ],

      "fill-opacity": 0.25
    }
  });


  // ============================================================
  // LHN OUTLINE
  // ============================================================

  map.addLayer({
    id: "lhn-outline",
    type: "line",
    source: "lhn-boundaries",

    paint: {
      "line-color": "#000000",
      "line-width": 1
    }
  });


  // ============================================================
  // LOAD WASTE SITE DATA
  // ============================================================

  const response = await fetch("./data/waste_sites.geojson");

  const siteData = await response.json();


  // ============================================================
  // WASTE SITE SOURCE
  // ============================================================

  map.addSource("waste-sites", {
    type: "geojson",
    data: siteData
  });


  // ============================================================
  // WASTE SITE POINTS
  // ============================================================

  map.addLayer({
    id: "waste-sites",
    type: "circle",
    source: "waste-sites",

    paint: {
      "circle-radius": 6,
      "circle-color": "#FF4A4A",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1
    }
  });


  // ============================================================
  // CLICK INDIVIDUAL SITE
  // ============================================================

  map.on("click", "waste-sites", (event) => {

    if (!event.features.length) {
      return;
    }

    const clickedSite = event.features[0];

    const siteId =
      clickedSite.properties["Site ID"];


    const filteredFeatures =
      siteData.features.filter(feature => {

        return String(feature.properties["Site ID"]) ===
               String(siteId);

      });


    const filteredSiteData = {
      type: "FeatureCollection",
      features: filteredFeatures
    };


    // Filter the table to this site
    buildSitesTable(filteredSiteData);

  }); // END site click


  // ============================================================
  // CLICK LHN
  // ============================================================

  map.on("click", "lhn-fill", (event) => {

    /*
      Check whether a site marker was clicked.

      The site markers sit above the LHN polygons, so this prevents
      the LHN click event from also firing when clicking a site.
    */

    const siteFeatures = map.queryRenderedFeatures(
      event.point,
      {
        layers: ["waste-sites"]
      }
    );


    if (siteFeatures.length) {
      return;
    }


    if (!event.features.length) {
      return;
    }


    // Get selected LHN code
    const clickedLhn =
      event.features[0].properties.lhn_code;


    // ============================================================
    // FILTER SITES TO SELECTED LHN
    // ============================================================

    const filteredFeatures =
      siteData.features.filter(feature => {

        return feature.properties["Geographical LHN"] ===
               clickedLhn;

      });


    const filteredSiteData = {
      type: "FeatureCollection",
      features: filteredFeatures
    };


    // Remove all non-selected sites from the map
    map
      .getSource("waste-sites")
      .setData(filteredSiteData);


    // Filter the table
    buildSitesTable(filteredSiteData);


    // ============================================================
    // FADE NON-SELECTED LHNs
    // ============================================================

    map.setPaintProperty(
      "lhn-fill",
      "fill-opacity",
      [
        "case",

        ["==", ["get", "lhn_code"], clickedLhn],
        0.35,

        0.05
      ]
    );


    // Fade non-selected outlines
    map.setPaintProperty(
      "lhn-outline",
      "line-opacity",
      [
        "case",

        ["==", ["get", "lhn_code"], clickedLhn],
        1,

        0.15
      ]
    );

  }); // END LHN click


  // ============================================================
  // POINTER - SITES
  // ============================================================

  map.on("mouseenter", "waste-sites", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "waste-sites", () => {
    map.getCanvas().style.cursor = "";
  });


  // ============================================================
  // POINTER - LHN
  // ============================================================

  map.on("mouseenter", "lhn-fill", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "lhn-fill", () => {
    map.getCanvas().style.cursor = "";
  });


  // ============================================================
  // BUILD INITIAL TABLE
  // ============================================================

  buildSitesTable(siteData);

}); // END map load



// ============================================================
// BUILD SITE TABLE
// ============================================================

function buildSitesTable(siteData) {

  const table =
    document.getElementById("sites-table");


  // Clear the current table before rebuilding it
  table.innerHTML = "";


  // ============================================================
  // NO RESULTS
  // ============================================================

  if (!siteData.features.length) {

    const tbody =
      document.createElement("tbody");

    const row =
      document.createElement("tr");

    const td =
      document.createElement("td");

    td.textContent = "No sites found.";

    row.appendChild(td);
    tbody.appendChild(row);
    table.appendChild(tbody);

    return;
  }


  // Get the property names from the first site
  const columns = Object.keys(
    siteData.features[0].properties
  );


  // ============================================================
  // TABLE HEADER
  // ============================================================

  const thead =
    document.createElement("thead");

  const headerRow =
    document.createElement("tr");


  columns.forEach(column => {

    const th =
      document.createElement("th");

    th.textContent = column;

    headerRow.appendChild(th);

  });


  thead.appendChild(headerRow);

  table.appendChild(thead);


  // ============================================================
  // TABLE BODY
  // ============================================================

  const tbody =
    document.createElement("tbody");


  siteData.features.forEach(feature => {

    const row =
      document.createElement("tr");


    columns.forEach(column => {

      const td =
        document.createElement("td");

      td.textContent =
        feature.properties[column] ?? "";

      row.appendChild(td);

    });


    tbody.appendChild(row);

  });


  table.appendChild(tbody);

}
