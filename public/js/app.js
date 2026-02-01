/**
 * 심리테스트 & 이벤트 앱 로직
 */

let TESTS_DATA = [];
let currentTestId = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('App initialized');
    initTheme();

    // 테스트 목록 데이터 로드
    try {
        const response = await fetch('./data/tests.json');
        TESTS_DATA = await response.json();
    } catch (e) {
        console.error('Failed to load tests data', e);
        // 폴백 데이터 (배포 전 로컬 테스트용)
        TESTS_DATA = [
            { id: 'work-animal', title: '직장인 생존 유형 테스트', category: '성격', description: '나는 회사에서 어떤 동물일까?', thumbnail: '🦁', participants: 12503, isNew: true },
            { id: 'love-cell', title: '숨겨진 연애 세포 테스트', category: '연애', description: '나의 연애 스타일은?', thumbnail: '💘', participants: 8420, isNew: false },
            { id: 'personal-color', title: '퍼스널 아우라 컬러 찾기', category: '자아', description: '나만의 아우라 컬러는?', thumbnail: '🌈', participants: 45100, isNew: true }
        ];
    }

    // 초기 화면: 메인 목록 페이지
    renderMainPage();
}

/**
 * [기능] 다크모드 토글
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerText = '☀️';
    }
}

window.toggleTheme = function () {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').innerText = isDark ? '☀️' : '🌙';
};

/**
 * 유틸리티: 페이지 렌더링
 */
function render(html) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
}

/**
 * [페이지] 메인 화면 (테스트 목록)
 */
function renderMainPage() {
    let html = `
        <div class="main-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">심리테스트 라운지</h2>
            <p class="mt-2" style="color: #666;">나를 알아가는 시간, 다양한 테스트를 즐겨보세요!</p>
            
            <div class="test-grid mt-4">
    `;

    TESTS_DATA.forEach(test => {
        html += `
            <div class="test-card" onclick="startTestFlow('${test.id}')">
                ${test.isNew ? '<span class="badge-new">NEW</span>' : '<span style="height:19px; display:block; margin-bottom:4px;"></span>'}
                <div class="test-thumbnail">${test.thumbnail}</div>
                <div class="test-title">${test.title}</div>
                <div class="test-participants">👀 ${test.participants.toLocaleString()}명 참여</div>
            </div>
        `;
    });

    html += `
            </div>
            
            <div class="mt-4">
                 <button onclick="renderCheckWinnerPage()" class="btn btn-secondary" style="background-color: transparent; border: 1px solid #ddd; color: #666;">지난주 당첨 확인하기</button>
            </div>
        </div>
    `;
    render(html);
}

/**
 * 테스트 시작 흐름
 */
window.startTestFlow = function (testId) {
    currentTestId = testId;
    // 로그인 없이 바로 인트로/질문으로 진입
    renderTestIntroPage();
};


/**
 * [페이지] 테스트 소개 화면
 */
function renderTestIntroPage() {
    const test = TESTS_DATA.find(t => t.id === currentTestId) || TESTS_DATA[0];

    const html = `
        <div class="intro-wrapper text-center">
            <div style="font-size: 4rem; margin-bottom: 1rem;">${test.thumbnail}</div>
            <h2 class="mt-2" style="font-size: 1.5rem; font-weight: bold;">${test.title}</h2>
            <p class="mt-2" style="color: #666; word-break: keep-all;">${test.description}</p>
            <div class="mt-4">
                <button onclick="startTest()" class="btn">테스트 시작하기</button>
                <button onclick="renderMainPage()" class="btn btn-secondary mt-2">목록으로</button>
            </div>
        </div>
    `;
    render(html);
}

// 질문 데이터 (공통 사용)
const QUESTIONS_DATA = [
    {
        "id": 1,
        "question": "갑자기 휴가가 생겼다! 당신의 선택은?",
        "options": [
            { "text": "집이 최고야! 밀린 넷플릭스 정주행", "score": { "I": 2, "E": 0 } },
            { "text": "친구들에게 연락해서 급 약속을 잡는다", "score": { "I": 0, "E": 2 } }
        ]
    },
    {
        "id": 2,
        "question": "처음 보는 모임 장소, 당신은?",
        "options": [
            { "text": "어색하지만 먼저 말을 걸어본다", "score": { "I": 0, "E": 2 } },
            { "text": "구석자리를 스캔하고 조용히 앉는다", "score": { "I": 2, "E": 0 } }
        ]
    },
    {
        "id": 3,
        "question": "친구가 우울해서 머리를 잘랐다고 한다. 당신의 반응은?",
        "options": [
            { "text": "왜? 무슨 일 있었어?", "score": { "F": 2, "T": 0 } },
            { "text": "잘 어울린다! 어디서 잘랐어?", "score": { "F": 0, "T": 2 } }
        ]
    }
];

window.startTest = function () {
    // 점수 초기화
    localStorage.setItem('currentScore', JSON.stringify({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }));
    loadQuestions();
};

