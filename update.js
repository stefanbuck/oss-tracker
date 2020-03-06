#!/usr/bin/env node

// Update data.json

const fs = require('fs');
const data = require('./data.json')
const html = fs.readFileSync('./template.html', 'utf8');
const githubEvent = require(process.env.GITHUB_EVENT_PATH);

const { id, body, created_at, updated_at } = githubEvent.comment;

data[id] = {
    body,
    created_at,
    updated_at,
}

// Update index.html

const table = Object.entries(data).map(([id, data]) => {
    return `<div>${id} - ${data.body.split(/[\n\r]/)[0]}</div>`;
}).join('\n')

const finalHTML = eval(`\`${html}\``);

// Write files to disk
fs.writeFileSync('./data.json', JSON.stringify(data, null, ' '));
fs.writeFileSync('./public/index.html', finalHTML);