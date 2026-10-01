import prisma from "./src/prisma.js";

const vocabFood = [
  { kr: "음식", vn: "Thức ăn, món ăn", romaji: "eumsik", ex: "한국 음식이 맛있어요.", exVn: "Món ăn Hàn Quốc rất ngon." },
  { kr: "요리하다", vn: "Nấu ăn", romaji: "yorihada", ex: "주말에 요리해요.", exVn: "Tôi nấu ăn vào cuối tuần." },
  { kr: "밥", vn: "Cơm", romaji: "bap", ex: "밥을 먹었어요?", exVn: "Bạn đã ăn cơm chưa?" },
  { kr: "물", vn: "Nước", romaji: "mul", ex: "물 좀 주세요.", exVn: "Làm ơn cho tôi xin chút nước." },
  { kr: "불고기", vn: "Thịt nướng Bulgogi", romaji: "bulgogi", ex: "불고기를 주문했어요.", exVn: "Tôi đã gọi món thịt nướng Bulgogi." },
  { kr: "김치찌개", vn: "Canh kim chi", romaji: "gimchijjigae", ex: "김치찌개가 조금 매워요.", exVn: "Canh kim chi hơi cay một chút." },
  { kr: "비빔밥", vn: "Cơm trộn", romaji: "bibimbap", ex: "전주 비빔밥이 유명해요.", exVn: "Cơm trộn Jeonju rất nổi tiếng." },
  { kr: "맛있다", vn: "Ngon", romaji: "masitta", ex: "이 사과가 정말 맛있어요.", exVn: "Quả táo này thật sự rất ngon." },
  { kr: "맛없다", vn: "Dở, không ngon", romaji: "madeopda", ex: "이 식당은 맛없어요.", exVn: "Nhà hàng này đồ ăn không ngon." },
  { kr: "맵다", vn: "Cay", romaji: "maepda", ex: "떡볶이가 아주 매워요.", exVn: "Bánh gạo cay rất là cay." },
  { kr: "달다", vn: "Ngọt", romaji: "dalda", ex: "케이크가 달아요.", exVn: "Bánh ngọt thì ngọt." },
  { kr: "짜다", vn: "Mặn", romaji: "jjada", ex: "국이 너무 짜요.", exVn: "Canh mặn quá." },
  { kr: "싱겁다", vn: "Nhạt, lạt", romaji: "singgeopda", ex: "소금을 넣으세요.", exVn: "Hãy cho thêm muối vào." },
  { kr: "식당", vn: "Nhà hàng, quán ăn", romaji: "sikdang", ex: "어느 식당에 갈까요?", exVn: "Chúng ta đi nhà hàng nào nhé?" },
  { kr: "메뉴판", vn: "Bảng thực đơn", romaji: "menyupan", ex: "메뉴판 좀 보여주세요.", exVn: "Làm ơn cho tôi xem thực đơn." },
  { kr: "주문하다", vn: "Gọi món, đặt hàng", romaji: "jumunhada", ex: "주문하시겠어요?", exVn: "Quý khách muốn gọi món gì ạ?" },
  { kr: "계산하다", vn: "Thanh toán, tính tiền", romaji: "gyesanhada", ex: "여기 계산해 주세요.", exVn: "Làm ơn tính tiền ở đây cho tôi." },
  { kr: "숟가락", vn: "Cái thìa, muỗng", romaji: "sutgarak", ex: "숟가락을 떨어뜨렸어요.", exVn: "Tôi lỡ làm rơi cái thìa." },
  { kr: "젓가락", vn: "Đôi đũa", romaji: "jeotgarak", ex: "젓가락 사용이 어려워요.", exVn: "Dùng đũa hơi khó." },
  { kr: "영수증", vn: "Hóa đơn", romaji: "yeongsujeung", ex: "영수증 드릴까요?", exVn: "Tôi xuất hóa đơn cho bạn nhé?" },
];