function loadQuestions() {
    renderQuestionPage(QUESTIONS_DATA, 0);
}

function renderQuestionPage(questions, currentIndex) {
    if (currentIndex >= questions.length) {
        finishTest();
        return;
    }

    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    let html = `
        <div class="question-wrapper">
            <div class="progress-bar" style="width: 100%; height: 6px; background: #eee; border-radius: 3px; overflow: hidden; margin-bottom: 2rem;">
                <div style="width: ${progress}%; height: 100%; background: var(--primary-color); transition: width 0.3s;"></div>
            </div>
            
            <h3 class="mt-2" style="font-size: 1.3rem; font-weight: bold; margin-bottom: 2rem;">Q${currentIndex + 1}. ${question.question}</h3>
            
            <div class="options-list" style="display: flex; flex-direction: column; gap: 1rem;">
    `;

    question.options.forEach((option, idx) => {
        html += `<button onclick="handleAnswer(${currentIndex}, ${idx})" class="btn btn-secondary" style="background-color: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-color); text-align: left; transition: all 0.2s;">${option.text}</button>`;
    });

    html += `</div></div>`;

    window.currentQuestions = questions;
    render(html);
}

window.handleAnswer = function (questionIndex, optionIndex) {
    const questions = window.currentQuestions;
    const selectedOption = questions[questionIndex].options[optionIndex];

    // 점수 누적
    let currentScore = JSON.parse(localStorage.getItem('currentScore') || '{}');
    for (const [key, value] of Object.entries(selectedOption.score)) {
        currentScore[key] = (currentScore[key] || 0) + value;
    }
    localStorage.setItem('currentScore', JSON.stringify(currentScore));

    // 클릭 효과
    const btns = document.querySelectorAll('.options-list button');
    btns[optionIndex].style.backgroundColor = 'var(--primary-color)';
    btns[optionIndex].style.color = 'white';

    // 잠시 대기 후 넘어감
    setTimeout(() => {
        renderQuestionPage(questions, questionIndex + 1);
    }, 300);
};

function finishTest() {
    const score = JSON.parse(localStorage.getItem('currentScore'));
    let type = '';
    type += (score.E > score.I) ? 'E' : 'I';

    const resultTitle = (type.includes('E')) ? '🎉 활기찬 에너자이저' : '🛌 평화로운 집돌이';
    const resultDesc = (type.includes('E')) ? '사람들과 어울리는 것을 좋아하고 에너지가 넘치는 당신!' : '혼자만의 시간에서 에너지를 얻고 평화를 사랑하는 당신!';

    localStorage.setItem('testResult', JSON.stringify({ title: resultTitle, desc: resultDesc }));

    renderResultPage();
}

/**
 * [페이지] 결과 화면
 */
function renderResultPage() {
    const result = JSON.parse(localStorage.getItem('testResult'));

    const html = `
        <div class="result-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.8rem; font-weight: bold; color: var(--primary-color);">테스트 결과</h2>
            
            <div class="result-card mt-4" style="padding: 2rem; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color);">
                <h3 style="font-size: 1.4rem; color: var(--text-color);">${result.title}</h3>
                <p class="mt-2" style="color: var(--text-color); opacity: 0.8; word-break: keep-all;">${result.desc}</p>
            </div>

            <div class="mt-4">
                <button onclick="renderMainPage()" class="btn btn-secondary">다른 테스트 하러가기</button>
            </div>

            <div class="ad-section mt-4" style="padding: 1.5rem; border: 2px dashed #ff6b6b; border-radius: 12px; background: rgba(255, 107, 107, 0.1);">
                <h4 style="font-weight: bold; color: #fa5252;">🎁 경품 추첨 기회</h4>
                <p style="font-size: 0.9rem; margin-bottom: 1rem; opacity: 0.8;">결과를 저장하고 경품 추첨에 응모하세요!</p>
                <button onclick="renderEntryForm()" class="btn" style="background-color: #fa5252;">응모하고 혜택 받기</button>
            </div>
        </div>
    `;
    render(html);
}

/**
 * [페이지] 응모 정보 입력 화면 (구 로그인)
 */
window.renderEntryForm = function () {
    const html = `
        <div class="login-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">경품 응모</h2>
            <p class="mt-2" style="opacity: 0.7;">당첨자 발표 시 본인 확인을 위한 정보를 입력해 주세요.</p>
            
            <div class="card mt-4" style="background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow);">
                <div class="input-group" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">닉네임 (ID)</label>
                    <input type="text" id="username" placeholder="닉네임 입력" style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color); color: var(--text-color);">
                </div>
                
                <div class="input-group mt-2" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">비밀번호 (확인용)</label>
                    <input type="password" id="password" placeholder="비밀번호 입력" style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color); color: var(--text-color);">
                </div>

                <div class="alert mt-2" style="background-color: rgba(255, 0, 0, 0.1); color: #e03131; padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; text-align: left;">
                    <strong>⚠️ 1회성 정보:</strong> 실제 사용하는 비밀번호를 입력하지 마세요!
                </div>

                <button onclick="handleEntrySubmit()" class="btn mt-4">응모 완료하기</button>
                <button onclick="renderResultPage()" class="btn btn-secondary mt-2">뒤로가기</button>
            </div>
        </div>
    `;
    render(html);
};

