export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, phone, date, message } = req.body;

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const DATABASE_ID = process.env.NOTION_DATABASE_SOURCE_ID || process.env.NOTION_DATABASE_ID;

    if (!NOTION_API_KEY || !DATABASE_ID) {
      console.error("Missing Notion environment variables");
      return res.status(500).json({ error: "서버 설정 오류: 노션 API 키가 없습니다." });
    }

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
          "이름": {
            title: [
              {
                text: { content: name }
              }
            ]
          },
          "연락처": {
            rich_text: [
              {
                text: { content: phone }
              }
            ]
          },
          "방문 희망 일시": {
            rich_text: [
              {
                text: { content: date }
              }
            ]
          },
          "내용": {
            rich_text: [
              {
                text: { content: message || "" }
              }
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Notion API Error:", errorData);
      return res.status(500).json({ error: "노션 전송에 실패했습니다." });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Submit Error:", error);
    return res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
}
