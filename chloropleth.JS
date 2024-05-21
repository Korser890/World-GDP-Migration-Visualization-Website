function init() {
    var w = 900; // width of the SVG
    var h = 600; // height of the SVG

    var projection = d3.geoNaturalEarth1()
                       .center([0, 0])
                       .translate([w / 2, h / 2])
                       .scale(200);

    var path = d3.geoPath()
                 .projection(projection);

    var zoom = d3.zoom()
                .scaleExtent([1, 8])
                .translateExtent([[0, 0], [w, h]])
                .on("zoom", zoomed);

    var svg = d3.select("#map")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

    const g = svg.append('g');

    svg.call(zoom);

    // Create a tooltip element
    var tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("visibility", "hidden")
                    .style("background", "lightsteelblue")
                    .style("padding", "6px")
                    .style("border-radius", "8px")
                    .style("text-align", "center");

    d3.json("world-geo-10m.json").then(function(world) {
        g.selectAll("path")
           .data(world.features)
           .enter()
           .append("path")
           .attr("d", path)
           .attr("fill", "#294122");

        // Load the countries GeoJSON and CSV files
        d3.json("world-geo-10m.json").then(function(countriesGeo) {
            d3.csv("inflowtrial.csv").then(function(data) {
                // Create a lookup map for country coordinates from GeoJSON
                var countryCoords = {};
                countriesGeo.features.forEach(function(feature) {
                    var countryName = feature.properties.name;
                    var centroid = path.centroid(feature);
                    countryCoords[countryName] = centroid;
                });

                // Add circles for each country in the CSV
                data.forEach(function(d) {
                    var country = d['Country/year'];
                    var coords = countryCoords[country];
                    if (coords) {
                        g.append("circle")
                            .attr("cx", coords[0])
                            .attr("cy", coords[1])
                            .attr("r", 1.5) // Increased radius for better visibility
                            .attr("fill", "#EB3D00")
                            .on("mouseover", function(event) {
                                const [x, y] = d3.pointer(event, svg.node()); // Transform SVG coordinates to screen coordinates
                                tooltip.text(country)
                                       .style("visibility", "visible")
                                       .style("top", (y - 10) + "px")
                                       .style("left", (x + 10) + "px");
                            })
                            .on("mouseout", function() {
                                tooltip.style("visibility", "hidden");
                            })
                            .on("click", function () {
                                drawGraph(country);
                            });
                    }
                });
            });
        });
    });

    function zoomed() {
        g.attr("transform", d3.event.transform);
    }
}

window.onload = init;
