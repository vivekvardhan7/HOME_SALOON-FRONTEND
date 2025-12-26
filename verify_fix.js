const http = require('http');

function request(path) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET',
            headers: { 'Authorization': 'Bearer static-admin-token' }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: "Parse error", raw: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function verify() {
    try {
        console.log("Fetching raw services data...");
        const res = await request('/api/admin/debug-services');
        console.log(JSON.stringify(res, null, 2));
    } catch (error) {
        console.error("Verification failed:", error);
    }
}

verify();
