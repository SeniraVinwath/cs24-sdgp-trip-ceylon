const axios = require('axios');
const md5 = require('md5');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateSignature(password, time) {
    return md5(md5(password) + time);
}

async function getAccessToken(account, password, imei) {
    let time = Math.floor(Date.now() / 1000);
    let signature = generateSignature(password, time);

    try {
        const response = await axios.get('http://api.citytrack.lk/api/authorization', {
            params: {
                time: time,
                account: account,
                signature: signature
            }
        });

        if (response.data.code === 0) {
            const accessToken = response.data.record.access_token;
            console.log("received access token: ", accessToken)

            // ✅ Ensure JWT_SECRET is present before signing the token
            /*if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is missing in environment variables.');
            }*/
            if (imei && process.env.JWT_SECRET) {
                const jwtToken = jwt.sign(
                    { account, accessToken, imei },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );
            }
            /*const jwtToken = jwt.sign(
                { account, accessToken, imei },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );*/

            return accessToken;
        } else {
            console.error('API Error:', response.data.message);
            return null;
        }
    } catch (error) {
        console.error('Request failed:', error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = { getAccessToken };
