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

  // 你的 TikHub API Key
  const TIKHUB_TOKEN = process.env.TIKHUB_TOKEN;

  if (!TIKHUB_TOKEN) {
    return res.status(500).json({ code: 500, msg: '服务器未配置 API Token' });
  }

  try {
    const apiUrl = `https://api.tikhub.io/api/v1/douyin/app/v3/fetch_one_video_by_share_url?share_url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${TIKHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // 提取关键字段，返回简洁格式
    if (data.code === 200 && data.data?.aweme_detail) {
      const detail = data.data.aweme_detail;
      const videoList = detail.video?.bit_rate?.map(item => ({
        url: item.play_addr?.url_list?.[0] || '',
        level: `${item.gear_name || ''}`,
      })) || [];

      // 兜底：如果 bit_rate 没有，用 play_addr
      if (videoList.length === 0) {
        const playUrl = detail.video?.play_addr?.url_list?.[0];
        if (playUrl) videoList.push({ url: playUrl, level: '标清' });
      }

      return res.status(200).json({
        code: 200,
        msg: 'success',
        data: {
          title: detail.desc || '',
          cover: detail.video?.cover?.url_list?.[0] || '',
          music: detail.music?.play_url?.uri || '',
          author: detail.author?.nickname || '',
          video_list: videoList,
          // 图集支持
          images: detail.images?.map(img => img.url_list?.[0]).filter(Boolean) || [],
        }
      });
    }

    // TikHub 原始错误直接透传
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ code: 500, msg: '解析失败: ' + err.message });
  }
}
