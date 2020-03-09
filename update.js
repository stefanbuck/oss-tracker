#!/usr/bin/env node

// Update data.json

const fs = require("fs");
const data = require("./data.json");
const html = fs.readFileSync("./template.html", "utf8");
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

// Update index.html

let durationStats = {};

function timeConvert(seconds) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds - hours * 3600) / 60);

  if (hours > 0) {
    return `${hours} hours and ${minutes} minutes`;
  }

  return `${minutes} minutes`;
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

let total = '';
let tableBody = '';
let chart = ''

tableBody = Object.entries(data)
  .reverse()
  .map(([id, { created_at, updated_at, body }]) => {
    const durationInSeconds =
      (new Date(updated_at).getTime() - new Date(created_at).getTime()) / 1000;

    let durationColumn = '<i>Currently working on this</i>';
    if (durationInSeconds > 0) {
      durationStats[body] = (durationStats[body] || 0) + durationInSeconds;
      durationColumn = timeConvert(durationInSeconds)
    }

    return `<tr>
        <td>${dateConvert(created_at)}</td>
        <td>${durationColumn}</td>
        <td>${body}</td>
    </tr>`;
  })
  .join("\n");

const totalDuration = Object.values(durationStats).reduce((memo, value) => {
 return memo + value;
}, 0);

const chartColors = ['#a0c659', '#00BE96', '#c68759']
chart = Object.entries(durationStats).map(([name, projectDuration], index) => {
    const label = timeConvert(projectDuration);
    const percent = ((100/ totalDuration) * projectDuration);

  return `<div title="${timeConvert(projectDuration)}" style="width: ${percent}%; background-color: ${chartColors[index]};" class="barchart-item">
    <span class="barchart-item--label">${name}</span>
  </div>`
}).join('')

total = timeConvert(totalDuration);

const finalHTML = eval(`\`${html}\``);

// Write files to disk
fs.writeFileSync('./data.json', JSON.stringify(data, null, ' '));
fs.writeFileSync("./public/index.html", finalHTML);
