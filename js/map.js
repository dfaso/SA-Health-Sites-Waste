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
