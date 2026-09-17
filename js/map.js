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

  // Waste site GeoJSON
  map.addSource("waste-sites", {
    type: "geojson",
    data: "./data/waste_sites.geojson"
  });

  // Waste site points
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
