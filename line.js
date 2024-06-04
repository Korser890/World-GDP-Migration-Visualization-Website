function init() {
    const w = window.innerWidth * 0.6;
    const h = window.innerHeight * 0.6;
    const number_of_ticks = 20;
    const margin = {
        top: 50,
        right: 265,
        bottom: 50,
        left: 50
    };
    let selectedCountry = null;
    let transformedData = {};
    let countries = [];
    let years = new Set();
    let showBestWorst = false;
    let showTopThree = false;
    let showBotThree = false;

    d3.csv("datas/GDP_CleanFinalLine.csv").then(data => {
        data.forEach(d => {
            const country = d.Country;
            countries.push(country);
            transformedData[country] = Object.keys(d)
                .filter(key => key !== "Country")
                .map(year => ({ year: +year, value: +d[year] }));
            transformedData[country].forEach(entry => years.add(entry.year));
        });

        // Initialize the multiselect dropdown
        const select = d3.select("#country-select")
            .selectAll("option")
            .data(countries)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(countries);

        // Initialize the selectize plugin and store the instance reference
        const selectizeInstance = $('#country-select').selectize({
            plugins: ['remove_button'],
            items: countries, // Prefill with all countries
            onInitialize: function () {
                const selectize = this;
                countries.forEach(country => {
                    selectize.addItem(country);
                });
            },
            onChange: function (value) {
                if (value.length > 0) {
                    console.log("FK")
                    updateChart(value);
                }
            },

            render: {
                item: function (data, escape) {
                    const color = colorScale(data.value);
                    return `<div style="background-color:${color}; color:white;">${escape(data.text)}</div>`;
                },
                option: function (data, escape) {
                    return `<div>${escape(data.text)}</div>`;
                }
            }
        });

        const selectizeControl = selectizeInstance[0].selectize;

        // Create SVG
        const svg = d3.select("#chart").append("svg")
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${window.innerWidth * 0.05},${margin.top})`);

        const xScale = d3.scaleLinear()
            .domain(d3.extent(Array.from(years)))
            .range([0, w]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(Object.values(transformedData).flat(), d => d.value),
                d3.max(Object.values(transformedData).flat(), d => d.value)
            ])
            .range([h, 0]);

        const xAxis = d3.axisBottom(xScale).tickValues(Array.from(years)).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale).ticks(number_of_ticks);

        // Draw X Axis
        svg.append("g").attr("class", "x axis").attr("transform", `translate(0,${h})`).call(xAxis);
        // Draw Y Axis
        svg.append("g").attr("class", "y axis").call(yAxis);
        // Draw X Axis label
        svg.append("text").attr("class", "axis-label").attr("x", w / 2).attr("y", h + 40)
            .style("text-anchor", "middle").text("Year");
        // Draw Y Axis label
        svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
            .attr("x", -h / 2).attr("y", -40)
            .style("text-anchor", "middle").text("GDP (%)");

        // Dotted Line
        svg.append("line")
            .attr("class", "line halfMilMark")
            //start of line
            .attr("x1", xScale(2020))
            .attr("y1", 0)
            //end of line
            .attr("x2", xScale(2020))
            .attr("y2", h)
            .style("stroke", "red")
            // Set the line to be dotted
            .style("stroke-dasharray", "3,3");

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value));

        const tooltip = d3.select("#tooltip");

        const updateChart = (selectedCountries, highlight) => {

            svg.selectAll(".line").remove();
            // console.log("Remove")
            svg.selectAll(".label").remove();

            const selectedData = selectedCountries.flatMap(country => transformedData[country]);
            svg.select(".y.axis").transition().duration(1000).call(yAxis.scale(yScale));

            selectedCountries.forEach(country => {
                const countryData = transformedData[country];
                const path = svg.append("path")
                    .datum(countryData)
                    .attr("class", "line")
                    .attr("d", line)
                    .attr("stroke", highlight && country === highlight.bestCountry ? "green" : highlight && country === highlight.worstCountry ? "red" : colorScale(country))
                    .attr("fill", "none")
                    .attr("stroke-width", 2)
                    .style("opacity", 1);

                const totalLength = path.node().getTotalLength();

                const appendLabel = (text, x, y, color, delay) => {
                    try {
                        console.log("Append Label")
                        svg.append("text")
                            .attr("class", "label")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("fill", color)
                            .text(text)
                            .style("opacity", 0) // Start with opacity 0
                            .transition()
                            .duration(200)
                            .delay(delay) // Delay the label transition until the line is drawn
                            .style("opacity", 1); // Transition to opacity 1
                    } catch (error) {
                        console.error("Failed to append label: ", error);
                    }
                };

                path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(1000)
                    .attr("stroke-dashoffset", 0);

                path.on("mouseover", (event, d) => {
                    if (selectedCountry === country) {
                        tooltip.transition().duration(200).style("opacity", .9);
                    }
                })
                    .on("mousemove", (event, d) => {
                        if (selectedCountry === country) {
                            const year = Math.round(xScale.invert(d3.pointer(event)[0]));
                            const yearData = countryData.find(v => v.year === year);
                            if (yearData) {
                                tooltip.html(`Country: ${country}<br>Year: ${yearData.year}<br>GDP: ${yearData.value}`)
                                    .style("left", (event.pageX + 5) + "px")
                                    .style("top", (event.pageY - 28) + "px");
                            }
                        }
                    })
                    .on("mouseout", (event, d) => {
                        if (selectedCountry === country) {
                            tooltip.transition().duration(500).style("opacity", 0);
                        }
                    })
                    .on("click", function (event, d) {
                        if (selectedCountry === country) {
                            selectedCountry = null;
                            svg.selectAll(".label").remove();
                            svg.selectAll(".line")
                                .classed("dimmed", false)
                                .classed("selected", false);
                            tooltip.transition().duration(500).style("opacity", 0);
                        } else {
                            selectedCountry = country;
                            const xPos = xScale(countryData[countryData.length - 1].year) + 10;
                            // console.log(xPos)
                            const yPos = yScale(countryData[countryData.length - 1].value);
                            svg.selectAll(".label").remove();
                            appendLabel(selectedCountry, xPos, yPos, colorScale(country), 0)
                            svg.selectAll(".line")
                                .classed("dimmed", d => d !== countryData)
                                .classed("selected", d => d === countryData);
                        }
                    });

                if (highlight) {
                    const color = country === highlight.bestCountry ? "green" : country === highlight.worstCountry ? "red" : colorScale(country);
                    const xPos = xScale(countryData[countryData.length - 1].year) + 10;
                    // console.log(xPos)
                    const yPos = yScale(countryData[countryData.length - 1].value);
                    let delayForPathDraw = 850;
                    if (country === highlight.bestCountry) {
                        appendLabel(`${country} (GDP: ${highlight.bestGain})`, xPos, yPos, color, delayForPathDraw);
                    } else if (country === highlight.worstCountry) {
                        appendLabel(`${country} (GDP: ${highlight.worstLoss})`, xPos, yPos, color, delayForPathDraw);
                    } else if (country === highlight.first) {
                        appendLabel(`${country} (GDP: ${highlight.firstScore})`, xPos, yPos, color, delayForPathDraw);
                    } else if (country === highlight.second) {
                        appendLabel(`${country} (GDP: ${highlight.secondScore})`, xPos, yPos, color, delayForPathDraw);
                    } else if (country === highlight.third) {
                        appendLabel(`${country} (GDP: ${highlight.thirdScore})`, xPos, yPos, color, delayForPathDraw);
                    }
                }
            });
        };

        // Functions for the buttons

        const calculateBestAndWorst = () => {
            let bestCountry = null, worstCountry = null;
            let bestGain = -Infinity, worstLoss = Infinity;

            countries.forEach(country => {
                const countryData = transformedData[country];
                const gain = countryData[countryData.length - 1].value - countryData[0].value;
                if (gain > bestGain) {
                    bestGain = gain.toFixed(1);
                    bestCountry = country;
                }
                if (gain < worstLoss) {
                    worstLoss = gain.toFixed(1);
                    worstCountry = country;
                }
            });

            return { bestCountry, worstCountry, bestGain, worstLoss };
        };

        const calculateTopThree = () => {
            let topThree = countries.map(country => {
                const countryData = transformedData[country];
                const score = countryData[countryData.length - 1].value;
                return { country, score };
            }).sort((a, b) => b.score - a.score).slice(0, 3);

            let [first, second, third] = topThree.map(d => d.country);
            let [firstScore, secondScore, thirdScore] = topThree.map(d => d.score);
            return { first, second, third, firstScore, secondScore, thirdScore };
        };

        const calculateBottomThree = () => {
            let bottomThree = countries.map(country => {
                const countryData = transformedData[country];
                const score = countryData[countryData.length - 1].value;
                return { country, score };
            }).sort((a, b) => a.score - b.score).slice(0, 3);

            let [first, second, third] = bottomThree.map(d => d.country);
            let [firstScore, secondScore, thirdScore] = bottomThree.map(d => d.score);

            return { first, second, third, firstScore, secondScore, thirdScore };
        };

        const best_worst_gain_button = d3.select("#show-best-worst");
        const top_three_button = d3.select("#show-top-three");
        const bot_three_button = d3.select("#show-bot-three");

        d3.select("#show-best-worst").on("click", () => {
            best_worst_gain_button.classed("clicked", !best_worst_gain_button.classed("clicked"));
            top_three_button.classed("clicked", false);
            bot_three_button.classed("clicked", false);

            showBestWorst = !showBestWorst;
            showTopThree = false;
            showBotThree = false;
            if (showBestWorst) {
                console.log("TEst")
                const { bestCountry, worstCountry, bestGain, worstLoss } = calculateBestAndWorst();
                selectizeControl.clear();
                selectizeControl.addItems([bestCountry, worstCountry]);
                updateChart([bestCountry, worstCountry], { bestCountry, worstCountry, bestGain, worstLoss });
            } else {
                console.log("untest")
                selectizeControl.addItems(countries);
                updateChart(countries);
                d3.select("#info").html('');
            }
        });

        d3.select("#show-top-three").on("click", () => {
            best_worst_gain_button.classed("clicked", false);
            top_three_button.classed("clicked", !top_three_button.classed("clicked"));
            bot_three_button.classed("clicked", false);

            showBestWorst = false;
            showTopThree = !showTopThree;
            showBotThree = false;
            if (showTopThree) {
                const { first, second, third, firstScore, secondScore, thirdScore } = calculateTopThree();
                selectizeControl.clear();
                selectizeControl.addItems([first, second, third]);
                updateChart([first, second, third], { first, second, third, firstScore, secondScore, thirdScore });
            } else {
                selectizeControl.clear();
                selectizeControl.addItems(countries);
                updateChart(countries);
                d3.select("#info").html('');
            }
        });

        d3.select("#show-bot-three").on("click", () => {
            best_worst_gain_button.classed("clicked", false);
            top_three_button.classed("clicked", false);
            bot_three_button.classed("clicked", !bot_three_button.classed("clicked"));

            showBestWorst = false;
            showTopThree = false;
            showBotThree = !showBotThree;
            if (showBotThree) {
                const { first, second, third, firstScore, secondScore, thirdScore } = calculateBottomThree();
                selectizeControl.clear();
                selectizeControl.addItems([first, second, third]);
                updateChart([first, second, third], { first, second, third, firstScore, secondScore, thirdScore });
            } else {
                selectizeControl.clear();
                selectizeControl.addItems(countries);
                updateChart(countries);
                d3.select("#info").html('');
            }
        });

        svg.append("rect")
            .attr("width", w)
            .attr("height", h)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("click", function () {
                if (selectedCountry) {
                    selectedCountry = null;
                    svg.selectAll(".line").classed("dimmed", false).classed("selected", false);
                    svg.selectAll(".label").remove();
                }
            });

        updateChart(countries);
    });
}

window.onload = init;
