/**
 * 심리테스트 & 이벤트 앱 로직
 * [데이터 기반 엔진] 코드 수정 없이 JSON 파일 추가만으로 새로운 테스트 생성이 가능합니다.
 */

let TESTS_DATA = [];
let currentTestId = null;
let currentQuestions = [];
let currentResultData = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('App initialized');
    initTheme();

    // 1. 메인 테스트 목록 로드
    try {
        const response = await fetch('./data/tests.json');
        TESTS_DATA = await response.json();

        // 2. Firebase(Firestore)에서 참여자 수 동기화
        if (window.db) {
            try {
                const { doc, getDoc } = window.fbUtils;
                const statsRef = doc(window.db, "stats", "global");
                const statsSnap = await getDoc(statsRef);

                if (statsSnap.exists()) {
                    const data = statsSnap.data();
                    // Firestore 데이터를 기반으로 TESTS_DATA의 참여자 수 업데이트
                    TESTS_DATA.forEach(test => {
                        if (data.participantsPerTest && data.participantsPerTest[test.id]) {
                            test.participants = data.participantsPerTest[test.id];
                        }
                    });
                }
            } catch (err) {
                console.error("Firestore loading error:", err);
            }
        }
    } catch (e) {
        console.error('Failed to load tests data', e);
        // 기본 폴백 데이터
        TESTS_DATA = [
            { id: 'work-animal', title: '직장인 생존 유형 테스트', category: '성격', thumbnail: './images/thumbnails/work-animal.png', participants: 12503, isNew: true }
        ];
    }

    renderMainPage();
}

/**
 * [기능] 다크모드 설정
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerText = '☀️ 라이트 모드';
    }
}

window.toggleTheme = function () {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').innerText = isDark ? '☀️ 라이트 모드' : '🌙 다크 모드';
};

/**
 * 유틸리티: 페이지 렌더링
 */
function render(html) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
    window.scrollTo(0, 0);
}

/**
 * [페이지] 메인 화면 (테스트 목록)
 */
window.renderMainPage = function () {
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
                <div class="test-thumbnail">
                    <img src="${test.thumbnail}" alt="${test.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
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
};

/**
 * [흐름] 테스트 시작 (데이터 동적 로드)
 */
window.startTestFlow = async function (testId) {
    currentTestId = testId;
    localStorage.setItem('currentTestId', testId); // 안전을 위해 브라우저에 저장

    // 해당 테스트의 질문과 결과 데이터를 각각의 JSON 파일에서 로드
    try {
        const [qRes, rRes] = await Promise.all([
            fetch(`./data/questions/${testId}.json`),
            fetch(`./data/results/${testId}.json`)
        ]);

        if (!qRes.ok || !rRes.ok) throw new Error('Data not found');

        currentQuestions = await qRes.json();
        currentResultData = await rRes.json();

        renderTestIntroPage();
    } catch (e) {
        console.error('해당 테스트 데이터를 찾을 수 없습니다.', e);
        alert('준비 중인 테스트입니다!');
    }
};

/**
 * [페이지] 테스트 소개 화면
 */
function renderTestIntroPage() {
    const test = TESTS_DATA.find(t => t.id === currentTestId);

    const html = `
        <div class="intro-wrapper text-center">
            <div class="intro-thumbnail-container" style="max-width: 300px; margin: 0 auto 1.5rem auto; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow);">
                <img src="${test ? test.thumbnail : ''}" alt="${test ? test.title : ''}" style="width: 100%; height: auto; display: block;">
            </div>
            <h2 class="mt-2" style="font-size: 1.5rem; font-weight: bold;">${test ? test.title : '심리테스트'}</h2>
            <p class="mt-2" style="color: #666; word-break: keep-all;">${(test && test.description) || '재미있는 심리테스트를 시작해보세요!'}</p>
            <div class="mt-4">
                <button onclick="startTest()" class="btn">테스트 시작하기</button>
                <button onclick="renderMainPage()" class="btn btn-secondary mt-2">목록으로</button>
            </div>
        </div>
    `;
    render(html);
}

/**
 * [흐름] 질문 진행
 */
window.startTest = function () {
    localStorage.setItem('currentScore', JSON.stringify({}));
    renderQuestionPage(0);
};

function renderQuestionPage(currentIndex) {
    if (currentIndex >= currentQuestions.length) {
        calculateAndShowResult();
        return;
    }

    const question = currentQuestions[currentIndex];
    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

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
    render(html);
}

