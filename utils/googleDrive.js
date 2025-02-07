const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');
const fs = require('fs').promises;

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

async function getFileStream(auth, fileId) {
    const drive = google.drive({ version: 'v3', auth });
    try {
        const res = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return res.data;
    } catch (err) {
        throw new Error('Error getting file stream: ' + err.message);
    }
}

async function getFileMetadata(auth, fileId) {
    const drive = google.drive({ version: 'v3', auth });
    try {
        const res = await drive.files.get({
            fileId: fileId,
            fields: 'name,mimeType,size'
        });
        return res.data;
    } catch (err) {
        throw new Error('Error getting file metadata: ' + err.message);
    }
}

function extractFileId(url) {
    const pattern = /[-\w]{25,}/;
    const match = url.match(pattern);
    return match ? match[0] : null;
}

module.exports = {
    authorize,
    getFileStream,
    getFileMetadata,
    extractFileId
}; 