function init() {
//Sample code taken from https://d3-graph-gallery.com/graph/choropleth_basic.html
    var w = window.innerWidth;
    var h = 1000;

    // The svg
    var svg = d3.select("#map").append("svg")
        .attr("width", w)
        .attr("height", h)
        .style("background-color", "slategray");

    console.log(svg.node());

    // Map and projection
    var path = d3.geoPath();
    var projection = d3.geoMercator()
        .scale(200)
        .center([0, 20])
        .translate([w / 2, h / 2]);

    // Data and color scale
    var data = d3.map();
    var colorScale = d3.scaleThreshold()
        .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
        .range(d3.schemeBlues[7]);

    // Load external data and boot
    d3.queue()
        .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
        .defer(d3.csv, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv", function (d) { data.set(d.code, +d.pop); })
        .await(ready);

    function ready(error, topo) {
        // Draw the map
        svg.append("g")
            .attr("id", "mapGroup")
            .selectAll("path")
            .data(topo.features)
            .enter()
            .append("path")
            // draw each country
            .attr("d", d3.geoPath()
                .projection(projection)
            )
            // set the color of each country
            .attr("fill", function (d) {
                d.total = data.get(d.id) || 0;
                return colorScale(d.total);
            });
    }

}
window.onload = init;