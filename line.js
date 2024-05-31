function init() {
    const w = window.innerWidth * 0.7, h = window.innerHeight * 0.7, number_of_ticks = 20;
    const margin = { top: window.innerHeight * 0.05, right: window.innerWidth - w, bottom: window.innerHeight * 0.05, left: window.innerWidth * 0.05 };

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

        const svg = d3.select("#chart").append("svg")
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleLinear()
            .domain(d3.extent(Array.from(years)))
            .range([0, w]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(Object.values(transformedData).flat(), d => d.value),
                d3.max(Object.values(transformedData).flat(), d => d.value)
            ])
            .range([h, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(countries);

        const xAxis = d3.axisBottom(xScale).tickValues(Array.from(years)).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale).ticks(number_of_ticks);

        //draw X Axis
        svg.append("g").attr("class", "x axis").attr("transform", `translate(0,${h})`).call(xAxis);
        //draw y Axis
        svg.append("g").attr("class", "y axis").call(yAxis);
        //draw x axis label
        svg.append("text").attr("class", "axis-label").attr("x", w / 2).attr("y", h + margin.bottom - 5)
            .style("text-anchor", "middle").text("Year");
        //draw y axis label
        svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
            .attr("x", -h / 2).attr("y", -margin.left + 15)
            .style("text-anchor", "middle").text("GDP (%)");

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value));

        const tooltip = d3.select("#tooltip");

        const updateChart = (selectedCountries, highlight) => {
            svg.selectAll(".line").remove();
            svg.selectAll(".label").remove();

            // Calculate new y-axis domain based on selected countries' data
            const selectedData = selectedCountries.flatMap(country => transformedData[country]);
            const newYDomain = [
                d3.min(selectedData, d => d.value),
                d3.max(selectedData, d => d.value)
            ];

            yScale.domain(newYDomain);
            // Update the y-axis with the new domain
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
                    .style("opacity", 1); // Ensure the line is visible

                // Get the total length of the path
                const totalLength = path.node().getTotalLength();

                // Set up the line's initial state for the transition
                path.attr("stroke-dasharray", `${totalLength} ${totalLength}`) // Set dash pattern
                    .attr("stroke-dashoffset", totalLength) // Hide the entire path
                    .transition()
                    .duration(1000) // Transition duration: 1 second
                    .attr("stroke-dashoffset", 0); // Draw the path from left to right

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
                        // event.stopPropagation();
                        if (selectedCountry === country) {
                            selectedCountry = null;
                            svg.selectAll(".line")
                                .classed("dimmed", false)
                                .classed("selected", false);
                            tooltip.transition().duration(500).style("opacity", 0);
                        } else {
                            selectedCountry = country;
                            console.log("click")
                            svg.selectAll(".line")
                                .classed("dimmed", d => d !== countryData)
                                .classed("selected", d => d === countryData);
                        }
                    });

                const appendLabel = (text, x, y, color) => {
                    svg.append("text")
                        .attr("class", "label")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("fill", color)
                        .text(text)
                        .style("opacity", 0) // Start with opacity 0
                        .transition()
                        .duration(200)
                        .delay(1000) // Delay the label transition until the line is drawn
                        .style("opacity", 1); // Transition to opacity 1
                };

                if (highlight) {
                    const color = country === highlight.bestCountry ? "green" : country === highlight.worstCountry ? "red" : colorScale(country);
                    const xPos = xScale(countryData[countryData.length - 1].year) + 5;
                    const yPos = yScale(countryData[countryData.length - 1].value);

                    if (country === highlight.bestCountry) {
                        appendLabel(`Best Gain: ${country} (Gain: ${highlight.bestGain})`, xPos, yPos, color);
                    } else if (country === highlight.worstCountry) {
                        appendLabel(`Worst Loss: ${country} (Loss: ${highlight.worstLoss})`, xPos, yPos, color);
                    } else if (country === highlight.first) {
                        appendLabel(`${country} (GDP: ${highlight.firstScore})`, xPos, yPos, color);
                    } else if (country === highlight.second) {
                        appendLabel(`${country} (GDP: ${highlight.secondScore})`, xPos, yPos, color);
                    } else if (country === highlight.third) {
                        appendLabel(`${country} (GDP: ${highlight.thirdScore})`, xPos, yPos, color);
                    }
                }

                // if (highlight) {
                //     const color = country === highlight.bestCountry ? "green" : country === highlight.worstCountry ? "red" : colorScale(country);

                //     if (country === highlight.bestCountry) {
                //         svg.append("text")
                //             .attr("class", "label")
                //             .attr("x", xScale(countryData[countryData.length - 1].year) + 5)
                //             .attr("y", yScale(countryData[countryData.length - 1].value))
                //             .attr("fill", color)
                //             .text(`Best Gain: ${country} (Gain: ${highlight.bestGain})`)
                //             .style("opacity", 0) // Start with opacity 0
                //             .transition()
                //             .duration(200)
                //             .delay(1000) // Delay the label transition until the line is drawn
                //             .style("opacity", 1); // Transition to opacity 1
                //     } else if (country === highlight.worstCountry) {
                //         svg.append("text")
                //             .attr("class", "label")
                //             .attr("x", xScale(countryData[countryData.length - 1].year) + 5)
                //             .attr("y", yScale(countryData[countryData.length - 1].value))
                //             .attr("fill", color)
                //             .text(`Worst Loss: ${country} (Loss: ${highlight.worstLoss})`)
                //             .style("opacity", 0) // Start with opacity 0
                //             .transition()
                //             .duration(200)
                //             .delay(1000) // Delay the label transition until the line is drawn
                //             .style("opacity", 1); // Transition to opacity 1
                //     } else if (country === highlight.first) {
                //         svg.append("text")
                //             .attr("class", "label")
                //             .attr("x", xScale(countryData[countryData.length - 1].year) + 5)
                //             .attr("y", yScale(countryData[countryData.length - 1].value))
                //             .attr("fill", color)
                //             .text(`${country} (GDP: ${highlight.firstScore})`)
                //             .style("opacity", 0) // Start with opacity 0
                //             .transition()
                //             .duration(200)
                //             .delay(1000) // Delay the label transition until the line is drawn
                //             .style("opacity", 1); // Transition to opacity 1
                //     } else if (country === highlight.second) {
                //         svg.append("text")
                //             .attr("class", "label")
                //             .attr("x", xScale(countryData[countryData.length - 1].year) + 5)
                //             .attr("y", yScale(countryData[countryData.length - 1].value))
                //             .attr("fill", color)
                //             .text(`${country} (GDP: ${highlight.secondScore})`)
                //             .style("opacity", 0) // Start with opacity 0
                //             .transition()
                //             .duration(200)
                //             .delay(1000) // Delay the label transition until the line is drawn
                //             .style("opacity", 1); // Transition to opacity 1
                //     } else if (country === highlight.third) {
                //         svg.append("text")
                //             .attr("class", "label")
                //             .attr("x", xScale(countryData[countryData.length - 1].year) + 5)
                //             .attr("y", yScale(countryData[countryData.length - 1].value))
                //             .attr("fill", color)
                //             .text(`${country} (GDP: ${highlight.thirdScore})`)
                //             .style("opacity", 0) // Start with opacity 0
                //             .transition()
                //             .duration(200)
                //             .delay(1000) // Delay the label transition until the line is drawn
                //             .style("opacity", 1); // Transition to opacity 1
                //     }
                // }
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
                    bestGain = gain.toFixed(1); //Round to 1 decimal point
                    bestCountry = country;
                }
                if (gain < worstLoss) {
                    worstLoss = gain.toFixed(1); //Round to 1 decimal point
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

            // console.log(first, firstScore);
            // console.log(second, secondScore);
            // console.log(third, thirdScore);

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

            // console.log(first, firstScore);
            // console.log(second, secondScore);
            // console.log(third, thirdScore);

            return { first, second, third, firstScore, secondScore, thirdScore };
        };
        const best_worst_gain_button = d3.select("#show-best-worst");
        const top_three_button = d3.select("#show-top-three");
        const bot_three_button = d3.select("#show-bot-three");
        d3.select("#show-best-worst").on("click", () => {
            // Remove "clicked" class from other buttons
            best_worst_gain_button.classed("clicked", !best_worst_gain_button.classed("clicked")); // Toggle 'clicked' class
            top_three_button.classed("clicked", false);
            bot_three_button.classed("clicked", false);
            // top_three_button.classed("clicked", !top_three_button.classed("clicked")); // Toggle 'clicked' class

            showBestWorst = !showBestWorst;
            showTopThree = false;
            showBotThree = false;
            if (showBestWorst) {
                const { bestCountry, worstCountry, bestGain, worstLoss } = calculateBestAndWorst();
                updateChart([bestCountry, worstCountry], { bestCountry, worstCountry, bestGain, worstLoss });
            } else {
                updateChart(countries);
                d3.select("#info").html('');
            }
        });
        d3.select("#show-top-three").on("click", () => {
            // const button = d3.select("#show-top-three");
            best_worst_gain_button.classed("clicked", false);
            top_three_button.classed("clicked", !top_three_button.classed("clicked")); // Toggle 'clicked' class
            bot_three_button.classed("clicked", false);

            showBestWorst = false;
            showTopThree = !showTopThree;
            showBotThree = false;
            if (showTopThree) {
                const { first, second, third, firstScore, secondScore, thirdScore } = calculateTopThree();
                updateChart([first, second, third], { first, second, third, firstScore, secondScore, thirdScore });
            } else {
                updateChart(countries);
                d3.select("#info").html('');
            }
        });
        d3.select("#show-bot-three").on("click", () => {
            // const button = d3.select("#show-bot-three");
            best_worst_gain_button.classed("clicked", false);
            top_three_button.classed("clicked", false);
            bot_three_button.classed("clicked", !bot_three_button.classed("clicked")); // Toggle 'clicked' class

            showBestWorst = false;
            showTopThree = false;
            showBotThree = !showBotThree;
            if (showBotThree) {
                const { first, second, third, firstScore, secondScore, thirdScore } = calculateBottomThree();
                updateChart([first, second, third], { first, second, third, firstScore, secondScore, thirdScore });
            } else {
                updateChart(countries);
                d3.select("#info").html('');
            }
        });

        // Click out of the path to remove the selection function
        svg.append("rect")
            .attr("width", w)
            .attr("height", h)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("click", function () {
                if (selectedCountry) {
                    selectedCountry = null;
                    svg.selectAll(".line").classed("dimmed", false).classed("selected", false);
                }
            });

        updateChart(countries);
    });
}

window.onload = init;
