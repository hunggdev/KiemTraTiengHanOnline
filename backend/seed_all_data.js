import bcrypt from "bcrypt";
import prisma from "./src/prisma.js";

const rawVocab = [
  // Bài 8
  { kr: "음식", vn: "Thức ăn, món ăn" },
  { kr: "요리", vn: "Món ăn, sự nấu nướng" },
  { kr: "요리하다", vn: "Nấu ăn" },
  { kr: "음식을 만들다", vn: "Làm thức ăn / Nấu ăn" },
  { kr: "밥을 짓다", vn: "Nấu cơm" },
  { kr: "국", vn: "Canh" },
  { kr: "불고기", vn: "Thịt nướng Bulgogi" },
  { kr: "김치", vn: "Kimchi" },
  { kr: "된장찌개", vn: "Canh tương đậu" },
  { kr: "비빔밥", vn: "Cơm trộn" },
  { kr: "냉면", vn: "Mì lạnh" },
  { kr: "라면", vn: "Mì ăn liền / Mì tôm" },
  { kr: "삼겹살", vn: "Thịt ba chỉ nướng" },
  { kr: "김치찌개", vn: "Canh kimchi" },
  { kr: "갈비탕", vn: "Canh sườn bò" },
  { kr: "삼계탕", vn: "Gà hầm sâm" },
  { kr: "볶음밥", vn: "Cơm chiên / Cơm rang" },
  { kr: "갈비", vn: "Sườn" },
  { kr: "국수", vn: "Mì / Bún" },
  { kr: "맛있다", vn: "Ngon" },
  { kr: "맛없다", vn: "Dở / Không ngon" },
  { kr: "쓰다", vn: "Đắng" },
  { kr: "약", vn: "Thuốc" },
  { kr: "달다", vn: "Ngọt" },
  { kr: "사탕", vn: "Kẹo" },
  { kr: "맵다", vn: "Cay" },
  { kr: "고추", vn: "Ớt" },
  { kr: "시다", vn: "Chua" },
  { kr: "레몬", vn: "Chanh" },
  { kr: "짜다", vn: "Mặn" },
  { kr: "소금", vn: "Muối" },
  { kr: "싱겁다", vn: "Nhạt" },
  { kr: "숟가락", vn: "Thìa / Muỗng" },
  { kr: "젓가락", vn: "Đũa" },
  { kr: "수저", vn: "Bộ thìa đũa" },
  { kr: "메뉴", vn: "Thực đơn" },
  { kr: "컵 / 잔", vn: "Cốc / Ly, tách" },
  { kr: "테이블", vn: "Bàn" },
  { kr: "종업원", vn: "Nhân viên phục vụ" },
  { kr: "손님", vn: "Khách hàng" },
  { kr: "주인", vn: "Chủ / Chủ quán" },
  { kr: "흡연석", vn: "Chỗ ngồi hút thuốc" },
  { kr: "금연석", vn: "Chỗ ngồi không hút thuốc" },
  { kr: "영수증", vn: "Hóa đơn" },
  { kr: "주문하다", vn: "Gọi món / Đặt hàng" },
  { kr: "시키다", vn: "Gọi món / Đặt món" },
  { kr: "계산하다", vn: "Tính tiền / Thanh toán" },
  { kr: "계산서", vn: "Hóa đơn tính tiền" },
  { kr: "콜라", vn: "Coca-Cola" },
  { kr: "케이크", vn: "Bánh kem / Bánh sinh nhật" },
  { kr: "어서 오세요", vn: "Xin mời vào / Chào mừng quý khách" },
  { kr: "여기 앉으세요", vn: "Xin mời ngồi đây" },
  { kr: "잠깐만 기다리세요", vn: "Xin chờ một chút" },
  { kr: "녹차", vn: "Trà xanh" },
  { kr: "홍차", vn: "Hồng trà / Trà đen" },
  { kr: "인삼차", vn: "Trà nhân sâm" },
  { kr: "좀 / 조금", vn: "Một chút / Một ít" },
  { kr: "더", vn: "Thêm / Hơn" },
  { kr: "다 / 모두", vn: "Tất cả" },
  { kr: "반찬", vn: "Món ăn kèm (Banchan)" },
  { kr: "아이스크림", vn: "Kem" },
  { kr: "바쁘다", vn: "Bận rộn" },
  { kr: "아침", vn: "Buổi sáng / Bữa sáng" },
  { kr: "점심", vn: "Buổi trưa / Bữa trưa" },
  { kr: "저녁", vn: "Buổi tối / Bữa tối" },
  { kr: "남편", vn: "Chồng" },
  { kr: "아내", vn: "Vợ" },
  { kr: "닭고기", vn: "Thịt gà" },
  { kr: "햄버거", vn: "Bánh hamburger" },
  { kr: "가지", vn: "Loại / Thứ" },
  { kr: "병", vn: "Chai (đơn vị đếm)" },
  { kr: "보통", vn: "Thông thường / Bình thường" },
  { kr: "앉다", vn: "Ngồi" },
  { kr: "드시다", vn: "Dùng / Ăn (kính ngữ)" },
  { kr: "특히", vn: "Đặc biệt" },
  { kr: "항상", vn: "Luôn luôn" },
  { kr: "자주", vn: "Thường xuyên" },
  { kr: "가끔", vn: "Thỉnh thoảng" },

  // Bài 9
  { kr: "집", vn: "Nhà" },
  { kr: "댁", vn: "Nhà (kính ngữ)" },
  { kr: "위", vn: "Trên" },
  { kr: "아래", vn: "Dưới" },
  { kr: "안", vn: "Trong" },
  { kr: "밖", vn: "Ngoài" },
  { kr: "옆", vn: "Bên cạnh" },
  { kr: "사이", vn: "Giữa" },
  { kr: "앞", vn: "Trước" },
  { kr: "뒤", vn: "Sau" },
  { kr: "왼쪽", vn: "Bên trái" },
  { kr: "오른쪽", vn: "Bên phải" },
  { kr: "양쪽", vn: "Cả hai bên" },
  { kr: "건너편 / 맞은편", vn: "Đối diện" },
  { kr: "똑바로 / 쭉", vn: "Thẳng / Đi thẳng" },
  { kr: "동", vn: "Đông (hướng)" },
  { kr: "남", vn: "Nam (hướng)" },
  { kr: "북", vn: "Bắc (hướng)" },
  { kr: "서", vn: "Tây (hướng)" },
  { kr: "방향", vn: "Phương hướng" },
  { kr: "동쪽", vn: "Phía đông" },
  { kr: "남쪽", vn: "Phía nam" },
  { kr: "주택", vn: "Nhà ở / Nhà riêng" },
  { kr: "연립주택", vn: "Nhà liền kề / Chung cư thấp tầng" },
  { kr: "아파트", vn: "Chung cư" },
  { kr: "안방", vn: "Phòng ngủ chính" },
  { kr: "공부방", vn: "Phòng học" },
  { kr: "거실", vn: "Phòng khách" },
  { kr: "부엌", vn: "Bếp" },
  { kr: "화장실", vn: "Nhà vệ sinh" },
  { kr: "현관", vn: "Lối vào / Hiên nhà" },
  { kr: "베란다", vn: "Ban công" },
  { kr: "오피스텔", vn: "Căn hộ văn phòng (Officetel)" },
  { kr: "세탁실", vn: "Phòng giặt" },
  { kr: "침실", vn: "Phòng ngủ" },
  { kr: "침대", vn: "Giường" },
  { kr: "책장", vn: "Kệ sách / Giá sách" },
  { kr: "옷장", vn: "Tủ quần áo" },
  { kr: "소파", vn: "Ghế sofa" },
  { kr: "탁자", vn: "Bàn trà / Bàn" },
  { kr: "식탁", vn: "Bàn ăn" },
  { kr: "화장대", vn: "Bàn trang điểm" },
  { kr: "신발장", vn: "Tủ giày" },
  { kr: "경찰서", vn: "Đồn cảnh sát" },
  { kr: "세탁소", vn: "Tiệm giặt ủi" },
  { kr: "박물관", vn: "Bảo tàng" },
  { kr: "슈퍼마켓", vn: "Siêu thị" },
  { kr: "지하철역", vn: "Ga tàu điện ngầm" },
  { kr: "버스 정류장", vn: "Trạm xe buýt" },
  { kr: "빵집", vn: "Tiệm bánh" },
  { kr: "꽃집", vn: "Tiệm hoa" },
  { kr: "미용실", vn: "Tiệm làm tóc / Thẩm mỹ viện" },
  { kr: "편의점", vn: "Cửa hàng tiện lợi" },
  { kr: "출입국", vn: "Cục quản lý xuất nhập cảnh" },
  { kr: "호텔", vn: "Khách sạn" },
  { kr: "우체국", vn: "Bưu điện" },
  { kr: "올라가다 / 올라오다", vn: "Đi lên / Đi lên đây" },
  { kr: "내려가다 / 내려오다", vn: "Đi xuống / Đi xuống đây" },
  { kr: "들어가다 / 들어오다", vn: "Đi vào / Đi vào đây" },
  { kr: "돌아가다 / 돌아오다", vn: "Trở về / Trở về đây" },
  { kr: "공원", vn: "Công viên" },
  { kr: "숙제", vn: "Bài tập về nhà" },
  { kr: "게임을 하다", vn: "Chơi game" },
  { kr: "약속", vn: "Cuộc hẹn / Lời hứa" },
  { kr: "단독주택", vn: "Nhà biệt lập / Nhà đơn lập" },
  { kr: "정원", vn: "Sân vườn" },
  { kr: "나무", vn: "Cây" },
  { kr: "꽃", vn: "Hoa" },
  { kr: "참", vn: "Thật là / Vô cùng" },
  { kr: "편리하다", vn: "Tiện lợi" },
  { kr: "멀다", vn: "Xa" },
  { kr: "가깝다", vn: "Gần" },
  { kr: "N + 이/가 보고 싶다", vn: "Nhớ N / Muốn gặp N" },
  { kr: "N + 을/를 보고 싶다", vn: "Nhớ N / Muốn xem N" },
  { kr: "하숙집", vn: "Nhà trọ bao ăn" },
  { kr: "원룸", vn: "Phòng trọ khép kín (Studio)" },
  { kr: "기숙사", vn: "Ký túc xá" },
  { kr: "고시원", vn: "Phòng trọ nhỏ (Gosiwon)" },
  { kr: "아주머니", vn: "Bác gái / Thím / Cô" },
  { kr: "친절하다", vn: "Thân thiện / Tốt bụng" },
  { kr: "하숙비", vn: "Tiền nhà trọ" },
  { kr: "사용하다", vn: "Sử dụng" },
  { kr: "불편하다", vn: "Bất tiện" },
  { kr: "혼자", vn: "Một mình" },
  { kr: "편하다", vn: "Thoải mái / Tiện lợi" },
  { kr: "구하다", vn: "Tìm kiếm (nhà/phòng)" },
  { kr: "찾다", vn: "Tìm / Kiếm" },
  { kr: "검색하다", vn: "Tìm kiếm (trên mạng)" },
  { kr: "지내다", vn: "Sống / Trải qua" },
  { kr: "보내다", vn: "Gửi / Dành thời gian" },
  { kr: "빨간색", vn: "Màu đỏ" },
  { kr: "시원하다", vn: "Mát mẻ / Dễ chịu" },
  { kr: "병원", vn: "Bệnh viện" },
  { kr: "도시", vn: "Thành phố" },
  { kr: "시골", vn: "Nông thôn / Quê" },
  { kr: "호수", vn: "Hồ" },
  { kr: "노래", vn: "Bài hát" },
  { kr: "자취집", vn: "Nhà trọ tự nấu ăn" },
  { kr: "복잡하다", vn: "Phức tạp / Đông đúc" },
  { kr: "지하", vn: "Tầng hầm / Dưới lòng đất" },
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function seed() {
  console.log("1. Đang tạo tài khoản admin (username: admin, password: @Abc1234)...");
  
  const hashedPassword = await bcrypt.hash("@Abc1234", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: hashedPassword,
      role: "TEACHER",
      fullName: "Quản trị viên",
    },
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      fullName: "Quản trị viên",
      role: "TEACHER",
    },
  });

  console.log("✅ Tài khoản admin sẵn sàng! ID:", adminUser.id);

  console.log("2. Đang tạo bài kiểm tra 100 câu từ vựng tiếng Hàn...");

  const selectedVocab = rawVocab.slice(0, 100);
  const allMeanings = Array.from(new Set(rawVocab.map((item) => item.vn)));

  const questions = selectedVocab.map((item, index) => {
    const correctAnswerText = item.vn;
    const wrongMeaningsPool = allMeanings.filter((m) => m !== correctAnswerText);
    const shuffledWrong = shuffle(wrongMeaningsPool);
    const selectedWrong = shuffledWrong.slice(0, 3);

    const optionPool = shuffle([correctAnswerText, ...selectedWrong]);
    const labels = ["A", "B", "C", "D"];

    let correctLabel = "A";
    const options = optionPool.map((content, idx) => {
      const label = labels[idx];
      if (content === correctAnswerText) {
        correctLabel = label;
      }
      return {
        label,
        content,
      };
    });

    return {
      type: "MULTIPLE_CHOICE",
      order: index + 1,
      content: `Câu ${index + 1}: Từ "${item.kr}" trong tiếng Việt có nghĩa là gì?`,
      score: 0.1,
      correctAnswer: correctLabel,
      options: {
        create: options,
      },
    };
  });

  const part1Questions = questions.slice(0, 50).map((q, idx) => ({ ...q, order: idx + 1 }));
  const part2Questions = questions.slice(50, 100).map((q, idx) => ({ ...q, order: idx + 1 }));

  let testId = null;

  await prisma.$transaction(
    async (tx) => {
      // 1. Tạo bài test
      const test = await tx.test.create({
        data: {
          title: "Bài kiểm tra 100 câu Từ vựng Tiếng Hàn (Bài 8 & Bài 9)",
          description: "Đề kiểm tra trắc nghiệm 100 câu từ vựng tiếng Hàn chủ đề Ẩm thực (Bài 8) và Nhà cửa, Phương hướng (Bài 9). Mỗi câu có 4 đáp án A, B, C, D.",
          durationMin: 60,
          createdBy: "admin",
          isPublished: true,
        },
      });

      testId = test.id;

      // 2. Tạo Phần 1 (50 câu)
      const sec1 = await tx.testSection.create({
        data: {
          testId: test.id,
          skill: "READING",
          order: 1,
          durationMin: 30,
        },
      });

      for (const q of part1Questions) {
        await tx.question.create({
          data: {
            sectionId: sec1.id,
            type: q.type,
            order: q.order,
            content: q.content,
            score: q.score,
            correctAnswer: q.correctAnswer,
            options: q.options,
          },
        });
      }

      // 3. Tạo Phần 2 (50 câu)
      const sec2 = await tx.testSection.create({
        data: {
          testId: test.id,
          skill: "READING",
          order: 2,
          durationMin: 30,
        },
      });

      for (const q of part2Questions) {
        await tx.question.create({
          data: {
            sectionId: sec2.id,
            type: q.type,
            order: q.order,
            content: q.content,
            score: q.score,
            correctAnswer: q.correctAnswer,
            options: q.options,
          },
        });
      }
    },
    {
      maxWait: 20000,
      timeout: 60000,
    }
  );

  console.log("✅ Tạo bài kiểm tra 100 câu thành công! Test ID:", testId);
}

seed()
  .catch((e) => {
    console.error("❌ Lỗi khi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
