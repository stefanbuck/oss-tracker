#!/usr/bin/env node

// Update data.json

const fs = require("fs");
const data = require("./data.json");
const githubEvent = require(process.env.GITHUB_EVENT_PATH);

const { id, body, created_at, updated_at } = githubEvent.comment;

data[id] = {
    body,
    created_at,
    updated_at,
}

fs.writeFileSync('./data.json', JSON.stringify(data, null, ' '));
