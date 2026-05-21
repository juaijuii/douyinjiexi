export default async function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ code: 400, msg: '请提供 url 参数' });
  }

  const TIKHUB_TOKEN = process.env.TIKHUB_TOKEN;

  if (!TIKHUB_TOKEN) {
    return res.status(500).json({ code: 500, msg: '服务器未配置 API Token' });
  }

  try {
    const apiUrl = `https://api.tikhub.io/api/v1/douyin/app/v3/fetch_video_high_quality_play_url?share_url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${TIKHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.code === 200 && data.data?.original_video_url) {
      const d = data.data;

      return res.status(200).json({
        code: 200,
        msg: 'success',
        data: {
          video_url: d.original_video_url,
          file_size_mb: d.file_size_in_mb,
        }
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ code: 500, msg: '解析失败: ' + err.message });
  }
}
