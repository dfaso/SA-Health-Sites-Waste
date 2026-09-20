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
  // WASTE SITE SOURCE + CLUSTERING
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

        20,

        10, 25,
        50, 30,
        100, 35
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
  // CLICK CLUSTER TO ZOOM IN
  // ============================================================

  map.on("click", "clusters", async (event) => {

    const features = map.queryRenderedFeatures(event.point, {
      layers: ["clusters"]
    });

    if (!features.length) {
      return;
    }

    const clusterId = features[0].properties.cluster_id;

    const zoom = await map
      .getSource("waste-sites")
      .getClusterExpansionZoom(clusterId);

    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom: zoom
    });

  }); // END cluster click


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


    buildSitesTable({
      type: "FeatureCollection",
      features: filteredFeatures
    });

  }); // END individual site click


  // ============================================================
  // CLICK LHN
  // ============================================================

  map.on("click", "lhn-fill", (event) => {

    /*
      A site marker or cluster may also be sitting over the LHN polygon.

      If one was clicked, let the site/cluster event handle the click
      instead of also filtering by LHN.
    */

    const siteFeatures = map.queryRenderedFeatures(
      event.point,
      {
        layers: [
          "waste-sites",
          "clusters",
          "cluster-count"
        ]
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


    const filteredFeatures =
      siteData.features.filter(feature => {

        return feature.properties["Geographical LHN"] ===
               clickedLhn;

      });


    buildSitesTable({
      type: "FeatureCollection",
      features: filteredFeatures
    });

  }); // END LHN click


  // ============================================================
  // POINTER - CLUSTERS
  // ============================================================

  map.on("mouseenter", "clusters", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "clusters", () => {
    map.getCanvas().style.cursor = "";
  });


  // ============================================================
  // POINTER - INDIVIDUAL SITES
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


  // Clear existing table first.
  // This is important now that we're filtering/rebuilding it.

  table.innerHTML = "";


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


  // Get property names from the first GeoJSON feature

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
