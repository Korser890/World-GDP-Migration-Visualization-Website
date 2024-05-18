function init() {
    // Set up the SVG canvas dimensions
    var w = 700; // width of svg canvas
    var h = 500; // height of svg canvas
    var margin = {top: 20, right: 30, bottom: 100, left: 60}; // margin for axis and labels
    var width = w - margin.left - margin.right; // width for the chart
    var height = h - margin.top - margin.bottom; // height for the chart

    var svg = d3.select("#chart")
                .append("svg")
                .attr("width", w)
                .attr("height", h)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Function to draw the chart based on the selected year
    function drawChart(year) {
        d3.csv("inflowtrial.csv").then(function(data) {
            var dataForYear = data.map(function(d) {
                return {
                    country: d['Country/year'],
                    value: +d[year]
                };
            });

            // Set the xscale
            var xScale = d3.scaleBand()
                .domain(dataForYear.map(function(d) { 
                    return d.country; 
                }))
                .rangeRound([0, width])
                .paddingInner(0.1);

            // Set the yscale
            var yScale = d3.scaleLinear()
                .domain([0, d3.max(dataForYear, function(d) { 
                    return d.value; 
                })])
                .rangeRound([height, 0]);

            // Clear previous bars
            svg.selectAll(".bar").remove();
            svg.selectAll(".axis").remove();

            // Add the x-axis to the SVG
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-45)") // so it fits nicely
                .style("text-anchor", "end");

            // Add the y-axis to the SVG
            svg.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale));

            // Create the bars
            svg.selectAll(".bar")
                .data(dataForYear)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { 
                    return xScale(d.country); 
                })
                .attr("y", function(d) { 
                    return yScale(d.value); 
                })
                .attr("width", xScale.bandwidth())
                .attr("height", function(d) { 
                    return height - yScale(d.value); 
                });
        }).catch(function(error) {
            console.error('Error loading or processing data:', error);
        });
    }

    // Populate the year dropdown
    var years = d3.range(2010, 2022); // range of years from 2010 to 2021
    var dropdown = d3.select("#year-select");

    dropdown.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    // Set up the event listener for the dropdown
    dropdown.on("change", function() {
        var selectedYear = d3.select(this).property("value");
        drawChart(selectedYear);
    });

    // Draw the initial chart with the first year
    drawChart(years[0]);
}

window.onload = init;
