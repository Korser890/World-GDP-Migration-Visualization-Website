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

    // Fixed maximum value for the y-axis
    var maxYValue = 13000;

    // Function to initialize the chart
    function initializeChart(countries) {
        // Set the x-scale with all unique countries
        var xScale = d3.scaleBand()
            .domain(countries)
            .rangeRound([0, width])
            .paddingInner(0.1);

        // Set the y-scale with a fixed domain
        var yScale = d3.scaleLinear()
            .domain([0, maxYValue])
            .rangeRound([height, 0]);

        // Add the x-axis to the SVG once
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)") // so it fits nicely
            .style("text-anchor", "end");

        // Add the y-axis to the SVG once
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale));

        return { xScale, yScale };
    }

    // Function to draw the chart based on the selected year
    function drawChart(year, scales) {
        d3.csv("inflowtrial.csv").then(function(data) {
            var dataForYear = data.map(function(d) {
                return {
                    country: d['Country/year'],
                    value: +d[year]
                };
            });

            var xScale = scales.xScale;
            var yScale = scales.yScale;

            // Bind the data to the bars
            var bars = svg.selectAll(".bar")
                .data(dataForYear, function(d) { return d.country; });

            // Handle the exiting bars
            bars.exit().transition()
                .duration(1000) // Transition duration
                .ease(d3.easeCubicOut) // Easing function
                .attr("y", height) // Transition to y position at the bottom
                .attr("height", 0) // Transition height to 0
                .remove();

            // Handle the updating bars
            bars.transition()
                .duration(1000) // Transition duration
                .ease(d3.easeCubicOut) // Easing function
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

            // Handle the entering bars
            bars.enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { 
                    return xScale(d.country); 
                })
                .attr("y", height) // Initial y position at the bottom
                .attr("width", xScale.bandwidth())
                .attr("height", 0) // Initial height of 0
                .transition()
                .duration(1000) // Transition duration
                .ease(d3.easeCubicOut) // Easing function
                .attr("y", function(d) { 
                    return yScale(d.value); 
                })
                .attr("height", function(d) { 
                    return height - yScale(d.value); 
                });

            // Add text labels
            var labels = svg.selectAll(".label")
                .data(dataForYear, function(d) { return d.country; });

            // Handle the exiting labels
            labels.exit().transition()
                .duration(1000) // Transition duration
                .ease(d3.easeCubicOut) // Easing function
                .attr("y", height) // Transition to y position at the bottom
                .attr("height", 0) // Transition height to 0
                .remove();

            // Handle the updating labels
            labels.transition()
                .duration(1000) // Transition duration
                .ease(d3.easeCubicOut) // Easing function
                .attr("x", function(d) { 
                    return xScale(d.country) + xScale.bandwidth() / 2; 
                })
                .attr("y", function(d) { 
                    return yScale(d.value) - 5; 
                })
                .text(function(d) { 
                    return d.value; 
                });

            // Handle the entering labels
            labels.enter().append("text")
                .attr("class", "label")
                .attr("x", function(d) { 
                    return xScale(d.country) + xScale.bandwidth() / 2; 
                })
                .attr("y", height) // Initial y position at the bottom
                .attr("text-anchor", "middle")
                .text(function(d) { 
                    return d.value; 
                })
                .transition()
                .duration(1000) // Transition duration
                .ease(d3.easeCubicOut) // Easing function
                .attr("y", function(d) { 
                    return yScale(d.value) - 5; 
                });
        }).catch(function(error) {
            console.error('Error loading or processing data:', error);
        });
    }

    // Load the dataset initially to get all unique countries and initialize the chart
    d3.csv("inflowtrial.csv").then(function(data) {
        var allCountries = Array.from(new Set(data.map(function(d) {
            return d['Country/year'];
        })));

        // Initialize the chart and get the scales
        var scales = initializeChart(allCountries);

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
            drawChart(selectedYear, scales);
        });

        // Draw the initial chart with the first year
        drawChart(years[0], scales);
    });
}

window.onload = init;
