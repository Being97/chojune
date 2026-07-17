// /app/api/instagram/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.error("인스타그램 토큰이 환경 변수(INSTAGRAM_ACCESS_TOKEN)에 설정되지 않았습니다.");
    return NextResponse.json({ error: "토큰 설정 누락" }, { status: 500 });
  }

  try {
    // 💡 fields에 "thumbnail_url"을 추가로 요청합니다!
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const res = await fetch(url, { cache: "no-store" });
    
    if (!res.ok) {
      throw new Error(`인스타 API 응답 실패: ${res.status}`);
    }

    const data = await res.json();
    
    const formattedPosts = (data.data || []).map((post: any) => {
      // 💡 비디오(릴스) 타입이면 media_url 대신 thumbnail_url을 대표 이미지로 지정합니다.
      const isVideo = post.media_type === "VIDEO";
      const displayImageUrl = isVideo ? (post.thumbnail_url || post.media_url) : post.media_url;

      return {
        id: post.id,
        mediaUrl: displayImageUrl, // 프론트엔드가 그대로 렌더링할 수 있는 이미지 주소
        videoUrl: isVideo ? post.media_url : null, // (선택) 혹시 비디오 원본을 쓸 때를 대비해 따로 보관
        permalink: post.permalink,
        caption: post.caption || "",
        timestamp: post.timestamp,
        mediaType: post.media_type,
      };
    });

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error("인스타그램 데이터 호출 중 에러 발생:", error);
    return NextResponse.json({ error: "데이터 호출 실패" }, { status: 500 });
  }
}