function init() {
    var w = window.innerWidth * 0.5; // width of the SVG
    var h = window.innerHeight * 0.65; // height of the SVG
    var margin = { top: 30, right: 30, bottom: 0, left: 30 };

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
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.bottom + margin.top)
        .attr("id", "double-border");

    const g = svg.append('g');

    svg.call(zoom);

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")

    d3.json("world-geo-10m.json").then(function (world) {
        d3.csv("datas/inflowupdate.csv").then(function (data) {
            function updateMap(year) {
                var inflowYear = {};
                data.forEach(function (d) {
                    inflowYear[d['Country/year']] = +d[year];
                });

                var thresholds = [0, 101, 501, 1001, 2001, 3001, 5001, 8001, 10001];
                var colors = ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'];

                var colorScale = d3.scaleThreshold()
                    .domain(thresholds)
                    .range(colors);

                g.selectAll("path")
                    .data(world.features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", function (d) {
                        const countryName = d.properties && d.properties.name ? d.properties.name : null;
                        //    console.log("Country Name: ", countryName); // Debugging line
                        return countryName && inflowYear[countryName] !== undefined ? colorScale(inflowYear[countryName]) : "#e5d6bd";
                    })
                    .attr("stroke", function (d) {
                        const countryName = d.properties && d.properties.name ? d.properties.name : null;
                        return countryName && inflowYear[countryName] !== undefined ? "black" : "white";
                    })
                    .attr("stroke-width", 0.3)
                    .on("mouseout", function (d) {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    })
                    .on("click", function (d) {
                        const countryName = d.properties && d.properties.name ? d.properties.name : null;
                        if (countryName && inflowYear[countryName] !== undefined) {
                            drawGraph(countryName);
                            // console.log("testclick");
                        }
                    })
                    .on("mouseover", function (d) {
                        const countryName = d.properties && d.properties.name ? d.properties.name : null;
                        if (countryName) {
                            var centroid = path.centroid(d); // Calculate the centroid of the country
                            var bounds = path.bounds(d); // Get the bounding box of the country
                            var width = bounds[1][0] - bounds[0][0]; // Calculate the width of the bounding box
                            var height = bounds[1][1] - bounds[0][1]; // Calculate the height of the bounding box
                            var area = width * height; // Calculate the area of the bounding box
                            var fontSize = Math.max(3, Math.min(12, Math.sqrt(area) / 10)); // Dynamic font size calculation

                            g.append("text")
                                .attr("class", "country-label")  // Assign a class for styling and easy removal
                                .attr("x", centroid[0])
                                .attr("y", centroid[1])
                                .attr("text-anchor", "middle")  // Center the text at the centroid
                                .attr("alignment-baseline", "central")
                                .style("font-size", fontSize + "px")  // Adjust font size dynamically
                                .style("font-weight", "bold")
                                .style("fill", "black")  // Text color
                                .text(countryName);
                        }
                    })

                    .on("mouseout", function () {
                        g.select(".country-label").remove();  // Remove the text label on mouseout
                    });

                var legendWidth = 1000;
                var legendHeight = 20;
                var legendItemWidth = legendWidth / colors.length;
                

                var legendSvg = svg.selectAll(".legend")
                    .data([null])
                    .join("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + (w - legendWidth - 20) + "," + (h - 40) + ")");

                legendSvg.selectAll("rect")
                    .data(thresholds)
                    .join("rect")
                    .attr("width", legendItemWidth)
                    .attr("height", legendHeight)
                    .attr("x", (d, i) => i * legendItemWidth)
                    .attr("fill", (d, i) => colors[i]);

                var legendScale = d3.scaleBand()
                    .domain(thresholds)
                    .range([0, legendWidth])
                    .padding(0);

                var legendAxis = d3.axisBottom(legendScale)
                    .tickValues(thresholds)
                    .tickSize(6)
                    .tickFormat((d, i) => {
                        if (i === thresholds.length - 1) {
                            return `${thresholds[i]}+`;
                        } else {
                            return `${thresholds[i]}-${thresholds[i + 1] - 1}`;
                        }
                    });

                legendSvg.selectAll(".legend-axis")
                    .data([null])
                    .join("g")
                    .attr("class", "legend-axis")
                    .attr("transform", "translate(0," + legendHeight + ")")
                    .call(legendAxis)
                    .style("font-size", "16px");



            }

            updateMap("2017");

            d3.select("#year-slider").on("input", function () {
                var selectedYear = this.value;
                d3.select("#selected-year").text(selectedYear);
                updateMap(selectedYear);
            });
        });
    });

    function zoomed() {
        g.attr("transform", d3.event.transform);
    }
}

window.onload = init;
