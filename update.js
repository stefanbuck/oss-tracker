#!/usr/bin/env node

// Update data.json

const fs = require("fs");
const data = require("./data.json");
const html = fs.readFileSync("./template.html", "utf8");
const githubEvent = require(process.env.GITHUB_EVENT_PATH);

const { id, body, created_at, updated_at } = githubEvent.comment;

data[id] = {
    body,
    created_at,
    updated_at,
}

// Update index.html

let totalDuration = 0;

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
    `${date.getDay()},`,
    date.getFullYear()
  ].join(" ");
}

let total = '';
let tableBody = '';

tableBody = Object.entries(data)
  .map(([id, { created_at, updated_at, body }]) => {
    const durationInSeconds =
      (new Date(updated_at).getTime() - new Date(created_at).getTime()) / 1000;
    totalDuration += durationInSeconds;

    return `<tr>
        <td>${dateConvert(created_at)}</td>
        <td>${timeConvert(durationInSeconds)}</td>
        <td>${body}</td>
    </tr>`;
  })
  .join("\n");

total = timeConvert(totalDuration);

const finalHTML = eval(`\`${html}\``);

// Write files to disk
fs.writeFileSync('./data.json', JSON.stringify(data, null, ' '));
fs.writeFileSync("./public/index.html", finalHTML);
