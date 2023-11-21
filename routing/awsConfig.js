// awsConfig.js
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: 'ASIAQOOHCLGLCH3WVQPY',
    secretAccessKey: '2A273dzDyfKVdo7B6hgvKLwqJHHF0QFs8qWcViDI',
    region: 'us-east-1',
});

module.exports = AWS.config;