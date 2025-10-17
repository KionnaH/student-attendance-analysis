//Kionna Taylor & Michael Valenzuela
//Description of the D3.js Code for Visualizing Student Absenteeism
//  This D3.js code visualizes student absenteeism data using two charts:
//      - a histogram showing total absences by season
//      - a bar chart comparing absences during the flu season vs. non-flu season.
//  The charts provide insights into seasonal trends in student attendance and highlight periods of increased absenteeism.

const dataPath = "Daily Attendance Trends.csv";

const seasons = { spring:[3,4,5], summer:[6,7,8], fall:[9,10,11], winter:[12,1,2] };

const parseYMD = d3.timeParse("%Y-%m-%d");
const parseCompact = d3.timeParse("%Y%m%d");
const parseDateFlexible = (s) => (s ? (parseYMD(s) || parseCompact(s) || (isNaN(new Date(s)) ? null : new Date(s))) : null);
const toNumber = (v) => (Number.isFinite(+v) ? +v : 0);
const inSeason = (m, arr) => arr.includes(m);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("padding", "8px 10px")
  .style("background", "rgba(15,23,42,.92)")
  .style("color", "#fff")
  .style("border-radius", "10px")
  .style("font-size", "12px")
  .style("opacity", 0);

d3.csv(dataPath, (d) => {
  const dateRaw = d.Date ?? d.date ?? d.DATE;
  return {
    schoolDBN: d["School DBN"] ?? d.schoolDBN ?? "",
    date: parseDateFlexible(dateRaw),
    enrolled: toNumber(d.Enrolled ?? d.enrolled ?? d.ENROLLED),
    absent: toNumber(d.Absent ?? d.absent ?? d.ABSENT),
    present: toNumber(d.Present ?? d.present ?? d.PRESENT)
  };
}).then((rows) => {
  const data = rows.filter(r => r.date instanceof Date && !isNaN(r.date));
  if (!data.length) {
    const s = document.getElementById("status-message");
    if (s) s.textContent = "No valid data found. Verify CSV filename, headers, and date format.";
    return;
  }

  const seasonAbsences = { spring:0, summer:0, fall:0, winter:0 };
  const fluSeasonAbsences = { fluSeason:0, nonFluSeason:0 };

  data.forEach((d) => {
    const m = d.date.getMonth() + 1;
    if      (inSeason(m, seasons.spring)) seasonAbsences.spring += d.absent;
    else if (inSeason(m, seasons.summer)) seasonAbsences.summer += d.absent;
    else if (inSeason(m, seasons.fall))   seasonAbsences.fall   += d.absent;
    else                                  seasonAbsences.winter += d.absent;

    if (inSeason(m, seasons.fall) || inSeason(m, seasons.winter)) fluSeasonAbsences.fluSeason += d.absent;
    else                                                          fluSeasonAbsences.nonFluSeason += d.absent;
  });

  const histogramData = [
    { season:"Spring", value:seasonAbsences.spring },
    { season:"Summer", value:seasonAbsences.summer },
    { season:"Fall",   value:seasonAbsences.fall   },
    { season:"Winter", value:seasonAbsences.winter }
  ];
  const barChartData = [
    { label:"Flu Season",     value:fluSeasonAbsences.fluSeason },
    { label:"Non-Flu Season", value:fluSeasonAbsences.nonFluSeason }
  ];

  const margin = { top:64, right:32, bottom:56, left:96 };
  const width  = 600 - margin.left - margin.right;
  const height = 340 - margin.top - margin.bottom;

  // ===== Seasonal chart =====
  {
    const maxY = (d3.max(histogramData, d => d.value) || 0) * 1.15;
    const x = d3.scaleBand().domain(histogramData.map(d => d.season)).range([0, width]).padding(0.15);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([height, 0]);

    const svg = d3.select("#histogram").html("")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y).ticks(8).tickFormat(d3.format(",d")));

    svg.selectAll(".bar")
      .data(histogramData).enter().append("rect")
      .attr("class","bar")
      .attr("x", d => x(d.season))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.value))
      .on("mousemove", (event, d) => {
        tooltip.style("opacity",1)
          .html(`<strong>${d.season}</strong><br>Absences: ${d.value.toLocaleString()}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top",  (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity",0));

    svg.append("text")
      .attr("x", width/2)
      .attr("y", -18)
      .attr("text-anchor","middle")
      .attr("class","chart-title")
      .text("Total Absences by Season");

    svg.selectAll(".label")
      .data(histogramData).enter().append("text")
      .attr("class","label")
      .attr("text-anchor","middle")
      .style("font-size","12px")
      .attr("x", d => x(d.season) + x.bandwidth()/2)
      .attr("y", d => Math.max(14, y(d.value) - 8))
      .text(d => d.value.toLocaleString());
  }

  // ===== Flu vs Non-Flu chart =====
  {
    const maxY = (d3.max(barChartData, d => d.value) || 0) * 1.15;
    const x = d3.scaleBand().domain(barChartData.map(d => d.label)).range([0, width]).padding(0.25);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([height, 0]);

    const svg = d3.select("#bar-chart").html("")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y).ticks(8).tickFormat(d3.format(",d")));

    const bars = svg.selectAll(".bar2")
      .data(barChartData).enter().append("rect")
      .attr("class","bar2")
      .attr("x", d => x(d.label))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.value))
      .on("mousemove", (event, d) => {
        tooltip.style("opacity",1)
          .html(`<strong>${d.label}</strong><br>Absences: ${d.value.toLocaleString()}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top",  (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity",0));

    svg.append("text")
      .attr("x", width/2)
      .attr("y", -18)
      .attr("text-anchor","middle")
      .attr("class","chart-title")
      .text("Absences: Flu Season vs Non-Flu Season");

    svg.selectAll(".label2")
      .data(barChartData).enter().append("text")
      .attr("class","label2")
      .attr("text-anchor","middle")
      .style("font-size","12px")
      .attr("x", d => x(d.label) + x.bandwidth()/2)
      .attr("y", d => Math.max(14, y(d.value) - 8))
      .text(d => d.value.toLocaleString());
  }
}).catch(() => {
  const s = document.getElementById("status-message");
  if (s) s.textContent = "Failed to load CSV. Open with Live Server and check the CSV filename/path.";
});