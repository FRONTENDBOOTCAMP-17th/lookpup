
Table users {
  id uuid [pk, note: "사용자 ID (Supabase Auth ID 연동)"]
  email text [note: "탈퇴 충돌 방지를 위해 DB 유니크 제거 -> 가입 로직 단에서 WHERE deleted_at IS NULL 조건으로 중복 검증"]
  provider text [not null, note: "oauth 제공자 (kakao / google)"]
  
  full_name text [note: "본인인증 실명"]
  birthdate date [note: "본인인증 생년월일"]
  phone_number text [note: "탈퇴 충돌 방지를 위해 DB 유니크 제거 -> 가입 로직 단에서 WHERE deleted_at IS NULL 조건으로 중복 검증"]
  gender text [note: "본인인증 성별 (MALE / FEMALE)"] 
  is_verified boolean [not null, default: false, note: "본인인증 성공 여부 플래그"]
  profile_image text [note: "프로필 이미지"]
  role text [not null, default: "owner", note: "owner / both / admin"]
  
  deleted_at timestamptz [note: "탈퇴 일시 (소프트 삭제)"]
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table pets {
  id uuid [pk, note: "반려동물 ID"]
  owner_id uuid [not null, ref: > users.id]
  name text [not null]
  animal_type text [not null, note: "dog / cat / other"]
  breed text
  age int
  gender text [not null, note: "MALE / FEMALE / MALE_NEUTERED / FEMALE_NEUTERED"]
  weight numeric [note: "몸무게(kg) - CHECK (weight > 0)"]
  image_url text
  caution text
  deleted_at timestamptz [note: "삭제 일시 (소프트 삭제 - 진행 중인 예약 유무는 백엔드 인터셉터 로직에서 검증 후 차단)"]
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table sitters {
  id uuid [pk, note: "펫시터 ID"]
  user_id uuid [not null, unique, ref: - users.id]
  title text
  introduction text
  career text
  available_area text
  latitude numeric
  longitude numeric
  base_price int [note: "CHECK (base_price >= 0)"]
  status text [not null, default: "pending", note: "pending / approved / rejected"]
  rating numeric [default: 0, note: "DB 트리거 제거 -> 리뷰 CUD API 성공 시 백엔드 로직에서 AVG() 계산 후 실시간 UPDATE"]
  request_type text[] [not null, default: `'{}'`, note: "제공 서비스 배열: visit(방문돌봄) / foster(위탁돌봄) / walk(산책) / hotel(펫호텔)"]
  certificate_urls text[] [not null, default: `'{}'`, note: "자격증 파일 URL 배열"]
  available_animals text[] [not null, default: `'{}'`, note: "돌봄 가능 동물 배열: small_dog / medium_dog / large_dog / cat"]
  activity_photo_urls text[] [not null, default: `'{}'`, note: "활동 사진 URL 배열"]
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table services {
  id uuid [pk, note: "서비스 ID"]
  sitter_id uuid [not null, ref: > sitters.id]
  title text [not null]
  description text
  service_type text [not null, note: "walk / care / hotel / pickup"]
  animal_type text
  price int [not null, default: 0, note: "CHECK (price >= 0)"]
  location text
  latitude numeric
  longitude numeric
  image_url text
  is_active boolean [not null, default: true]
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table requests {
  id uuid [pk, note: "구인글 ID"]
  owner_id uuid [not null, ref: > users.id]
  pet_id uuid [ref: > pets.id]
  title text [not null]
  content text
  request_type text
  start_datetime timestamptz
  end_datetime timestamptz
  budget int [note: "CHECK (budget >= 0)"]
  location text
  latitude numeric
  longitude numeric
  status text [not null, default: "open", note: "open / matched / completed / canceled"] // 오타 수정
  sitter_conditions text[] [not null, default: `'{}'`, note: "펫시터 조건 배열: require_badge(인증 펫시터) / prefer_female(여성 선호) / require_certificate(자격증 보유) / no_smoker(흡연자 제외)"]
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]

  note: "CHECK (start_datetime < end_datetime)"
}

Table applications {
  id uuid [pk, note: "지원 ID"]
  request_id uuid [not null, ref: > requests.id]
  sitter_id uuid [not null, ref: > sitters.id]
  message text
  proposed_price int [note: "CHECK (proposed_price >= 0)"]
  status text [not null, default: "pending", note: "pending / selected / rejected / canceled"] // 오타 수정
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]

  indexes {
    (request_id, sitter_id) [unique]
  }
}

Table reservations {
  id uuid [pk, note: "예약 ID"]
  owner_id uuid [not null, ref: > users.id]
  sitter_id uuid [not null, ref: > sitters.id]
  service_id uuid [ref: > services.id]
  request_id uuid [ref: > requests.id]
  
  start_datetime timestamptz
  end_datetime timestamptz
  total_price int [not null, note: "CHECK (total_price >= 0)"]
  status text [not null, default: "pending", note: "pending / accepted / paid / in_progress / completed / canceled"] // 오타 수정
  memo text
  
  accepted_at timestamptz
  paid_at timestamptz 
  started_at timestamptz
  completed_at timestamptz
  canceled_at timestamptz // 컬럼명 오타 수정 (L 하나)
  cancel_reason text 
  
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
  
  note: "CHECK (service_id IS NOT NULL OR request_id IS NOT NULL) AND (start_datetime < end_datetime)"
}

Table reservation_items {
  id uuid [pk, note: "예약 아이템 ID"]
  reservation_id uuid [not null, note: "예약서 ID"]
  pet_id uuid [not null, ref: > pets.id]

  indexes {
    (reservation_id, pet_id) [unique]
  }
}

Table payments {
  id text [pk, note: "포트원 V2 결제 ID"]
  reservation_id uuid [not null, ref: > reservations.id, note: "결제 실패 후 재시도 허용을 위해 DB 유니크 제거 -> 백엔드 진입 로직에서 중복 결제(paid) 유무 검증"]
  owner_id uuid [not null, ref: > users.id]
  sitter_id uuid [not null, ref: > sitters.id]
  
  pay_method text [not null]
  amount int [not null, note: "CHECK (amount >= 0)"]
  
  canceled_amount int [not null, default: 0, note: "CHECK (canceled_amount >= 0)"] // 컬럼명 오타 수정
  fee_rate numeric [not null, default: 0.10]
  platform_fee int [not null, default: 0, note: "CHECK (platform_fee >= 0)"]
  settle_amount int [not null, default: 0, note: "CHECK (settle_amount >= 0)"]
  status text [not null, note: "ready / paid / failed / canceled / partial_canceled"] // 허용값 오타 수정 (미국식 통일)
  receipt_url text
  
  auto_confirm_at timestamptz
  paid_at timestamptz
  canceled_at timestamptz // 컬럼명 오타 수정 (L 하나)
  settled_at timestamptz
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]

  note: "CHECK (canceled_amount <= amount)" 
}

Table reviews {
  id uuid [pk, note: "후기 ID"]
  reservation_id uuid [not null, unique, ref: - reservations.id]
  owner_id uuid [not null, ref: > users.id]
  sitter_id uuid [not null, ref: > sitters.id]
  rating int [not null, note: "CHECK (rating BETWEEN 1 AND 5)"]
  content text [not null]
  image_url text
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table reports {
  id uuid [pk, note: "신고 ID"]
  reporter_id uuid [not null, ref: > users.id]
  target_type text [not null, note: "user / sitter / request / service / reservation / review / message"] 
  target_id uuid [not null]
  reason text [not null]
  content text
  status text [not null, default: "pending", note: "pending / processing / completed / rejected"]
  
  handled_by uuid [ref: > users.id]
  handled_at timestamptz 
  admin_memo text 

  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table notifications {
  id uuid [pk, note: "알림 ID"]
  user_id uuid [not null, ref: > users.id]
  type text [not null, note: "유연한 카테고리 확장을 위해 DB 제약 제외 -> 백엔드(TypeScript/Zod) 스키마 단에서 허용값 검증"] 
  title text [not null]
  content text [not null]
  is_read boolean [not null, default: false]
  link_url text
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table chat_rooms {
  id uuid [pk, note: "채팅방 ID"]
  owner_id uuid [not null, ref: > users.id]
  sitter_id uuid [not null, ref: > sitters.id]
  
  room_type text [not null, default: "request", note: "request / direct"]
  
  request_id uuid [ref: > requests.id]
  application_id uuid [ref: > applications.id]
  reservation_id uuid [ref: > reservations.id]
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]

  indexes {
    (request_id, sitter_id) [unique, note: "구인글방 중복방지용 유니크"]
  }
}

Table messages {
  id uuid [pk, note: "메시지 ID"]
  room_id uuid [not null, note: "채팅방 ID"] 
  sender_id uuid [not null, ref: > users.id]
  content text [not null]
  is_read boolean [not null, default: false]
  created_at timestamptz [default: `now()` ]
  updated_at timestamptz [default: `now()` ]
}

Table extra_charges {
  id uuid [pk, default: `gen_random_uuid()`, note: "추가금 요청 ID"]
  reservation_id uuid [not null, ref: > reservations.id, note: "연결된 예약 ID"]
  sitter_id uuid [not null, ref: > sitters.id, note: "추가금을 요청한 시터 ID"]
  owner_id uuid [not null, ref: > users.id, note: "추가금을 요청받은 보호자 ID"]
  amount int [not null, note: "추가 요청 금액 CHECK (amount > 0)"]
  reason text [not null, note: "추가금 요청 사유"]
  status text [not null, default: "pending", note: "pending / approved / rejected / paid / canceled"]
  payment_id text [ref: > payments.id, note: "결제 완료 시 연결되는 포트원 결제 ID"]
  requested_at timestamptz [default: `now()`, note: "요청 일시"]
  responded_at timestamptz [note: "보호자 승인/거절 일시"]
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]

  note: "시터의 추가금 요청 테이블"
}

// 명시적 외래키 외부 선언부
Ref: chat_rooms.id < messages.room_id [delete: cascade]
Ref: reservations.id < reservation_items.reservation_id [delete: cascade]