window.handleAnswer = function (questionIndex, optionIndex) {
    const selectedOption = currentQuestions[questionIndex].options[optionIndex];

    // 점수 합산 로직 (가중치 방식)
    let score = JSON.parse(localStorage.getItem('currentScore') || '{}');
    if (selectedOption.score) {
        for (const [key, val] of Object.entries(selectedOption.score)) {
            score[key] = (score[key] || 0) + val;
        }
    }
    localStorage.setItem('currentScore', JSON.stringify(score));

    // 버튼 효과 후 다음 질문
    const btns = document.querySelectorAll('.options-list button');
    btns[optionIndex].style.backgroundColor = 'var(--primary-color)';
    btns[optionIndex].style.color = 'white';

    setTimeout(() => {
        renderQuestionPage(questionIndex + 1);
    }, 300);
};

/**
 * [계산] 다차원 결과 도출 로직 (MBTI 스타일)
 */
function calculateAndShowResult() {
    const score = JSON.parse(localStorage.getItem('currentScore'));

    // 지표 쌍 정의 (E-I, S-N, T-F, J-P)
    const pairs = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
    let typeKey = '';

    pairs.forEach(([a, b]) => {
        const scoreA = score[a] || 0;
        const scoreB = score[b] || 0;
        if (scoreA > 0 || scoreB > 0) {
            typeKey += (scoreA >= scoreB) ? a : b;
        }
    });

    // 결과 데이터에서 매칭 (완전 일치 -> 부분 일치 순으로 탐색)
    let finalResult = currentResultData.types[typeKey];

    if (!finalResult) {
        // 일치하는 키가 없으면 결과 데이터의 키들을 뒤져서 포함된 것 중 첫 번째를 찾거나 default 사용
        const availableKeys = Object.keys(currentResultData.types);
        const match = availableKeys.find(key => typeKey.includes(key) || key.includes(typeKey));
        finalResult = match ? currentResultData.types[match] : currentResultData.default;
    }

    localStorage.setItem('testResult', JSON.stringify(finalResult));
    renderResultChoicePage();
}

/**
 * [페이지] 결과 진입 선택 화면
 */
function renderResultChoicePage() {
    const html = `
        <div class="choice-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">테스트 완료!</h2>
            <p class="mt-2" style="color: #666;">결과를 확인하는 방법을 선택해주세요.</p>
            
            <div class="mt-4" style="display: flex; flex-direction: column; gap: 1rem;">
                <button onclick="renderResultPage()" class="btn btn-secondary" style="background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-color); padding: 1.5rem; border-radius: 12px;">
                    <span style="display: block; font-size: 1.1rem; font-weight: bold; margin-bottom: 0.3rem;">🔓 결과 보러가기</span>
                    <span style="font-size: 0.85rem; opacity: 0.7;">광고 없이 바로 결과를 확인합니다.</span>
                </button>

                <button onclick="startAdAndEntry()" class="btn" style="padding: 1.5rem; border-radius: 12px; background: var(--primary-color);">
                    <span style="display: block; font-size: 1.1rem; font-weight: bold; margin-bottom: 0.3rem;">🎁 경품 응모하고 결과보기</span>
                    <span style="font-size: 0.85rem; opacity: 0.9;">짧은 광고 후 경품 추천 기회를 드려요!</span>
                </button>
            </div>
        </div>
    `;
    render(html);
}

/**
 * [흐름] 광고 시뮬레이션 후 응모 폼으로 이동
 */
window.startAdAndEntry = function () {
    let progress = 0;
    let html = `
        <div class="ad-simulation text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">혜택을 확인하고 있습니다...</h2>
            <p class="mt-2" style="color: #666;">잠시만 기다려주시면 응모 페이지로 연결됩니다.</p>
            
            <div class="mt-4" style="width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden;">
                <div id="ad-progress" style="width: 0%; height: 100%; background: var(--primary-color); transition: width 0.1s linear;"></div>
            </div>
            
            <div class="mt-4" style="padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); opacity: 0.5;">
                <p>전면 광고가 노출되는 영역입니다.</p>
                <div style="font-size: 3rem; margin-top: 1rem;">📺</div>
            </div>
        </div>
    `;
    render(html);

    const interval = setInterval(() => {
        progress += 5;
        const bar = document.getElementById('ad-progress');
        if (bar) bar.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                renderEntryForm();
            }, 500);
        }
    }, 150);
};

/**
 * [페이지] 결과 화면 (업데이트: 궁합, 공유, 도감)
 */
