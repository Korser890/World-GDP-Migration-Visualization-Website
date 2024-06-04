var barMargin = { top: 30, right: 30, bottom: 70, left: 60 },
    barWidth = (window.innerHeight * 0.65)  - barMargin.left - barMargin.right,
    barHeight = (window.innerHeight * 0.7)  - barMargin.top - barMargin.bottom;
    
function initializeChart(years, country) {

    var barSvg = d3.select("#chart")
        .append("svg")
        .attr("id", "bar-svg")  // Add an ID to the bar chart's SVG
        .attr("width", barWidth + barMargin.left + barMargin.right)
        .attr("height", barHeight + barMargin.top + barMargin.bottom)
        .attr("class", "dotted-border")
        .append("g")
        .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")");

    // Add country label
    barSvg.append("text")
        .attr("id", "country-label")
        .attr("x", barWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Inflow of Foreign Doctors to " + country);

    var xScale = d3.scaleBand()
        .domain(years)
        .range([0, barWidth])
        .padding(0.2);

    var yScale = d3.scaleLinear()
        .domain([0, 13000])
        .range([barHeight, 0]);

    barSvg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + barHeight + ")")
        .style("font-size", "16px")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    barSvg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale))
        .style("font-size", "16px");

    return { barSvg, xScale, yScale, barHeight, barWidth, barMargin };
}

function updateChart(country, scales, years, values) {
    var xScale = scales.xScale;
    var yScale = scales.yScale;
    var barSvg = scales.barSvg;
    var barHeight = scales.barHeight;

    // Update country label
    barSvg.select("#country-label")
        .text("Inflow of Foreign Doctors to " + country)
        .attr("id", "country-label");

    var bars = barSvg.selectAll(".bar")
        .data(values);

    bars.exit().transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("y", barHeight)
        .attr("height", 0)
        .remove();

    bars.transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("x", function (d, i) { return xScale(years[i]); })
        .attr("y", function (d) { return yScale(d); })
        .attr("width", xScale.bandwidth())
        .attr("height", function (d) { return barHeight - yScale(d); });

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d, i) { return xScale(years[i]); })
        .attr("y", barHeight)
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("y", function (d) { return yScale(d); })
        .attr("height", function (d) { return barHeight - yScale(d); });

    var labels = barSvg.selectAll(".label")
        .data(values);

    labels.exit().transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("y", barHeight)
        .attr("height", 0)
        .remove();

    labels.transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("x", function (d, i) { return xScale(years[i]) + xScale.bandwidth() / 2; })
        .attr("y", function (d) { return yScale(d) - 5; })
        .text(function (d) { return d === 0 ? "N/A" : d; });

    labels.enter().append("text")
        .attr("class", "label")
        .attr("x", function (d, i) { return xScale(years[i]) + xScale.bandwidth() / 2; })
        .attr("y", barHeight)
        .attr("text-anchor", "middle")
        .text(function (d) { return d === 0 ? "N/A" : d; })
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("y", function (d) { return yScale(d) - 5; });
}

function drawGraph(country) {
    d3.csv("datas/inflowupdate.csv").then(function (data) {
        var countryData = data.filter(function (d) { return d["Country/year"] === country; })[0];
        var years = Object.keys(countryData).filter(function (key) { return key !== "Country/year"; });
        var values = years.map(function (year) { return +countryData[year]; });

        if (d3.select("#bar-svg").empty()) {
            var scales = initializeChart(years, country);
        } else {
            var scales = {
                barSvg: d3.select("#bar-svg g"),
                xScale: d3.scaleBand().domain(years).range([0, barWidth]).padding(0.2),
                yScale: d3.scaleLinear().domain([0, 13000]).range([barHeight, 0]),
                barWidth : barWidth,
                barHeight: barHeight
            };
        }

        updateChart(country, scales, years, values);
    });
}

// Call drawGraph with "Australia" when the window loads
window.addEventListener('load', function () {
    drawGraph("Australia");
});
