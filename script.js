// Note: Make sure correct output file path is selected & xLabel & yLabel name should be exactly same as the JSON property you want.
const arr = [];
const xLabel = "totalVolume";
const yLabel = "bridgeS";
const xViewMn = 0;
const xViewMx = 400;
const yViewMn = 0;
const yViewMx = 200;

// just set outputFilePath
fetch("./mrep/data/outputData3.json")
  .then(function (response) {
    if (response.status == 200) {
      return response.json();
    }
  })
  .then(function (jsonData) {
    arr.push([xLabel, yLabel, { type: "string", role: "tooltip" }]);
    jsonData.forEach((i) =>
      arr.push([i.result[xLabel], i.result[yLabel], formatObject(i)])
    );
    drawChart();
  })
  .catch((err) => {
    console.log(err);
  });

function formatObject(obj) {
  let result = "";
  let userValue = "";

  for (const key in obj) {
    if (key === "user") {
      userValue = `user: ${obj[key]}`;
    } else if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      for (const innerKey in obj[key]) {
        result += `${innerKey}: ${obj[key][innerKey]},\n`;
      }
    } else {
      result += `${key}: ${obj[key]},\n`;
    }
  }

  result += userValue;
  return result.trim();
}

google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  data = google.visualization.arrayToDataTable(arr);

  options = {
    title: `${xLabel} vs. ${yLabel} comparison`,
    hAxis: {
      title: xLabel,
      viewWindow: { max: xViewMx, min: xViewMn },
    },
    vAxis: { title: yLabel, viewWindow: { max: yViewMx, min: yViewMn } },
    crosshair: { trigger: "both" },
    legend: "none",
    tooltip: { isHtml: true, trigger: "none" }, // Disable default tooltips
  };

  chart = new google.visualization.ScatterChart(
    document.getElementById("chart_div")
  );

  google.visualization.events.addListener(chart, "select", function () {
    var selection = chart.getSelection();
    if (selection.length) {
      var row = selection[0].row;
      showTooltip(row);
    }
  });

  chart.draw(data, options);
}

function showTooltip(row) {
  const tooltip = data.getValue(row, 2);
  console.log(tooltip);
  const x = data.getValue(row, 0);
  const y = data.getValue(row, 1);

  const container = document.getElementById("chart_div");
  const tooltipDiv = document.createElement("div");
  tooltipDiv.className = "custom-tooltip";
  tooltipDiv.innerHTML = tooltip.replace(/\n/g, "<br>");
  tooltipDiv.style.position = "absolute";
  tooltipDiv.style.backgroundColor = "white";
  tooltipDiv.style.border = "1px solid black";
  tooltipDiv.style.padding = "5px";
  tooltipDiv.style.pointerEvents = "none"; // Ensure tooltips don't interfere with clicks

  // Position the tooltip
  const chartArea = container
    .getElementsByTagName("svg")[0]
    .getBoundingClientRect();
  const chartLeft = chartArea.left + window.scrollX;
  const chartTop = chartArea.top + window.scrollY;

  const xAxisRange =
    options.hAxis.viewWindow.max - options.hAxis.viewWindow.min;
  const yAxisRange =
    options.vAxis.viewWindow.max - options.vAxis.viewWindow.min;
  const xPos =
    ((x - options.hAxis.viewWindow.min) / xAxisRange) * chartArea.width;
  const yPos =
    chartArea.height -
    ((y - options.vAxis.viewWindow.min) / yAxisRange) * chartArea.height;

  tooltipDiv.style.left = `${chartLeft + xPos}px`;
  tooltipDiv.style.top = `${chartTop + yPos}px`;

  container.appendChild(tooltipDiv);
}
