/**
 * 심리테스트 & 이벤트 앱 로직
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    console.log('App initialized');
    updateStatusBoard();

    // 초기 화면: 로그인 페이지 렌더링
    renderLoginPage();
}

/**
 * 상단 현황판 업데이트
 */
function updateStatusBoard() {
    // 헤더 카운트 삭제로 인해 기능 제거 (필요 시 내부 로직만 유지)
}

/**
 * 유틸리티: 페이지 렌더링
 * @param {string} html 
 */
function render(html) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
}

/**
 * [페이지] 로그인 화면
 */
function renderLoginPage() {
    const html = `
        <div class="login-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">시작하기</h2>
            <p class="mt-2" style="color: #666;">간단한 심리테스트로 나를 알아보고<br>경품 추첨의 기회까지!</p>
            
            <div class="card mt-4" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div class="input-group" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">닉네임</label>
                    <input type="text" id="username" placeholder="닉네임 입력" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div class="input-group mt-2" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">비밀번호</label>
                    <input type="password" id="password" placeholder="비밀번호 입력" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>

                <div class="alert mt-2" style="background-color: #fff5f5; color: #e03131; padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; text-align: left;">
                    <strong>⚠️ 주의:</strong> 실제 사용하는 비밀번호를 입력하지 마세요!<br>1회성 테스트용 아이디/비밀번호를 생성해주세요.
                </div>

                <button onclick="handleLogin()" class="btn mt-4">시작하기</button>
                <button onclick="renderCheckWinnerPage()" class="btn btn-secondary mt-2" style="background-color: #f1f3f5; color: #495057;">지난주 당첨 확인하기</button>
            </div>
        </div>
    `;
    render(html);
}

// 로그인 처리
window.handleLogin = function () {
    const username = document.getElementById('username').value;

    if (!username) {
        alert('닉네임을 입력해주세요!');
        return;
    }

    // 더미 로그인 처리
    localStorage.setItem('currentUser', username);

    // 점수 초기화
    localStorage.setItem('currentScore', JSON.stringify({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }));

    // 다음 단계(심리테스트)로 이동
    renderTestIntroPage();
    console.log('Login success');
};

/**
 * [페이지] 테스트 소개 화면
 */
function renderTestIntroPage() {
    const html = `
        <div class="intro-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">심리테스트 시작</h2>
            <p class="mt-2" style="color: #666;">준비되셨나요? 솔직하게 답변해주세요.</p>
            <button onclick="startTest()" class="btn mt-4">테스트 시작하기</button>
        </div>
    `;
    render(html);
}

// 질문 데이터 (로컬 파일 실행 시 CORS 에러 방지를 위해 하드코딩)
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
    loadQuestions();
};

function loadQuestions() {
    // fetch 대신 상수 데이터 사용
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
        html += `<button onclick="handleAnswer(${currentIndex}, ${idx})" class="btn btn-secondary" style="background-color: white; border: 1px solid #ddd; color: #333; text-align: left; transition: all 0.2s;">${option.text}</button>`;
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
    // 결과 계산 (간단 예시: I vs E, T vs F 비교)
    const score = JSON.parse(localStorage.getItem('currentScore'));
    let type = '';
    type += (score.E > score.I) ? 'E' : 'I';

    // 간단히 E면 '인싸', I면 '집돌이' 로 매핑
    const resultTitle = (type.includes('E')) ? '🎉 활기찬 에너자이저' : '🛌 평화로운 집돌이';
    const resultDesc = (type.includes('E')) ? '사람들과 어울리는 것을 좋아하고 에너지가 넘치는 당신!' : '혼자만의 시간에서 에너지를 얻고 평화를 사랑하는 당신!';

    localStorage.setItem('testResult', JSON.stringify({ title: resultTitle, desc: resultDesc }));

    renderResultPage();
}

function renderResultPage() {
    const result = JSON.parse(localStorage.getItem('testResult'));

    const html = `
        <div class="result-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.8rem; font-weight: bold; color: var(--primary-color);">테스트 결과</h2>
            <p class="mt-2">당신의 성향은...</p>
            
            <div class="result-card mt-4" style="padding: 2rem; background: #f8f9fa; border-radius: 12px; border: 1px solid #eee;">
                <h3 style="font-size: 1.4rem; color: #333;">${result.title}</h3>
                <p class="mt-2" style="color: #666; word-break: keep-all;">${result.desc}</p>
            </div>

            <div class="ad-section mt-4" style="padding: 1.5rem; border: 2px dashed #ff6b6b; border-radius: 12px; background: #fff5f5;">
                <h4 style="font-weight: bold; color: #c92a2a;">🎁 경품 추첨 기회</h4>
                <p style="font-size: 0.9rem; margin-bottom: 1rem; color: #495057;">광고를 시청하면 추첨을 통해 기프티콘을 드립니다!</p>
                <button onclick="watchAd()" class="btn" style="background-color: #fa5252; box-shadow: 0 4px 6px rgba(250, 82, 82, 0.2);">광고 보고 추첨하기 (3초)</button>
            </div>
        </div>
    `;
    render(html);
}

window.watchAd = function () {
    // 광고 시청 시뮬레이션
    const btn = event.target;
    btn.disabled = true;
    btn.style.backgroundColor = '#ccc';
    btn.style.boxShadow = 'none';

    let timeLeft = 3;
    btn.innerText = `광고 시청 중... ${timeLeft}`;

    const timer = setInterval(() => {
        timeLeft--;
        btn.innerText = `광고 시청 중... ${timeLeft}`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            completeAdView();
        }
    }, 1000);
};

