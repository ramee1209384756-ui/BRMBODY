const http = require('http');
const fs = require('fs');
const path = require('path');

// .env 수동 파싱
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim();
    });
}

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.png': 'image/png'
};

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    // API 라우팅 모방
    if (req.url === '/api/submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const formData = JSON.parse(body);
                const NOTION_API_KEY = process.env.NOTION_API_KEY;
                const DATABASE_ID = process.env.NOTION_DATABASE_SOURCE_ID;

                const response = await fetch("https://api.notion.com/v1/pages", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${NOTION_API_KEY}`,
                        "Content-Type": "application/json",
                        "Notion-Version": "2022-06-28"
                    },
                    body: JSON.stringify({
                        parent: { database_id: DATABASE_ID },
                        properties: {
                            "이름": { title: [{ text: { content: formData.name } }] },
                            "연락처": { rich_text: [{ text: { content: formData.phone } }] },
                            "방문 희망 일시": { rich_text: [{ text: { content: formData.date } }] },
                            "내용": { rich_text: [{ text: { content: formData.message || "" } }] }
                        }
                    })
                });

                if (response.ok) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    const error = await response.json();
                    console.error(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Notion Error' }));
                }
            } catch (err) {
                console.error(err);
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 정적 파일 서빙
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(3000, () => {
    console.log('\n✅ 로컬 테스트 서버가 실행되었습니다!');
    console.log('👉 인터넷 브라우저 주소창에 아래 주소를 입력하세요:');
    console.log('http://localhost:3000');
});