function renderResultPage() {
    const result = JSON.parse(localStorage.getItem('testResult'));
    if (!result) {
        alert('결과 데이터를 찾을 수 없습니다.');
        renderMainPage();
        return;
    }

    const html = `
        <div class="result-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.8rem; font-weight: bold; color: var(--primary-color);">테스트 결과</h2>
            
            <div id="capture-area" class="result-card mt-4" style="padding: 2rem; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color);">
                <h3 style="font-size: 1.4rem; color: var(--text-color); margin-bottom: 1rem;">${result.title}</h3>
                <p class="mt-2" style="color: var(--text-color); opacity: 0.8; word-break: keep-all; margin-bottom: 2rem;">${result.desc}</p>
                
                <div class="compatibility-box" style="display: flex; gap: 10px; justify-content: center; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                    <div style="flex: 1; padding: 10px; background: rgba(46, 204, 113, 0.1); border-radius: 8px;">
                        <span style="display: block; font-size: 0.8rem; color: #2ecc71; font-weight: bold;">환상의 궁합 💖</span>
                        <span style="font-size: 0.9rem;">${result.bestMatch || '-'}</span>
                    </div>
                    <div style="flex: 1; padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 8px;">
                        <span style="display: block; font-size: 0.8rem; color: #e74c3c; font-weight: bold;">환장의 궁합 💔</span>
                        <span style="font-size: 0.9rem;">${result.worstMatch || '-'}</span>
                    </div>
                </div>
            </div>

            <div class="action-buttons mt-4" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="shareLink()" class="btn btn-secondary" style="flex: 1; min-width: 140px;">🔗 링크 공유</button>
                <button onclick="saveImage()" class="btn btn-secondary" style="flex: 1; min-width: 140px;">📸 이미지 저장</button>
            </div>
            
            <div class="mt-3">
                 <button onclick="renderAllResultsPage()" class="btn btn-secondary" style="width: 100%; border: 1px solid var(--primary-color); color: var(--primary-color); background: transparent;">📚 전체 결과 도감 보기</button>
            </div>

            <div class="mt-4">
                <button onclick="renderMainPage()" class="btn btn-secondary">메인으로 돌아가기</button>
            </div>
        </div>
    `;
    render(html);
}

/**
 * [기능] 전체 결과 도감 보기
 */
window.renderAllResultsPage = function () {
    if (!currentResultData || !currentResultData.types) {
        alert('결과 데이터를 불러올 수 없습니다.');
        return;
    }

    let html = `
        <div class="collection-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">전체 결과 도감</h2>
            <p class="mt-2" style="opacity: 0.7;">모든 유형을 한눈에 확인해보세요!</p>
            <div class="mt-4" style="display: flex; flex-direction: column; gap: 1rem;">
    `;

    Object.values(currentResultData.types).forEach(type => {
        html += `
            <div class="result-card" style="padding: 1.5rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); text-align: left;">
                <h4 style="font-weight: bold; color: var(--primary-color); margin-bottom: 0.5rem;">${type.title}</h4>
                <p style="font-size: 0.9rem; margin-bottom: 0.3rem;">${type.desc}</p>
                <div style="font-size: 0.8rem; opacity: 0.8;">
                    💖 ${type.bestMatch || '-'} / 💔 ${type.worstMatch || '-'}
                </div>
            </div>
        `;
    });

    html += `
            </div>
            <div class="mt-4">
                <button onclick="renderResultPage()" class="btn">내 결과로 돌아가기</button>
            </div>
        </div>
    `;
    render(html);
};

/**
 * [기능] 공유하기 (링크)
 */
window.shareLink = function () {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('링크가 복사되었습니다! 친구들에게 공유해보세요.');
    }).catch(err => {
        console.error('복사 실패', err);
        alert('링크 복사에 실패했습니다.');
    });
};

/**
 * [기능] 이미지 저장 (html2canvas)
 */
