/* ========================================
   Rizz Score - App Logic
   12 scenario-based questions
   Score 0-100, 5 tiers
   ======================================== */

(async function () {
  try {
    // Wait for i18n
    await i18n.loadTranslations(i18n.currentLang);
    i18n.updateUI();

    // --- Constants ---
    var TOTAL_QUESTIONS = 12;
    // Points per option: each question has 4 choices worth different points
    // Max per question ~8, total max = 96 -> scale to 100
    var pointMap = [
      // q1: Someone attractive looks at you across the room
      [8, 5, 2, 0],
      // q2: Your crush sends a vague text
      [2, 8, 0, 5],
      // q3: You're at a party and don't know anyone
      [5, 0, 8, 2],
      // q4: Your date spills their drink
      [0, 2, 5, 8],
      // q5: A friend asks you to wingman
      [8, 2, 5, 0],
      // q6: Awkward silence on a first date
      [5, 8, 0, 2],
      // q7: You get a compliment from a stranger
      [2, 0, 8, 5],
      // q8: Your ex's friend starts flirting
      [8, 5, 2, 0],
      // q9: You need to make a toast at a party
      [0, 2, 5, 8],
      // q10: Someone you like posts a story
      [5, 0, 8, 2],
      // q11: Your friend dares you to talk to someone
      [2, 5, 0, 8],
      // q12: End of a great date
      [8, 2, 5, 0]
    ];

    // --- State ---
    var currentQuestion = 0;
    var totalPoints = 0;

    // --- DOM Elements ---
    var startScreen = document.getElementById('start-screen');
    var quizScreen = document.getElementById('quiz-screen');
    var resultScreen = document.getElementById('result-screen');
    var startBtn = document.getElementById('start-btn');
    var progressFill = document.getElementById('progress-fill');
    var currentQEl = document.getElementById('current-q');
    var totalQEl = document.getElementById('total-q');
    var questionText = document.getElementById('question-text');
    var optionsContainer = document.getElementById('options-container');
    var quizCard = document.querySelector('.quiz-card');
    var themeToggle = document.getElementById('theme-toggle');
    var langSelect = document.getElementById('lang-select');
    var retakeBtn = document.getElementById('retake-btn');
    var shareTwitter = document.getElementById('share-twitter');
    var shareCopy = document.getElementById('share-copy');
    var meterArc = document.getElementById('meter-arc');
    var scoreNumber = document.getElementById('score-number');

    // Add SVG gradient definition
    var svg = document.querySelector('.score-meter');
    if (svg) {
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      var gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', 'meter-gradient');
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');
      var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#FF6B35');
      var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#FFD166');
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      svg.insertBefore(defs, svg.firstChild);
    }

    // --- Theme ---
    function initTheme() {
      var saved = localStorage.getItem('theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }

    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    initTheme();

    // --- Language ---
    langSelect.value = i18n.currentLang;

    langSelect.addEventListener('change', async function () {
      await i18n.setLanguage(this.value);
      if (quizScreen.classList.contains('active')) {
        renderQuestion(currentQuestion);
      }
      if (resultScreen.classList.contains('active')) {
        showResult(totalPoints);
      }
    });

    // --- Screen Navigation ---
    function showScreen(screen) {
      [startScreen, quizScreen, resultScreen].forEach(function (s) {
        s.classList.remove('active');
      });
      screen.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Start Quiz ---
    startBtn.addEventListener('click', function () {
      currentQuestion = 0;
      totalPoints = 0;
      showScreen(quizScreen);
      renderQuestion(0);
    });

    // --- Render Question ---
    function renderQuestion(index) {
      var qNum = index + 1;
      currentQEl.textContent = qNum;
      totalQEl.textContent = TOTAL_QUESTIONS;
      progressFill.style.width = ((qNum / TOTAL_QUESTIONS) * 100) + '%';

      var qKey = 'questions.q' + qNum + '.text';
      questionText.textContent = i18n.t(qKey);

      optionsContainer.innerHTML = '';
      var optionKeys = ['a', 'b', 'c', 'd'];

      optionKeys.forEach(function (key, idx) {
        var btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = i18n.t('questions.q' + qNum + '.options.' + key);
        btn.addEventListener('click', function () {
          selectOption(index, idx);
        });
        optionsContainer.appendChild(btn);
      });
    }

    // --- Select Option ---
    function selectOption(questionIndex, optionIndex) {
      var points = pointMap[questionIndex][optionIndex];
      totalPoints += points;

      // Highlight selected
      var buttons = optionsContainer.querySelectorAll('.option-btn');
      buttons[optionIndex].classList.add('selected');

      // Disable all buttons
      buttons.forEach(function (btn) {
        btn.disabled = true;
      });

      // Next question or result
      setTimeout(function () {
        if (currentQuestion < TOTAL_QUESTIONS - 1) {
          currentQuestion++;
          quizCard.classList.add('slide-out');
          setTimeout(function () {
            renderQuestion(currentQuestion);
            quizCard.classList.remove('slide-out');
            quizCard.classList.add('slide-in');
            setTimeout(function () {
              quizCard.classList.remove('slide-in');
            }, 300);
          }, 300);
        } else {
          // Scale to 0-100
          var finalScore = Math.round((totalPoints / 96) * 100);
          if (finalScore > 100) finalScore = 100;
          showScreen(resultScreen);
          showResult(finalScore);
        }
      }, 400);
    }

    // --- Get Tier ---
    function getTier(score) {
      if (score >= 90) return 'legendary';
      if (score >= 70) return 'certified';
      if (score >= 50) return 'solid';
      if (score >= 30) return 'undercover';
      return 'unspoken';
    }

    // --- Tier Emojis ---
    var tierEmojis = {
      legendary: '\u{1F451}',
      certified: '\u{1F60E}',
      solid: '\u{1F331}',
      undercover: '\u{1F575}\uFE0F',
      unspoken: '\u{1F30C}'
    };

    // --- Animate Score Counter ---
    function animateCounter(target, duration) {
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(eased * target);
        scoreNumber.textContent = current;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }

    // --- Animate Meter Arc ---
    function animateMeter(score) {
      // Circle circumference = 2 * PI * r = 2 * 3.14159 * 85 = 534.07
      var circumference = 534;
      var offset = circumference - (circumference * score / 100);
      // Reset first
      meterArc.style.strokeDashoffset = circumference;
      // Trigger reflow
      void meterArc.offsetWidth;
      // Animate
      setTimeout(function () {
        meterArc.style.strokeDashoffset = offset;
      }, 100);
    }

    // --- Show Result ---
    function showResult(score) {
      var tier = getTier(score);

      // Emoji
      document.getElementById('result-emoji').textContent = tierEmojis[tier];

      // Animate score
      animateCounter(score, 2000);

      // Animate meter
      animateMeter(score);

      // Tier name
      document.getElementById('result-tier').textContent = i18n.t('results.' + tier + '.name');

      // Archetype
      document.getElementById('result-archetype').textContent =
        '"' + i18n.t('results.' + tier + '.archetype') + '"';

      // Description
      document.getElementById('result-desc').textContent = i18n.t('results.' + tier + '.description');

      // Tips
      var tipsList = document.getElementById('result-tips');
      tipsList.innerHTML = '';
      var tips = i18n.t('results.' + tier + '.tips');
      if (Array.isArray(tips)) {
        tips.forEach(function (tip) {
          var li = document.createElement('li');
          li.textContent = tip;
          tipsList.appendChild(li);
        });
      }

      // GA4 event
      if (typeof gtag === 'function') {
        gtag('event', 'quiz_complete', {
          event_category: 'rizz_score',
          event_label: tier,
          value: score
        });
      }
    }

    // --- Share: Twitter ---
    shareTwitter.addEventListener('click', function () {
      var score = parseInt(scoreNumber.textContent) || 0;
      var tier = getTier(score);
      var tierName = i18n.t('results.' + tier + '.name');
      var emoji = tierEmojis[tier];
      var shareText = i18n.t('share.text');
      var text = emoji + ' ' + shareText.replace('{score}', score).replace('{tier}', tierName);
      var url = 'https://dopabrain.com/rizz-score/';
      window.open(
        'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url),
        '_blank',
        'noopener'
      );
    });

    // --- Share: Copy Link ---
    shareCopy.addEventListener('click', function () {
      var url = 'https://dopabrain.com/rizz-score/';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showToast(i18n.t('share.copied'));
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(i18n.t('share.copied'));
      }
    });

    // --- Toast ---
    function showToast(message) {
      var existing = document.querySelector('.toast');
      if (existing) existing.remove();

      var toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);

      requestAnimationFrame(function () {
        toast.classList.add('show');
      });

      setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () {
          toast.remove();
        }, 300);
      }, 2000);
    }

    // --- Retake ---
    retakeBtn.addEventListener('click', function () {
      currentQuestion = 0;
      totalPoints = 0;
      showScreen(startScreen);
    });

    // --- Hide Loader ---
    var loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hidden');
    }

  } catch (e) {
    // i18n or init error - hide loader anyway
    console.error('App init error:', e);
    var loader = document.getElementById('app-loader');
    if (loader) loader.classList.add('hidden');
  }
})();
