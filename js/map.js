const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [138.6, -34.9],
  zoom: 6
});

map.addControl(
  new maplibregl.NavigationControl(),
  "top-left"
);

map.on("load", () => {

  // ============================================================
  // LHN BOUNDARIES
  // ============================================================

  map.addSource("lhn-boundaries", {
    type: "geojson",
    data: "./data/LHN.geojson"
  });

  // Transparent polygon fill
  map.addLayer({
    id: "lhn-fill",
    type: "fill",
    source: "lhn-boundaries",

    paint: {
      "fill-color": "#3388ff",
      "fill-opacity": 0.12
    }
  });

  // Boundary outline
  map.addLayer({
    id: "lhn-outline",
    type: "line",
    source: "lhn-boundaries",

    paint: {
      "line-color": "#3388ff",
      "line-width": 2
    }
  });


  // ============================================================
  // WASTE SITES
  // ============================================================

  map.addSource("waste-sites", {
    type: "geojson",
    data: "./data/waste_sites.geojson"
  });

  map.addLayer({
    id: "waste-sites",
    type: "circle",
    source: "waste-sites",

    paint: {
      "circle-radius": 5,
      "circle-color": "#3388ff",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1
    }
  });

});