const dailyExpressions = [
  { kr: "안녕하세요", vn: "Xin chào (lịch sự)", romaji: "annyeonghaseyo", ex: "안녕하세요! 만나서 반갑습니다.", exVn: "Xin chào! Rất vui được gặp bạn." },
  { kr: "감사합니다", vn: "Xin cảm ơn", romaji: "gamsahamnida", ex: "도와주셔서 감사합니다.", exVn: "Cảm ơn vì đã giúp đỡ tôi." },
  { kr: "죄송합니다", vn: "Xin lỗi (trang trọng)", romaji: "joesonghamnida", ex: "늦어서 죄송합니다.", exVn: "Xin lỗi vì tôi đến muộn." },
  { kr: "괜찮아요", vn: "Không sao đâu", romaji: "gwaenchanayo", ex: "괜찮아요, 신경 쓰지 마세요.", exVn: "Không sao đâu, đừng bận tâm." },
  { kr: "안녕히 계세요", vn: "Tạm biệt (chúc người ở lại bình an)", romaji: "annyeonghi gyeseyo", ex: "저는 먼저 갑니다. 안녕히 계세요.", exVn: "Tôi về trước đây. Ở lại mạnh khỏe nhé." },
  { kr: "안녕히 가세요", vn: "Tạm biệt (chúc người đi đường bình an)", romaji: "annyeonghi gaseyo", ex: "조심해서 안녕히 가세요.", exVn: "Đi cẩn thận nhé, tạm biệt." },
  { kr: "얼마예요?", vn: "Bao nhiêu tiền vậy ạ?", romaji: "eolmayeyo", ex: "이 가방 얼마예요?", exVn: "Chiếc túi xách này bao nhiêu tiền ạ?" },
  { kr: "도와주세요", vn: "Xin hãy giúp tôi với", romaji: "dowajuseyo", ex: "길을 잃었어요. 도와주세요.", exVn: "Tôi bị lạc đường rồi. Làm ơn giúp tôi với." },
  { kr: "이름이 뭐예요?", vn: "Bạn tên là gì?", romaji: "ireumi mwoyeyo", ex: "실례지만, 이름이 뭐예요?", exVn: "Xin thất lễ, bạn tên là gì ạ?" },
  { kr: "어디에 있어요?", vn: "Ở đâu vậy?", romaji: "eodie isseoyo", ex: "화장실이 어디에 있어요?", exVn: "Nhà vệ sinh ở đâu vậy ạ?" },
];

async function main() {
  console.log("🌱 Seeding default Korean flashcard decks...");

  // 1. Deck Ẩm thực
  let deck1 = await prisma.flashcardDeck.findFirst({
    where: { title: "Từ vựng Tiếng Hàn Sơ Cấp - Ẩm thực & Nhà hàng (TOPIK I)" },
  });

  if (!deck1) {
    deck1 = await prisma.flashcardDeck.create({
      data: {
        title: "Từ vựng Tiếng Hàn Sơ Cấp - Ẩm thực & Nhà hàng (TOPIK I)",
        description: "Tổng hợp 20 từ vựng và câu ví dụ phổ biến nhất về đồ ăn, vị giác và giao tiếp trong nhà hàng Hàn Quốc.",
        type: "VOCABULARY",
        language: "ko",
        isPublic: true,
        cards: {
          create: vocabFood.map((v, i) => ({
            korean: v.kr,
            vietnamese: v.vn,
            romaji: v.romaji,
            exampleSentence: v.ex,
            exampleTranslation: v.exVn,
            order: i,
          })),
        },
      },
      include: { cards: true },
    });
    console.log(`✅ Đã tạo bộ thẻ: "${deck1.title}" với ${deck1.cards.length} thẻ.`);
  } else {
    console.log(`ℹ️ Bộ thẻ "${deck1.title}" đã tồn tại.`);
  }

  // 2. Deck Giao tiếp
  let deck2 = await prisma.flashcardDeck.findFirst({
    where: { title: "10 Câu Giao Tiếp Tiếng Hàn Thông Dụng Mỗi Ngày" },
  });

  if (!deck2) {
    deck2 = await prisma.flashcardDeck.create({
      data: {
        title: "10 Câu Giao Tiếp Tiếng Hàn Thông Dụng Mỗi Ngày",
        description: "Các mẫu câu chào hỏi, cảm ơn, xin lỗi, hỏi giá cả và nhờ giúp đỡ thiết yếu khi sinh sống và du lịch Hàn Quốc.",
        type: "SENTENCE",
        language: "ko",
        isPublic: true,
        cards: {
          create: dailyExpressions.map((v, i) => ({
            korean: v.kr,
            vietnamese: v.vn,
            romaji: v.romaji,
            exampleSentence: v.ex,
            exampleTranslation: v.exVn,
            order: i,
          })),
        },
      },
      include: { cards: true },
    });
    console.log(`✅ Đã tạo bộ thẻ: "${deck2.title}" với ${deck2.cards.length} thẻ.`);
  } else {
    console.log(`ℹ️ Bộ thẻ "${deck2.title}" đã tồn tại.`);
  }

  console.log("🎉 Hoàn tất gieo dữ liệu bộ thẻ mẫu!");
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
