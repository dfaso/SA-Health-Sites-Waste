let allSiteData = null;
let currentFilteredData = null;


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
  // LOAD SITE DATA
  // ============================================================

  const response =
    await fetch("./data/waste_sites.geojson");

  allSiteData =
    await response.json();

  currentFilteredData =
    allSiteData;


  // ============================================================
  // SITE SOURCE
  // ============================================================

  map.addSource("waste-sites", {
    type: "geojson",
    data: allSiteData
  });


  // ============================================================
  // SITE POINTS
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
  // POPULATE DROPDOWNS
  // ============================================================

  populateDropdown(
    "governing-lhn-filter",
    "Governing LHN"
  );

  populateDropdown(
    "geographical-lhn-filter",
    "Geographical LHN"
  );

  populateDropdown(
    "suburb-filter",
    "Suburb"
  );


  // ============================================================
  // DROPDOWN EVENTS
  // ============================================================

  document
    .getElementById("governing-lhn-filter")
    .addEventListener("change", applyFilters);


  document
    .getElementById("geographical-lhn-filter")
    .addEventListener("change", applyFilters);


  document
    .getElementById("suburb-filter")
    .addEventListener("change", applyFilters);


  // ============================================================
  // RESET BUTTON
  // ============================================================

  document
    .getElementById("reset-button")
    .addEventListener("click", resetMap);


  // ============================================================
  // EXPORT BUTTON
  // ============================================================

  document
    .getElementById("export-button")
    .addEventListener("click", exportCurrentSites);


  // ============================================================
  // CLICK SITE
  // ============================================================

  map.on("click", "waste-sites", event => {

    if (!event.features.length) {
      return;
    }


    const siteId =
      event.features[0].properties["Site ID"];


    const filteredFeatures =
      allSiteData.features.filter(feature => {

        return String(
          feature.properties["Site ID"]
        ) === String(siteId);

      });


    currentFilteredData = {
      type: "FeatureCollection",
      features: filteredFeatures
    };


    // Show only selected site on map
    map
      .getSource("waste-sites")
      .setData(currentFilteredData);


    buildSitesTable(currentFilteredData);

    updateSiteCount();

  });


  // ============================================================
  // CLICK LHN
  // ============================================================

  map.on("click", "lhn-fill", event => {

    /*
      Ignore the LHN click if the user actually clicked
      one of the site markers.
    */

    const siteFeatures =
      map.queryRenderedFeatures(
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


    const clickedLhn =
      event.features[0].properties.lhn_code;


    /*
      Put the selected LHN into the geographical
      dropdown.

      Then use the same filtering function as the
      dropdown controls.
    */

    document
      .getElementById("geographical-lhn-filter")
      .value = clickedLhn;


    applyFilters();

  });


  // ============================================================
  // POINTER - SITES
  // ============================================================

  map.on("mouseenter", "waste-sites", () => {

    map.getCanvas().style.cursor =
      "pointer";

  });


  map.on("mouseleave", "waste-sites", () => {

    map.getCanvas().style.cursor =
      "";

  });


  // ============================================================
  // POINTER - LHN
  // ============================================================

  map.on("mouseenter", "lhn-fill", () => {

    map.getCanvas().style.cursor =
      "pointer";

  });


  map.on("mouseleave", "lhn-fill", () => {

    map.getCanvas().style.cursor =
      "";

  });


  // ============================================================
  // INITIAL TABLE
  // ============================================================

  buildSitesTable(allSiteData);

  updateSiteCount();

}); // END map load



// ============================================================
// POPULATE DROPDOWN
// ============================================================

function populateDropdown(
  elementId,
  propertyName
) {

  const select =
    document.getElementById(elementId);


  const values = [
    ...new Set(

      allSiteData.features
        .map(feature =>
          feature.properties[propertyName]
        )
        .filter(value =>
          value !== null &&
          value !== undefined &&
          value !== ""
        )

    )
  ];


  values.sort((a, b) =>
    String(a).localeCompare(String(b))
  );


  values.forEach(value => {

    const option =
      document.createElement("option");

    option.value = value;

    option.textContent = value;

    select.appendChild(option);

  });

}



