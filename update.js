#!/usr/bin/env node

// Update data.json

const fs = require("fs");
const data = require("./data.json");
const html = fs.readFileSync("./template.html", "utf8");

if (process.env.GITHUB_ACTION) {
  const githubEvent = require(process.env.GITHUB_EVENT_PATH);

  const { id, body, created_at, updated_at, html_url } = githubEvent.comment;
  
  if (!html_url.startsWith('https://github.com/stefanbuck/oss-tracker/issues/1#')) {
    console.log('Skip, this is a regular issue comment');
    process.exit(0);
  }
  
  data[id] = {
      body,
      created_at,
      updated_at,
  }
}

// Update index.html

let durationStats = {};

function timeConvert(seconds) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds - hours * 3600) / 60);

  const hoursLabel = hours === 1 ? 'hour' : 'hours';
  const minutesLabel = minutes === 1 ? 'minute' : 'minutes';

  if (hours > 0) {
    return `${hours} ${hoursLabel} and ${minutes} ${minutesLabel}`;
  }

  return `${minutes} ${minutesLabel}`;
}

function dateConvert(dateString) {
  const date = new Date(dateString);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  return [
    months[date.getMonth()],
    `${date.getDate()},`,
    date.getFullYear()
  ].join(" ");
}

const links = {
  'OctoLinker': 'https://github.com/OctoLinker/OctoLinker',
  'OSS Tracker': 'https://github.com/stefanbuck/oss-tracker',
  'Pull Request Badge': 'https://github.com/stefanbuck/pull-request-badge-app'
}

function renderTableRow({className, created_at, durationString, color, projectName }) {
  let content = projectName;

  if (links[projectName]) {
    content = `<a href=${links[projectName]}>${projectName}</a>`
  }

  return `<tr class="${className}">
  <td>${dateConvert(created_at)}</td>
  <td>${durationString}</td>
  <td><div class="project-color" style="background-color: ${color}"></div> ${content}</td>
</tr>`;
}

function renderTableShowMore() {
  return `<tr>
  <td colspan="3" class="show-more-row" >
    <button class="js-table-show-more">Show more</button>
  </td>
</tr>`
}

function renderLegendItem({ color, projectName}) {
  return `<li>
  <span class="project-color" style="background-color:${color};"></span>
  <span class="project-name">${projectName}</span>
</li>`
}

function renderBarItem({ projectDuration, percent, color}) {
  return `<div title="${timeConvert(projectDuration)}" style="width: ${percent}%; background-color: ${color};" class="barchart-item"></div>`;
}

let total = '';
let tableBody = [];
let chart = ''
let chartLegend = {};

const chartColors = ['#89e051',  '#f1e05a', '#00ADD8',  '#F54845', '#5C4848', '#D5B984']
const projectColors = {};

tableBody = Object.entries(data)
  .reverse()
  .map(([id, { created_at, updated_at, body }], index) => {
    const projectName = body.trim();
    const durationInSeconds =
      (new Date(updated_at).getTime() - new Date(created_at).getTime()) / 1000;

    let durationString = '<i>Currently working on this</i>';
    if (durationInSeconds > 0) {
      durationStats[projectName] = (durationStats[projectName] || 0) + durationInSeconds;
      durationString = timeConvert(durationInSeconds)
    }

    const color = projectColors[projectName] = projectColors[projectName] || chartColors[Object.keys(projectColors).length];

    chartLegend[projectName] = renderLegendItem({ projectName, color});

    const className = index > 19 ? 'hidden' : '';

    return renderTableRow( { className, created_at, durationString, color, projectName });
  })

  if (tableBody.length > 20) {
    tableBody.push(renderTableShowMore())
  }
  
  tableBody = tableBody.join("\n");

const totalDuration = Object.values(durationStats).reduce((memo, value) => {
 return memo + value;
}, 0);

chart = Object.entries(durationStats).map(([name, projectDuration], index) => {
    const percent = ((100/ totalDuration) * projectDuration);
    const color = chartColors[index];

    projectColors[name] = color;

  return renderBarItem({ projectDuration, percent, color})
}).join('')

total = timeConvert(totalDuration);
chartLegend = Object.values(chartLegend).join('');

const finalHTML = eval(`\`${html}\``);

// Write files to disk
if (process.env.GITHUB_ACTION) fs.writeFileSync('./data.json', JSON.stringify(data, null, ' '));
fs.writeFileSync("./public/index.html", finalHTML);