window.saveImage = function () {
    const element = document.getElementById('capture-area');
    if (!element) return;

    const originalBtnText = event.target.innerText;
    event.target.innerText = '저장 중...';

    html2canvas(element, { useCORS: true, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `test-result-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        event.target.innerText = originalBtnText;
    }).catch(err => {
        console.error('캡처 실패', err);
        alert('이미지 저장에 실패했습니다.');
        event.target.innerText = originalBtnText;
    });
};

/**
 * [페이지] 응모 폼 (구 로그인)
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

                <button onclick="handleEntrySubmit()" class="btn mt-4">응모 완료하고 결과 보기</button>
                <button onclick="renderResultChoicePage()" class="btn btn-secondary mt-2">뒤로가기</button>
            </div>
        </div>
    `;
    render(html);
};

window.handleEntrySubmit = async function () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (!username) { alert('닉네임을 입력해주세요!'); return; }
    if (!password) { alert('비밀번호를 입력해주세요!'); return; }

    // 테스트 ID 복구 (안전장치)
    if (!currentTestId) {
        currentTestId = localStorage.getItem('currentTestId');
    }

    if (!currentTestId) {
        alert('테스트 정보가 손실되었습니다. 메인화면으로 이동합니다.');
        renderMainPage();
        return;
    }

    // 1. 결과 저장 (Firestore)
    if (window.db) {
        const { doc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } = window.fbUtils;

        try {
            // 응모 내역 저장
            await addDoc(collection(window.db, "entries"), {
                username,
                password,
                testId: currentTestId,
                result: JSON.parse(localStorage.getItem('testResult')),
                timestamp: serverTimestamp()
            });

            // 전역 참여자 수 업데이트
            const statsRef = doc(window.db, "stats", "global");
            const updateObj = {
                totalParticipants: increment(1)
            };
            updateObj[`participantsPerTest.${currentTestId}`] = increment(1);

            await updateDoc(statsRef, updateObj).catch(async (e) => {
                if (e.code === 'not-found') {
                    const initialData = { totalParticipants: 1 };
                    initialData.participantsPerTest = {};
                    initialData.participantsPerTest[currentTestId] = 1;
                    await setDoc(statsRef, initialData);
                }
            });
            console.log('Firebase 데이터 저장 완료');
        } catch (e) {
            console.error('Firebase 저장 실패', e);
        }
    }

    localStorage.setItem('currentUser', username);

    // 참여자 수 업데이트 (로컬 반영)
    if (TESTS_DATA && TESTS_DATA.length) {
        const testIdx = TESTS_DATA.findIndex(t => t.id === currentTestId);
        if (testIdx !== -1) TESTS_DATA[testIdx].participants++;
    }

    renderEntryComplete();
};

function renderEntryComplete() {
    // currentTestId가 없을 경우 복구 시도
    if (!currentTestId) {
        currentTestId = localStorage.getItem('currentTestId');
    }

    const test = TESTS_DATA.find(t => t.id === currentTestId);

    const html = `
        <div class="raffle-result text-center">
            <h2 class="mt-4" style="font-size: 2rem; color: var(--primary-color);">🎉 응모 완료! 🎉</h2>
            <div class="info-box mt-4" style="background: var(--card-bg); padding: 1.5rem; border: 1px solid var(--border-color); display: inline-block; border-radius: 12px; box-shadow: var(--shadow); max-width: 90%;">
                 <div>응모자 ID: <strong>${localStorage.getItem('currentUser') || '익명'}</strong></div>
                 <div style="border-top: 1px solid var(--border-color); margin-top: 0.5rem; padding-top: 0.5rem;">이 테스트 참여자: <strong>${(test ? test.participants : 0).toLocaleString()}</strong>명</div>
            </div>
            <div class="mt-4">
                <button onclick="renderResultPage()" class="btn">최종 결과 확인하기</button>
            </div>
        </div>
    `;
    render(html);
}

// 당첨 확인 (1,1 당첨 / 2,2 꽝 / 나머지 오류)
window.renderCheckWinnerPage = function () {
    const html = `
        <div class="login-wrapper text-center">
            <h2 class="mt-4" style="font-size: 1.5rem; font-weight: bold;">당첨 확인</h2>
            <div class="card mt-4" style="background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow);">
                <input type="text" id="check-username" placeholder="닉네임" style="width: 100%; padding: 0.8rem; margin-bottom: 0.5rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                <input type="password" id="check-password" placeholder="비밀번호" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                <button onclick="handleCheckWinnerLogin()" class="btn mt-4">확인하기</button>
                <button onclick="renderMainPage()" class="btn btn-secondary mt-2">홈으로</button>
            </div>
        </div>
    `;
    render(html);
};

window.handleCheckWinnerLogin = function () {
    const u = document.getElementById('check-username').value;
    const p = document.getElementById('check-password').value;
    if (u === '1' && p === '1') renderWinnerResultPage(true);
    else if (u === '2' && p === '2') renderWinnerResultPage(false);
    else alert('정보가 올바르지 않습니다.');
};

function renderWinnerResultPage(isWinner) {
    let html = isWinner ? `
        <div class="raffle-result text-center">
            <h2 class="mt-4" style="font-size: 2rem; color: #2ecc71;">🎉 당첨! 🎉</h2>
            <div class="gift-box mt-4" style="padding: 1.5rem; background: var(--card-bg); border-radius: 12px;">치킨 기프티콘 🍗</div>
            <button onclick="renderMainPage()" class="btn mt-4">메인으로</button>
        </div>` : `
        <div class="raffle-result text-center">
            <h2 class="mt-4" style="font-size: 3rem;">😭 꽝!</h2>
            <button onclick="renderMainPage()" class="btn mt-4">다음에 또 도전!</button>
        </div>`;
    render(html);
}