function completeAdView() {
    // 참여자 증가 처리
    let participants = parseInt(localStorage.getItem('participants')) || 1234;

    participants += 1;

    localStorage.setItem('participants', participants);
    updateStatusBoard();

    // 추첨 로직 제거 -> 응모 완료 처리
    // const isWinner = Math.random() < 0.3;
    // renderRaffleResult(isWinner);

    renderEntryComplete();
}

function renderEntryComplete() {
    const html = `
        <div class="raffle-result text-center">
            <h2 class="mt-4" style="font-size: 2rem; color: var(--primary-color);">🎉 응모 완료! 🎉</h2>
            <p class="mt-2" style="font-weight: bold;">경품 추첨에 정상적으로 응모되었습니다.</p>
            
            <div class="info-box mt-4" style="background: white; padding: 1.5rem; border: 1px solid #ddd; display: inline-block; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 90%;">
                 <h3 style="font-size: 1.1rem; font-weight: bold; color: #333;">📅 추첨 안내</h3>
                 <p class="mt-2" style="color: #555;">
                    추첨은 <strong>매주 월요일</strong>에 진행됩니다.<br>
                    입력하신 정보는 추첨 후 안전하게 자동 파기됩니다.
                 </p>
                 <div class="mt-3" style="font-size: 0.85rem; color: #868e96; background: #f8f9fa; padding: 0.8rem; border-radius: 6px; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div>응모자 ID: <strong>${localStorage.getItem('currentUser')}</strong></div>
                    <div style="border-top: 1px solid #eee; padding-top: 0.5rem;">현재 총 응모자 수: <strong style="color: var(--primary-color); font-size: 1rem;">${(parseInt(localStorage.getItem('participants')) || 1234).toLocaleString()}</strong>명</div>
                 </div>
            </div>
            
            <div class="mt-4">
                <button onclick="location.reload()" class="btn btn-secondary">확인</button>
            </div>
        </div>
    `;
    render(html);
}

// -----------------------------------------------------------
// [NEW] 당첨 확인 기능 (Check Winner)
// -----------------------------------------------------------

/**
 * [페이지] 당첨 확인 로그인 화면
 */
window.renderCheckWinnerPage = function () {
    const html = `
        <div class="login-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">당첨 확인</h2>
            <p class="mt-2" style="color: #666;">지난주 응모하신 내역을 확인합니다.</p>
            
            <div class="card mt-4" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div class="input-group" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">응모한 닉네임</label>
                    <input type="text" id="check-username" placeholder="닉네임 입력" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div class="input-group mt-2" style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">비밀번호</label>
                    <input type="password" id="check-password" placeholder="비밀번호 입력" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>

                <div class="mt-4">
                    <button onclick="handleCheckWinnerLogin()" class="btn">확인하기</button>
                    <button onclick="renderLoginPage()" class="btn btn-secondary mt-2" style="background-color: transparent; border: 1px solid #ddd; color: #666;">뒤로가기</button>
                </div>
            </div>
        </div>
    `;
    render(html);
};

/**
 * 당첨 확인 로직 처리
 */
window.handleCheckWinnerLogin = function () {
    const username = document.getElementById('check-username').value;
    const password = document.getElementById('check-password').value;

    if (!username || !password) {
        alert('닉네임과 비밀번호를 모두 입력해주세요.');
        return;
    }

    // 더미 데이터 검증 로직
    // ID '1', PW '1' -> 당첨
    // ID '2', PW '2' -> 낙첨
    if (username === '1' && password === '1') {
        renderWinnerResultPage(true); // 당첨
    } else if (username === '2' && password === '2') {
        renderWinnerResultPage(false); // 낙첨
    } else {
        alert('일치하는 응모 내역이 없거나 비밀번호가 틀렸습니다.');
    }
};

/**
 * [페이지] 당첨/낙첨 결과 화면
 */
function renderWinnerResultPage(isWinner) {
    let html = '';

    if (isWinner) {
        // 당첨 화면
        html = `
            <div class="raffle-result text-center">
                <h2 class="mt-4" style="font-size: 2rem; color: #2ecc71;">🎉 당첨입니다! 🎉</h2>
                <p class="mt-2" style="font-weight: bold;">축하합니다! 지난주 추첨에 당첨되셨습니다.</p>
                <p style="font-size: 0.9rem; color: #666;">아래 기프티콘을 캡처해서 사용하세요.</p>
                
                <div class="gift-box mt-4" style="background: white; padding: 1.5rem; border: 1px solid #ddd; display: inline-block; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                     <div style="width: 220px; height: 120px; background: #222; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; color: white; border-radius: 8px;">
                        🍗 치킨 기프티콘
                     </div>
                     <p class="mt-2" style="font-weight: bold; font-size: 1.1rem;">황금올리브 치킨 + 콜라 1.25L</p>
                     <p style="font-size: 0.9rem; color: #888; margin-top: 0.5rem; letter-spacing: 1px;">2026-02-01-W1</p>
                </div>
                
                <div class="mt-4">
                    <button onclick="renderLoginPage()" class="btn btn-secondary">메인으로 돌아가기</button>
                </div>
            </div>
        `;
    } else {
        // 낙첨 화면
        html = `
            <div class="raffle-result text-center">
                <h2 class="mt-4" style="font-size: 3rem;">😭</h2>
                <h3 class="mt-2" style="font-weight: bold; color: #495057;">아쉽게도... 꽝!</h3>
                <p class="mt-2" style="color: #666;">지난주 추첨에 당첨되지 않았습니다.</p>
                <p class="mt-1" style="font-size: 0.9rem; color: #868e96;">다음 기회에 다시 도전해주세요!</p>
                
                <div class="mt-4">
                    <button onclick="renderLoginPage()" class="btn mt-4">재도전하러 가기</button>
                </div>
            </div>
        `;
    }
    render(html);
}
