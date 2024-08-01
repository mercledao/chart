// Note: Make sure correct output file path is selected & xLabel & yLabel name should be exactly same as the JSON property you want.
const arr = [];
const xLabel = "totalVolume";
const yLabel = "swapS";
const xViewMn = 0;
const xViewMx = 200;
const yViewMn = 0;
const yViewMx = 50;

// just set outputFilePath
fetch("./mrep/data/outputData3.json")
  .then(function (response) {
    if (response.status == 200) {
      return response.json();
    }
  })
  .then(function (data) {
    arr.push([xLabel, yLabel, { type: "string", role: "tooltip" }]);
    data.forEach((i) =>
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
  var data = google.visualization.arrayToDataTable(arr);

  var options = {
    title: `${xLabel} vs. ${yLabel} comparison`,
    hAxis: {
      title: xLabel,
      viewWindow: { max: xViewMx, min: xViewMn },
    },
    vAxis: { title: yLabel, viewWindow: { max: yViewMx, min: yViewMn } },
    crosshair: { trigger: "both" },
    legend: "none",
    tooltip: { trigger: "selection" },
  };

  var chart = new google.visualization.ScatterChart(
    document.getElementById("chart_div")
  );

  chart.draw(data, options);
}
