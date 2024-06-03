function init() {
    var w = 700; // width of the SVG
    var h = 500; // height of the SVG

    var projection = d3.geoNaturalEarth1()
                       .center([0, 0])
                       .translate([w / 2, h / 2])
                       .scale(125);

    var path = d3.geoPath()
                 .projection(projection);

    var zoom = d3.zoom()
                .scaleExtent([1, 8])
                .translateExtent([[0, 0], [w, h]])
                .on("zoom", zoomed);

    var svg = d3.select("#map")
                .append("svg")
                .attr("width", w)
                .attr("height", h)
                .attr("id", "double-border");

    const g = svg.append('g');

    svg.call(zoom);

    var tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")

    d3.json("world-geo-10m.json").then(function(world) {
        d3.csv("datas/inflowupdate.csv").then(function(data) {
            function updateMap(year) {
                var inflowYear = {};
                data.forEach(function(d) {
                    inflowYear[d['Country/year']] = +d[year];
                });

                var minInflow = d3.min(data, function(d) { return +d[year]; });
                var maxInflow = 13000;

                var colorScale = d3.scaleLinear()
                                   .domain([minInflow, maxInflow])
                                   .range(["#FFE5D1", "#EB3D00"]);

                g.selectAll("path")
                    .data(world.features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", function(d) {
                       const countryName = d.properties && d.properties.name ? d.properties.name : null;
                       console.log("Country Name: ", countryName); // Debugging line
                       return countryName && inflowYear[countryName] !== undefined ? colorScale(inflowYear[countryName]) : "#e5d6bd";
                   })
                    .attr("stroke", function(d) {
                       const countryName = d.properties && d.properties.name ? d.properties.name : null;
                       return countryName && inflowYear[countryName] !== undefined ? "black" : "white";
                   })
                    .attr("stroke-width", 0.1)
                    .on("mouseout", function(d) {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    })
                    .on("click", function(d) {
                        const countryName = d.properties && d.properties.name ? d.properties.name : null;
                        if (countryName && inflowYear[countryName] !== undefined) {
                            drawGraph(countryName);
                            console.log("testclick");
                        }
                    })
                    .on("mouseover", function(d) {
                        var coords = d3.mouse(this); // 'this' refers to the SVG element being interacted with
                        const countryName = d.properties && d.properties.name ? d.properties.name : null;
                        if (countryName) {
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", 0.9);
                            tooltip.html(countryName)
                                .style("left", (coords[0]+100) + "px")
                                .style("top", (coords[1]+200) + "px");
                        }
                    })
                var legendWidth = 300;
                var legendHeight = 10;

                var legendSvg = svg.selectAll(".legend")
                    .data([null])
                    .join("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + (w - legendWidth - 20) + "," + (h - 40) + ")");

                var gradient = legendSvg.selectAll("defs")
                    .data([null])
                    .join("defs")
                    .append("linearGradient")
                    .attr("id", "legend-gradient")
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "0%");

                gradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#FFE5D1");

                gradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#EB3D00");

                legendSvg.selectAll("rect")
                    .data([null])
                    .join("rect")
                    .attr("width", legendWidth)
                    .attr("height", legendHeight)
                    .style("fill", "url(#legend-gradient)");

                var legendScale = d3.scaleLinear()
                    .domain([minInflow, 13000])
                    .range([0, legendWidth]);

                var legendAxis = d3.axisBottom(legendScale)
                    .ticks(5)
                    .tickSize(6)
                    .tickFormat(d3.format(".0f"));

                legendSvg.selectAll(".legend-axis")
                    .data([null])
                    .join("g")
                    .attr("class", "legend-axis")
                    .attr("transform", "translate(0," + legendHeight + ")")
                    .call(legendAxis);
            }

            updateMap("2017");

            d3.select("#year-slider").on("input", function() {
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
