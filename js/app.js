/* ========================================
   Rizz Score - Charm Audition Stage
   10 rounds, 3 judges, performance scoring
   ======================================== */

(async function () {
  try {
    // Wait for i18n
    await i18n.loadTranslations(i18n.currentLang);
    i18n.updateUI();

    // --- Constants ---
    var TOTAL_ROUNDS = 10;

    // Judge personalities affect scoring differently per choice
    // Each round has 3 choices. Each judge scores 1-10 for each choice.
    // Format: [witScore, depthScore, humorScore]
    var JUDGE_SCORES = [
      // Round 1: Party entrance
      [[8, 5, 7], [5, 9, 4], [9, 3, 10]],
      // Round 2: Crush texts you
      [[9, 6, 5], [4, 10, 3], [7, 4, 9]],
      // Round 3: Awkward silence on date
      [[6, 8, 5], [8, 10, 4], [10, 3, 9]],
      // Round 4: Someone flirts with your date
      [[9, 7, 6], [5, 10, 4], [7, 5, 10]],
      // Round 5: Karaoke challenge
      [[5, 4, 9], [8, 9, 5], [10, 3, 8]],
      // Round 6: Elevator with celebrity crush
      [[10, 5, 6], [4, 9, 5], [7, 4, 10]],
      // Round 7: Friend's embarrassing story told publicly
      [[8, 7, 5], [5, 10, 6], [9, 4, 10]],
      // Round 8: Caught staring
      [[9, 6, 7], [5, 10, 4], [8, 3, 10]],
      // Round 9: Rival appears
      [[7, 8, 6], [6, 10, 5], [10, 4, 9]],
      // Round 10: Grand finale - the confession
      [[10, 7, 5], [5, 10, 6], [7, 5, 10]]
    ];

    // Scenario icons
    var SCENARIO_ICONS = [
      '\u{1F389}', // party
      '\u{1F4F1}', // phone
      '\u{1F60B}', // date
      '\u{1F525}', // flirt
      '\u{1F3A4}', // karaoke
      '\u{1F6D7}', // elevator
      '\u{1F605}', // embarrassing
      '\u{1F440}', // caught
      '\u{1F3AD}', // rival
      '\u{1F496}'  // confession
    ];

    // Judge reaction emojis based on score
    var JUDGE_REACTIONS = {
      wit: { high: '\u{1F60E}', mid: '\u{1F914}', low: '\u{1F612}' },
      depth: { high: '\u{1F9D0}', mid: '\u{1F914}', low: '\u{1F615}' },
      humor: { high: '\u{1F923}', mid: '\u{1F642}', low: '\u{1F611}' }
    };

    // --- State ---
    var currentRound = 0;
    var roundScores = []; // [{wit, depth, humor}]
    var totalWit = 0;
    var totalDepth = 0;
    var totalHumor = 0;

    // --- DOM Elements ---
    var startScreen = document.getElementById('start-screen');
    var auditionScreen = document.getElementById('audition-screen');
    var resultScreen = document.getElementById('result-screen');
    var startBtn = document.getElementById('start-btn');
    var progressFill = document.getElementById('progress-fill');
    var roundNum = document.getElementById('round-num');
    var scenarioIcon = document.getElementById('scenario-icon');
    var scenarioText = document.getElementById('scenario-text');
    var choicesContainer = document.getElementById('choices-container');
    var auditionCard = document.querySelector('.audition-card');
    var liveScore = document.getElementById('live-score');
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
      if (auditionScreen.classList.contains('active')) {
        renderRound(currentRound);
      }
      if (resultScreen.classList.contains('active')) {
        showResult();
      }
    });

    // --- Screen Navigation ---
    function showScreen(screen) {
      [startScreen, auditionScreen, resultScreen].forEach(function (s) {
        s.classList.remove('active');
      });
      screen.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Start Audition ---
    startBtn.addEventListener('click', function () {
      currentRound = 0;
      roundScores = [];
      totalWit = 0;
      totalDepth = 0;
      totalHumor = 0;
      liveScore.textContent = '0';
      resetJudgeDisplay();
      showScreen(auditionScreen);
      renderRound(0);
    });

    // --- Reset judge display ---
    function resetJudgeDisplay() {
      ['wit', 'depth', 'humor'].forEach(function (j) {
        document.getElementById('judge-' + j + '-score').textContent = '-';
        document.getElementById('judge-' + j + '-face').textContent =
          j === 'wit' ? '\u{1F60E}' : j === 'depth' ? '\u{1F9D0}' : '\u{1F923}';
        var el = document.querySelector('.judge[data-judge="' + j + '"]');
        el.classList.remove('score-high', 'score-mid', 'score-low', 'reacting');
      });
    }

    // --- Render Round ---
    function renderRound(index) {
      var rNum = index + 1;
      roundNum.textContent = rNum;
      progressFill.style.width = ((rNum / TOTAL_ROUNDS) * 100) + '%';

      // Reset judges for new round
      resetJudgeDisplay();

      // Scenario
      scenarioIcon.textContent = SCENARIO_ICONS[index];
      scenarioText.textContent = i18n.t('rounds.r' + rNum + '.scenario');

      // Choices
      choicesContainer.innerHTML = '';
      var choiceKeys = ['a', 'b', 'c'];

      choiceKeys.forEach(function (key, idx) {
        var btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = i18n.t('rounds.r' + rNum + '.choices.' + key);
        btn.addEventListener('click', function () {
          selectChoice(index, idx);
        });
        choicesContainer.appendChild(btn);
      });
    }

    // --- Select Choice ---
    function selectChoice(roundIndex, choiceIndex) {
      var scores = JUDGE_SCORES[roundIndex][choiceIndex];
      var witScore = scores[0];
      var depthScore = scores[1];
      var humorScore = scores[2];

      // Store
      roundScores.push({ wit: witScore, depth: depthScore, humor: humorScore });
      totalWit += witScore;
      totalDepth += depthScore;
      totalHumor += humorScore;

      // Highlight selected
      var buttons = choicesContainer.querySelectorAll('.choice-btn');
      buttons[choiceIndex].classList.add('selected');
      buttons.forEach(function (btn) { btn.disabled = true; });

      // Animate judge reactions with staggered delay
      animateJudge('wit', witScore, 200);
      animateJudge('depth', depthScore, 600);
      animateJudge('humor', humorScore, 1000);

      // Update live score after all judges
      setTimeout(function () {
        var total = totalWit + totalDepth + totalHumor;
        liveScore.textContent = total;
        liveScore.classList.add('bump');
        setTimeout(function () { liveScore.classList.remove('bump'); }, 400);
      }, 1400);

      // Next round or result
      setTimeout(function () {
        if (currentRound < TOTAL_ROUNDS - 1) {
          currentRound++;
          auditionCard.classList.add('slide-out');
          setTimeout(function () {
            renderRound(currentRound);
            auditionCard.classList.remove('slide-out');
            auditionCard.classList.add('slide-in');
            setTimeout(function () {
              auditionCard.classList.remove('slide-in');
            }, 300);
          }, 300);
        } else {
          showScreen(resultScreen);
          showResult();
        }
      }, 2200);
    }

    // --- Animate Judge ---
    function animateJudge(judgeName, score, delay) {
      setTimeout(function () {
        var judgeEl = document.querySelector('.judge[data-judge="' + judgeName + '"]');
        var faceEl = document.getElementById('judge-' + judgeName + '-face');
        var scoreEl = document.getElementById('judge-' + judgeName + '-score');

        // Determine reaction level
        var level = score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low';

        // Set reaction face
        faceEl.textContent = JUDGE_REACTIONS[judgeName][level];

        // Set score with animation
        scoreEl.textContent = score;
        judgeEl.classList.add('reacting');

        // Color class
        judgeEl.classList.remove('score-high', 'score-mid', 'score-low');
        judgeEl.classList.add('score-' + level);

        // Remove reacting class after animation
        setTimeout(function () {
          judgeEl.classList.remove('reacting');
        }, 400);
      }, delay);
    }

    // --- Get Level ---
    function getLevel(percent) {
      if (percent >= 90) return 'superstar';
      if (percent >= 75) return 'headliner';
      if (percent >= 55) return 'contender';
      if (percent >= 35) return 'rookie';
      return 'wallflower';
    }

    // --- Get Appeal Style based on highest judge ---
    function getAppealStyle() {
      if (totalWit >= totalDepth && totalWit >= totalHumor) return 'witty';
      if (totalDepth >= totalWit && totalDepth >= totalHumor) return 'deep';
      return 'funny';
    }

    // --- Level Emojis ---
    var levelEmojis = {
      superstar: '\u{1F451}',
      headliner: '\u{1F31F}',
      contender: '\u{1F525}',
      rookie: '\u{1F331}',
      wallflower: '\u{1F30C}'
    };

    // --- Animate Score Counter ---
    function animateCounter(target, duration) {
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
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
    function animateMeter(percent) {
      var circumference = 534;
      var offset = circumference - (circumference * percent / 100);
      meterArc.style.strokeDashoffset = circumference;
      void meterArc.offsetWidth;
      setTimeout(function () {
        meterArc.style.strokeDashoffset = offset;
      }, 100);
    }

    // --- Show Result ---
    function showResult() {
      var totalScore = totalWit + totalDepth + totalHumor;
      var maxScore = TOTAL_ROUNDS * 30; // 10 rounds * 3 judges * max 10
      var percent = Math.round((totalScore / maxScore) * 100);
      if (percent > 100) percent = 100;

      var level = getLevel(percent);
      var appealStyle = getAppealStyle();

      // Emoji
      document.getElementById('result-emoji').textContent = levelEmojis[level];

      // Animate score
      animateCounter(percent, 2000);
      animateMeter(percent);

      // Level name
      document.getElementById('result-level').textContent = i18n.t('results.' + level + '.name');

      // Appeal style
      var styleText = i18n.t('appealStyles.' + appealStyle);
      document.getElementById('result-style').textContent = '"' + styleText + '"';

      // Final judge scores
      document.getElementById('fj-wit').textContent = totalWit;
      document.getElementById('fj-depth').textContent = totalDepth;
      document.getElementById('fj-humor').textContent = totalHumor;

      // Round breakdown
      var breakdownEl = document.getElementById('round-breakdown');
      breakdownEl.innerHTML = '';
      roundScores.forEach(function (rs, idx) {
        var row = document.createElement('div');
        row.className = 'rb-row';
        var roundTotal = rs.wit + rs.depth + rs.humor;
        row.innerHTML =
          '<span class="rb-round">' + (idx + 1) + '</span>' +
          '<span class="rb-scores">' +
            '<span class="rb-judge-score wit">' + rs.wit + '</span>' +
            '<span class="rb-judge-score depth">' + rs.depth + '</span>' +
            '<span class="rb-judge-score humor">' + rs.humor + '</span>' +
          '</span>' +
          '<span class="rb-total">' + roundTotal + '</span>';
        breakdownEl.appendChild(row);
      });

      // Description
      document.getElementById('result-desc').textContent = i18n.t('results.' + level + '.description');

      // Tips
      var tipsList = document.getElementById('result-tips');
      tipsList.innerHTML = '';
      var tips = i18n.t('results.' + level + '.tips');
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
          event_label: level,
          value: percent
        });
      }
    }

    // --- Share: Twitter ---
    shareTwitter.addEventListener('click', function () {
      var totalScore = totalWit + totalDepth + totalHumor;
      var maxScore = TOTAL_ROUNDS * 30;
      var percent = Math.round((totalScore / maxScore) * 100);
      var level = getLevel(percent);
      var levelName = i18n.t('results.' + level + '.name');
      var emoji = levelEmojis[level];
      var shareText = i18n.t('share.text');
      var text = emoji + ' ' + shareText.replace('{score}', percent).replace('{level}', levelName);
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
      currentRound = 0;
      roundScores = [];
      totalWit = 0;
      totalDepth = 0;
      totalHumor = 0;
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