window.handleEntrySubmit = function () {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('닉네임을 입력해주세요!');
        return;
    }

    // 유저 정보 저장
    localStorage.setItem('currentUser', username);

    // 참여자 수 증가 및 완료 처리
    let participants = parseInt(localStorage.getItem('participants')) || 12347;
    participants += 1;
    localStorage.setItem('participants', participants);

    renderEntryComplete();
};

function renderEntryComplete() {
    const html = `
        <div class="raffle-result text-center">
            <h2 class="mt-4" style="font-size: 2rem; color: var(--primary-color);">🎉 응모 완료! 🎉</h2>
            <p class="mt-2" style="font-weight: bold;">경품 추첨에 정상적으로 응모되었습니다.</p>
            
            <div class="info-box mt-4" style="background: var(--card-bg); padding: 1.5rem; border: 1px solid var(--border-color); display: inline-block; border-radius: 12px; box-shadow: var(--shadow); max-width: 90%;">
                 <h3 style="font-size: 1.1rem; font-weight: bold; color: var(--text-color);">📅 추첨 안내</h3>
                 <div class="mt-3" style="font-size: 0.85rem; opacity: 0.8; background: var(--bg-color); padding: 0.8rem; border-radius: 6px; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div>응모자 ID: <strong>${localStorage.getItem('currentUser')}</strong></div>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem;">현재 총 응모자 수: <strong style="color: var(--primary-color); font-size: 1rem;">${(parseInt(localStorage.getItem('participants')) || 0).toLocaleString()}</strong>명</div>
                 </div>
            </div>
            
            <div class="mt-4">
                <button onclick="renderMainPage()" class="btn">메인으로 돌아가기</button>
            </div>
        </div>
    `;
    render(html);
}

// -----------------------------------------------------------
// 당첨 확인 기능
// -----------------------------------------------------------
window.renderCheckWinnerPage = function () {
    const html = `
        <div class="login-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">당첨 확인</h2>
            <p class="mt-2" style="opacity: 0.7;">지난주 응모하신 내역을 확인합니다.</p>
            
            <div class="card mt-4" style="background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow);">
                <div class="input-group" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">응모한 닉네임</label>
                    <input type="text" id="check-username" placeholder="닉네임 입력" style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color); color: var(--text-color);">
                </div>
                
                <div class="input-group mt-2" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">비밀번호</label>
                    <input type="password" id="check-password" placeholder="비밀번호 입력" style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color); color: var(--text-color);">
                </div>

                <div class="mt-4">
                    <button onclick="handleCheckWinnerLogin()" class="btn">확인하기</button>
                    <button onclick="renderMainPage()" class="btn btn-secondary mt-2" style="background-color: transparent; border: 1px solid var(--border-color); color: var(--text-color);">뒤로가기</button>
                </div>
            </div>
        </div>
    `;
    render(html);
};

window.handleCheckWinnerLogin = function () {
    const username = document.getElementById('check-username').value;
    const password = document.getElementById('check-password').value;

    if (!username || !password) {
        alert('닉네임과 비밀번호를 모두 입력해주세요.');
        return;
    }

    if (username === '1' && password === '1') {
        renderWinnerResultPage(true);
    } else if (username === '2' && password === '2') {
        renderWinnerResultPage(false);
    } else {
        alert('일치하는 응모 내역이 없거나 비밀번호가 틀렸습니다.');
    }
};

function renderWinnerResultPage(isWinner) {
    let html = '';
    if (isWinner) {
        html = `
            <div class="raffle-result text-center">
                <h2 class="mt-4" style="font-size: 2rem; color: #2ecc71;">🎉 당첨입니다! 🎉</h2>
                <div class="gift-box mt-4" style="background: var(--card-bg); padding: 1.5rem; border: 1px solid var(--border-color); display: inline-block; border-radius: 12px; box-shadow: var(--shadow);">
                     <div style="width: 220px; height: 120px; background: #222; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; color: white; border-radius: 8px;">
                        🍗 치킨 기프티콘
                     </div>
                     <p class="mt-2" style="font-weight: bold; font-size: 1.1rem; color: var(--text-color);">황금올리브 치킨 + 콜라 1.25L</p>
                </div>
                <div class="mt-4">
                    <button onclick="renderMainPage()" class="btn btn-secondary">메인으로 돌아가기</button>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="raffle-result text-center">
                <h2 class="mt-4" style="font-size: 3rem;">😭</h2>
                <h3 class="mt-2" style="font-weight: bold; color: var(--text-color);">아쉽게도... 꽝!</h3>
                <div class="mt-4">
                    <button onclick="renderMainPage()" class="btn mt-4">재도전하러 가기</button>
                </div>
            </div>
        `;
    }
    render(html);
}