// ============================================================
// APPLY DROPDOWN FILTERS
// ============================================================

function applyFilters() {

  const governingLhn =
    document
      .getElementById("governing-lhn-filter")
      .value;


  const geographicalLhn =
    document
      .getElementById("geographical-lhn-filter")
      .value;


  const suburb =
    document
      .getElementById("suburb-filter")
      .value;


  const filteredFeatures =
    allSiteData.features.filter(feature => {

      const properties =
        feature.properties;


      if (
        governingLhn &&
        properties["Governing LHN"] !== governingLhn
      ) {
        return false;
      }


      if (
        geographicalLhn &&
        properties["Geographical LHN"] !== geographicalLhn
      ) {
        return false;
      }


      if (
        suburb &&
        properties["Suburb"] !== suburb
      ) {
        return false;
      }


      return true;

    });


  currentFilteredData = {
    type: "FeatureCollection",
    features: filteredFeatures
  };


  // Update map markers
  map
    .getSource("waste-sites")
    .setData(currentFilteredData);


  // Update table
  buildSitesTable(currentFilteredData);


  // Update counter
  updateSiteCount();


  // Highlight geographical LHN
  updateLhnHighlight(geographicalLhn);

}



// ============================================================
// LHN HIGHLIGHT
// ============================================================

function updateLhnHighlight(lhnCode) {

  // Nothing selected - restore normal appearance

  if (!lhnCode) {

    map.setPaintProperty(
      "lhn-fill",
      "fill-opacity",
      0.25
    );


    map.setPaintProperty(
      "lhn-outline",
      "line-opacity",
      1
    );


    return;

  }


  // Fade everything except selected LHN

  map.setPaintProperty(
    "lhn-fill",
    "fill-opacity",
    [
      "case",

      ["==", ["get", "lhn_code"], lhnCode],

      0.35,

      0.05
    ]
  );


  map.setPaintProperty(
    "lhn-outline",
    "line-opacity",
    [
      "case",

      ["==", ["get", "lhn_code"], lhnCode],

      1,

      0.15
    ]
  );

}



// ============================================================
// RESET / SHOW ALL
// ============================================================

function resetMap() {

  document
    .getElementById("governing-lhn-filter")
    .value = "";


  document
    .getElementById("geographical-lhn-filter")
    .value = "";


  document
    .getElementById("suburb-filter")
    .value = "";


  currentFilteredData =
    allSiteData;


  map
    .getSource("waste-sites")
    .setData(allSiteData);


  updateLhnHighlight("");


  buildSitesTable(allSiteData);


  updateSiteCount();

}



// ============================================================
// SITE COUNT
// ============================================================

function updateSiteCount() {

  const count =
    currentFilteredData.features.length;


  document
    .getElementById("site-count")
    .textContent =
      count.toLocaleString();

}



// ============================================================
// EXPORT CURRENT SITES TO CSV
// ============================================================

function exportCurrentSites() {

  if (
    !currentFilteredData ||
    !currentFilteredData.features.length
  ) {
    return;
  }


  const columns =
    Object.keys(
      currentFilteredData
        .features[0]
        .properties
    );


  const rows = [];


  // CSV header
  rows.push(
    columns
      .map(escapeCsvValue)
      .join(",")
  );


  // CSV rows
  currentFilteredData
    .features
    .forEach(feature => {

      const row =
        columns.map(column => {

          return escapeCsvValue(
            feature.properties[column] ?? ""
          );

        });


      rows.push(
        row.join(",")
      );

    });


  const csv =
    rows.join("\r\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;

  link.download =
    "waste_sites_export.csv";


  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);

}



// ============================================================
// CSV ESCAPING
// ============================================================

function escapeCsvValue(value) {

  const text =
    String(value);


  return (
    '"' +
    text.replace(/"/g, '""') +
    '"'
  );

}



// ============================================================
// BUILD SITE TABLE
// ============================================================

function buildSitesTable(siteData) {

  const table =
    document.getElementById("sites-table");


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


    td.textContent =
      "No sites found.";


    row.appendChild(td);

    tbody.appendChild(row);

    table.appendChild(tbody);


    return;

  }


  const columns =
    Object.keys(
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


    th.textContent =
      column;


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
