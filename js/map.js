const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [135.5, -31.5],
  zoom: 5
});

-31.519179230054693, 135.55638863046636

map.addControl(
  new maplibregl.NavigationControl(),
  "top-left"
);


map.on("load", async () => {

  // ============================================================
  // LHN BOUNDARIES
  // ============================================================

  map.addSource("lhn-boundaries", {
    type: "geojson",
    data: "./data/LHN.geojson"
  });

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
  // WASTE SITE MAP POINTS
  // ============================================================

  map.addSource("waste-sites", {
    type: "geojson",
    data: siteData
  });

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
  // BUILD SITE TABLE
  // ============================================================

  buildSitesTable(siteData);

});


function buildSitesTable(siteData) {

  const table = document.getElementById("sites-table");

  if (!siteData.features.length) {
    return;
  }

  // Get the property names from the GeoJSON
  const columns = Object.keys(
    siteData.features[0].properties
  );


  // ============================================================
  // TABLE HEADER
  // ============================================================

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  columns.forEach(column => {

    const th = document.createElement("th");

    th.textContent = column;

    headerRow.appendChild(th);

  });

  thead.appendChild(headerRow);

  table.appendChild(thead);


  // ============================================================
  // TABLE BODY
  // ============================================================

  const tbody = document.createElement("tbody");

  siteData.features.forEach(feature => {

    const row = document.createElement("tr");

    columns.forEach(column => {

      const td = document.createElement("td");

      td.textContent =
        feature.properties[column] ?? "";

      row.appendChild(td);

    });

    tbody.appendChild(row);

  });

  table.appendChild(tbody);

}
