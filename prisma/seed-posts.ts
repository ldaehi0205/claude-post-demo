import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const posts = [
  {
    title: 'JavaScript 변수 선언: var, let, const의 차이',
    content: `# JavaScript 변수 선언: var, let, const

JavaScript에서 변수를 선언하는 세 가지 키워드가 있습니다.

## var
- 함수 스코프를 가집니다.
- 호이스팅되어 선언 전에 접근하면 \`undefined\`를 반환합니다.
- 같은 스코프 내에서 재선언이 가능합니다.

\`\`\`javascript
var name = "홍길동";
var name = "김철수"; // 재선언 가능
\`\`\`

## let
- 블록 스코프를 가집니다.
- 재선언이 불가능하지만 재할당은 가능합니다.

\`\`\`javascript
let age = 25;
age = 30; // 재할당 가능
// let age = 35; // SyntaxError: 재선언 불가
\`\`\`

## const
- 블록 스코프를 가집니다.
- 재선언과 재할당 모두 불가능합니다.
- 객체나 배열의 경우 내부 값은 변경 가능합니다.

\`\`\`javascript
const PI = 3.14159;
// PI = 3.14; // TypeError: 재할당 불가

const user = { name: "홍길동" };
user.name = "김철수"; // 객체 내부 값 변경은 가능
\`\`\`

> **권장사항:** 기본적으로 \`const\`를 사용하고, 재할당이 필요한 경우에만 \`let\`을 사용하세요. \`var\`는 사용을 피하는 것이 좋습니다.`,
  },
  {
    title: '화살표 함수(Arrow Function) 완벽 가이드',
    content: `# 화살표 함수(Arrow Function)

ES6에서 도입된 화살표 함수는 더 간결한 함수 작성 방법을 제공합니다.

## 기본 문법

\`\`\`javascript
// 기존 함수
function add(a, b) {
  return a + b;
}

// 화살표 함수
const add = (a, b) => a + b;
\`\`\`

## 다양한 형태

\`\`\`javascript
// 매개변수가 하나일 때 괄호 생략 가능
const double = x => x * 2;

// 매개변수가 없을 때
const greet = () => "안녕하세요!";

// 본문이 여러 줄일 때
const calculate = (a, b) => {
  const sum = a + b;
  const product = a * b;
  return { sum, product };
};
\`\`\`

## this 바인딩 차이

화살표 함수의 가장 큰 특징은 자신만의 \`this\`를 가지지 않는다는 것입니다.

\`\`\`javascript
const obj = {
  name: "JavaScript",
  // 일반 함수: this는 obj를 가리킴
  sayHello: function() {
    console.log(this.name);
  },
  // 화살표 함수: this는 상위 스코프의 this를 가리킴
  sayHi: () => {
    console.log(this.name); // undefined
  }
};
\`\`\`

> **주의:** 메서드 정의, 생성자 함수, addEventListener의 콜백에서는 일반 함수를 사용하는 것이 좋습니다.`,
  },
  {
    title: '배열 메서드 map, filter, reduce 활용법',
    content: `# 배열 메서드: map, filter, reduce

JavaScript 배열의 고차 함수를 활용하면 데이터를 선언적으로 처리할 수 있습니다.

## map - 변환

배열의 각 요소를 변환하여 새로운 배열을 반환합니다.

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

const users = [
  { name: "김철수", age: 25 },
  { name: "이영희", age: 30 }
];
const names = users.map(user => user.name);
// ["김철수", "이영희"]
\`\`\`

## filter - 필터링

조건에 맞는 요소만 골라 새로운 배열을 반환합니다.

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5, 6];
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4, 6]

const adults = users.filter(user => user.age >= 20);
\`\`\`

## reduce - 축약

배열을 하나의 값으로 축약합니다.

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, cur) => acc + cur, 0);
// 15

// 그룹화 예시
const fruits = ["사과", "바나나", "사과", "딸기", "바나나", "사과"];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
// { 사과: 3, 바나나: 2, 딸기: 1 }
\`\`\`

## 메서드 체이닝

\`\`\`javascript
const result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .filter(n => n % 2 === 0)   // 짝수만
  .map(n => n * 3)             // 3배
  .reduce((a, b) => a + b, 0); // 합계
// 90
\`\`\``,
  },
  {
    title: '비구조화 할당(Destructuring)과 스프레드 연산자',
    content: `# 비구조화 할당과 스프레드 연산자

ES6의 핵심 문법인 비구조화 할당과 스프레드 연산자를 알아봅니다.

## 객체 비구조화 할당

\`\`\`javascript
const user = {
  name: "홍길동",
  age: 30,
  email: "hong@example.com"
};

// 기본 사용
const { name, age } = user;
console.log(name); // "홍길동"

// 별칭 지정
const { name: userName, age: userAge } = user;

// 기본값 설정
const { phone = "없음" } = user;
console.log(phone); // "없음"

// 중첩 객체
const company = {
  name: "테크",
  address: { city: "서울", zip: "12345" }
};
const { address: { city } } = company;
\`\`\`

## 배열 비구조화 할당

\`\`\`javascript
const colors = ["빨강", "파랑", "초록"];
const [first, second] = colors;
// first = "빨강", second = "파랑"

// 요소 건너뛰기
const [, , third] = colors;
// third = "초록"

// 변수 교환
let a = 1, b = 2;
[a, b] = [b, a];
// a = 2, b = 1
\`\`\`

## 스프레드 연산자 (...)

\`\`\`javascript
// 배열 복사 및 합치기
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

// 객체 복사 및 병합
const defaults = { theme: "light", lang: "ko" };
const settings = { ...defaults, theme: "dark" };
// { theme: "dark", lang: "ko" }

// 나머지 매개변수
const { name: n, ...rest } = user;
// rest = { age: 30, email: "hong@example.com" }
\`\`\`

> **팁:** React에서 props 전달, 상태 업데이트 시 스프레드 연산자를 자주 활용합니다.`,
  },
  {
    title: 'Promise와 async/await로 비동기 처리하기',
    content: `# Promise와 async/await

JavaScript의 비동기 처리 패턴을 이해하는 것은 필수입니다.

## 콜백 지옥

\`\`\`javascript
// 이렇게 하면 안 됩니다
getData(function(a) {
  getMoreData(a, function(b) {
    getEvenMoreData(b, function(c) {
      console.log(c);
    });
  });
});
\`\`\`

## Promise

\`\`\`javascript
const fetchUser = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: "홍길동" });
      } else {
        reject(new Error("유효하지 않은 ID"));
      }
    }, 1000);
  });
};

fetchUser(1)
  .then(user => console.log(user))
  .catch(error => console.error(error));
\`\`\`

## async/await

Promise를 더 깔끔하게 사용할 수 있는 문법입니다.

\`\`\`javascript
const getUser = async (id) => {
  try {
    const user = await fetchUser(id);
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);
    return { user, posts, comments };
  } catch (error) {
    console.error("에러 발생:", error.message);
    throw error;
  }
};
\`\`\`

## 병렬 처리: Promise.all

\`\`\`javascript
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
]);
\`\`\`

## Promise.allSettled

실패한 것도 포함하여 모든 결과를 받을 수 있습니다.

\`\`\`javascript
const results = await Promise.allSettled([
  fetchUser(1),
  fetchUser(-1), // 실패
  fetchUser(3)
]);

results.forEach(result => {
  if (result.status === "fulfilled") {
    console.log("성공:", result.value);
  } else {
    console.log("실패:", result.reason);
  }
});
\`\`\`

> **핵심:** \`async/await\`는 Promise의 문법적 설탕(syntactic sugar)입니다. 내부적으로는 동일하게 Promise를 사용합니다.`,
  },
];

async function main() {
  // 첫 번째 사용자를 작성자로 사용
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('사용자가 없습니다. 먼저 회원가입을 해주세요.');
    process.exit(1);
  }

  console.log(`작성자: ${user.name} (ID: ${user.id})`);

  for (const post of posts) {
    const created = await prisma.post.create({
      data: {
        title: post.title,
        content: post.content,
        authorId: user.id,
      },
    });
    console.log(`생성됨: [${created.id}] ${created.title}`);
  }

  console.log('\n5개 게시글 생성 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
