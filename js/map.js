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
// WASTE SITE MAP POINTS + CLUSTERING
// ============================================================

map.addSource("waste-sites", {
  type: "geojson",
  data: siteData,

  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});


// ============================================================
// CLUSTER CIRCLES
// ============================================================

map.addLayer({
  id: "clusters",
  type: "circle",
  source: "waste-sites",

  filter: ["has", "point_count"],

  paint: {
    "circle-color": "#0d6efd",

    "circle-radius": [
      "step",
      ["get", "point_count"],

      20,       // default size

      10, 25,   // 10+ sites
      50, 30,   // 50+ sites
      100, 35   // 100+ sites
    ],

    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2
  }
});


// ============================================================
// CLUSTER COUNT
// ============================================================

map.addLayer({
  id: "cluster-count",
  type: "symbol",
  source: "waste-sites",

  filter: ["has", "point_count"],

  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-size": 14
  },

  paint: {
    "text-color": "#ffffff"
  }
});


// ============================================================
// INDIVIDUAL SITE POINTS
// ============================================================

map.addLayer({
  id: "waste-sites",
  type: "circle",
  source: "waste-sites",

  filter: ["!", ["has", "point_count"]],

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

// ============================================================
// CLICK CLUSTER TO ZOOM IN
// ============================================================

map.on("click", "clusters", async (event) => {

  const features = map.queryRenderedFeatures(event.point, {
    layers: ["clusters"]
  });

  const clusterId = features[0].properties.cluster_id;

  const zoom = await map
    .getSource("waste-sites")
    .getClusterExpansionZoom(clusterId);

  map.easeTo({
    center: features[0].geometry.coordinates,
    zoom: zoom
  });

});
  
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
