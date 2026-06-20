const {Client} = require('pg');
require('dotenv').config({path: './.env'});
const client = new Client({connectionString: process.env.DATABASE_URL});
const hash = '$2a$10$ZuVfJ7P5vlqvTP/NYocxP.rC0FspsrApBQj0xCrcmOvjMbDTXol0O';
client.connect().then(() => client.query('UPDATE users SET password = $1 WHERE username = $2', [hash, 'admin'])).then(() => console.log('Updated')).catch(console.error).finally(() => client.end());
