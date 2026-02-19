/**
 * HumanizeKit v0.8.0 — Toolkit Application
 * 10 tools, glassmorphism UI, i18n
 */
(function () {
    'use strict';

    const API = '';
    let activeTool = null;
    let isRunning = false;

    // ==================== Tool Registry ====================
    const TOOLS = {
        humanize:     { icon: '🪄', endpoint: '/api/humanize' },
        'ai-detect':  { icon: '🤖', endpoint: '/api/ai-detect' },
        analyze:      { icon: '📊', endpoint: '/api/analyze' },
        tone:         { icon: '🎭', endpoint: '/api/tone' },
        'tone-adjust':{ icon: '🎨', endpoint: '/api/tone-adjust' },
        coherence:    { icon: '🔗', endpoint: '/api/coherence' },
        watermark:    { icon: '🔍', endpoint: '/api/watermark' },
        spin:         { icon: '🔄', endpoint: '/api/spin' },
        paraphrase:   { icon: '✍️', endpoint: '/api/paraphrase' },
        explain:      { icon: '📋', endpoint: '/api/explain' },
    };

    // ==================== DOM Cache ====================
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const els = {
        toolGrid:    $('#toolGrid'),
        wsHeader:    $('#wsHeader'),
        wsInput:     $('#wsInput'),
        wsResult:    $('#wsResult'),
        wsToolIcon:  $('#wsToolIcon'),
        wsToolName:  $('#wsToolName'),
        wsClose:     $('#wsClose'),
        inputText:   $('#inputText'),
        runBtn:      $('#runBtn'),
        resultBody:  $('#resultBody'),
        resultTime:  $('#resultTime'),
        copyResult:  $('#copyResult'),
        statChars:   $('#statChars'),
        statWords:   $('#statWords'),
        statSentences: $('#statSentences'),
        ctrlLang:    $('#ctrlLang'),
        ctrlProfile: $('#ctrlProfile'),
        ctrlIntensity: $('#ctrlIntensity'),
        intensityVal:  $('#intensityVal'),
        ctrlTarget:  $('#ctrlTarget'),
        ctrlVariants:$('#ctrlVariants'),
        ctrlWmAction:$('#ctrlWmAction'),
        ctrlSuggest: $('#ctrlSuggest'),
        ctrlSeed:    $('#ctrlSeed'),
        themeToggle: $('#themeToggle'),
        fileUpload:  $('#fileUpload'),
        urlExtract:  $('#urlExtract'),
        urlModal:    $('#urlModal'),
        urlModalClose: $('#urlModalClose'),
        urlInput:    $('#urlInput'),
        urlGo:       $('#urlGo'),
        toast:       $('#toast'),
    };

    // ==================== Theme ====================
    function initTheme() {
        const saved = localStorage.getItem('hk-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        els.themeToggle.addEventListener('click', () => {
            const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', t);
            localStorage.setItem('hk-theme', t);
        });
    }

    // ==================== Tool Selection ====================
    function initToolGrid() {
        $$('.tool-card').forEach(card => {
            card.addEventListener('click', () => selectTool(card.dataset.tool));
        });
        els.wsClose.addEventListener('click', closeTool);
    }

    function selectTool(toolId) {
        if (!TOOLS[toolId]) return;
        activeTool = toolId;

        // Highlight active card
        $$('.tool-card').forEach(c => c.classList.toggle('active', c.dataset.tool === toolId));

        // Show workspace
        els.wsHeader.style.display = '';
        els.wsInput.style.display = '';
        els.wsResult.style.display = 'none';

        // Set tool info
        els.wsToolIcon.textContent = TOOLS[toolId].icon;
        const nameKey = 'tool.' + toCamel(toolId) + '.name';
        els.wsToolName.textContent = I18n.t(nameKey) || toolId;

        // Show relevant controls
        $$('.tool-ctrl').forEach(el => {
            const tools = el.dataset.for.split(' ');
            el.classList.toggle('visible', tools.includes(toolId));
        });

        updateRunBtn();
        els.inputText.focus();

        // Scroll to workspace
        document.getElementById('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeTool() {
        activeTool = null;
        $$('.tool-card').forEach(c => c.classList.remove('active'));
        els.wsHeader.style.display = 'none';
        els.wsInput.style.display = 'none';
        els.wsResult.style.display = 'none';
    }

    // ==================== Input Stats ====================
    function updateInputStats() {
        const t = els.inputText.value;
        const chars = t.length;
        const words = t.trim() ? t.trim().split(/\s+/).length : 0;
        const sentences = t.trim() ? (t.match(/[.!?]+/g) || []).length || (t.trim() ? 1 : 0) : 0;

        els.statChars.innerHTML = `${chars} <span data-i18n="stat.chars">${I18n.t('stat.chars')}</span>`;
        els.statWords.innerHTML = `${words} <span data-i18n="stat.words">${I18n.t('stat.words')}</span>`;
        els.statSentences.innerHTML = `${sentences} <span data-i18n="stat.sentences">${I18n.t('stat.sentences')}</span>`;
        updateRunBtn();
    }

    function updateRunBtn() {
        els.runBtn.disabled = !activeTool || !els.inputText.value.trim() || isRunning;
    }

    // ==================== Run Tool ====================
    async function runTool() {
        if (!activeTool || isRunning) return;
        const text = els.inputText.value.trim();
        if (!text) return;

        isRunning = true;
        updateRunBtn();
        els.runBtn.querySelector('.run-text').style.display = 'none';
        els.runBtn.querySelector('.run-loader').style.display = '';

        try {
            const payload = buildPayload(text);
            const resp = await fetch(API + TOOLS[activeTool].endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();

            if (!data.ok) throw new Error(data.error || 'API error');
            renderResult(data);
        } catch (err) {
            showToast('Error: ' + err.message);
        } finally {
            isRunning = false;
            updateRunBtn();
            els.runBtn.querySelector('.run-text').style.display = '';
            els.runBtn.querySelector('.run-loader').style.display = 'none';
        }
    }

    function buildPayload(text) {
        const p = { text, lang: els.ctrlLang.value };

        switch (activeTool) {
            case 'humanize':
                p.profile = els.ctrlProfile.value;
                p.intensity = parseFloat(els.ctrlIntensity.value);
                if (els.ctrlSeed.value) p.seed = parseInt(els.ctrlSeed.value);
                break;
            case 'tone-adjust':
                p.target = els.ctrlTarget.value;
                p.intensity = parseFloat(els.ctrlIntensity.value);
                break;
            case 'spin':
                p.intensity = parseFloat(els.ctrlIntensity.value);
                p.count = parseInt(els.ctrlVariants.value);
                if (els.ctrlSeed.value) p.seed = parseInt(els.ctrlSeed.value);
                break;
            case 'paraphrase':
                p.intensity = parseFloat(els.ctrlIntensity.value);
                if (els.ctrlSeed.value) p.seed = parseInt(els.ctrlSeed.value);
                break;
            case 'coherence':
                p.suggest = els.ctrlSuggest.checked;
                break;
            case 'watermark':
                p.action = els.ctrlWmAction.value;
                break;
            case 'explain':
                p.profile = els.ctrlProfile.value;
                p.intensity = parseFloat(els.ctrlIntensity.value);
                break;
        }
        return p;
    }

    // ==================== Result Rendering ====================
    function renderResult(data) {
        els.wsResult.style.display = '';
        els.resultTime.textContent = data.elapsed_ms ? `${data.elapsed_ms}ms` : '';

        const render = {
            humanize:     renderHumanize,
            'ai-detect':  renderAiDetect,
            analyze:      renderAnalyze,
            tone:         renderTone,
            'tone-adjust': renderToneAdjust,
            coherence:    renderCoherence,
            watermark:    renderWatermark,
            spin:         renderSpin,
            paraphrase:   renderParaphrase,
            explain:      renderExplain,
        };

        if (render[activeTool]) {
            els.resultBody.innerHTML = render[activeTool](data);
        } else {
            els.resultBody.innerHTML = `<pre class="result-text">${escHtml(JSON.stringify(data, null, 2))}</pre>`;
        }

        els.wsResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // --- Humanize ---
    function renderHumanize(d) {
        const original = d.original || '';
        const modified = d.text || '';
        const ops = (original && modified && original !== modified)
            ? diffWords(tokenize(original), tokenize(modified))
            : null;

        // ── 1. Clean result (copyable, with subtle markers & tooltips) ──
        let html = `<div class="hm-result-clean">`;
        html += `<div class="hm-result-header">`;
        html += `<span class="hm-result-label">${I18n.t('diff.resultLabel')}</span>`;
        html += `</div>`;
        html += `<div class="result-text hm-clean-text">${ops ? buildCleanHtml(ops) : escHtml(modified)}</div>`;
        html += `</div>`;

        // ── 2. Metrics ──
        html += `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.changeRatio'), pct(d.change_ratio), d.change_ratio);
        if (d.lang) {
            html += metricCard(I18n.t('metric.lang'), d.lang.toUpperCase(), null);
        }
        if (d.metrics_before && d.metrics_before.artificiality_score != null) {
            html += metricCard(I18n.t('metric.aiBefore'), fmtScore(d.metrics_before.artificiality_score), d.metrics_before.artificiality_score / 100, true);
        }
        if (d.metrics_after && d.metrics_after.artificiality_score != null) {
            html += metricCard(I18n.t('metric.aiAfter'), fmtScore(d.metrics_after.artificiality_score), d.metrics_after.artificiality_score / 100, true);
        }
        html += `</div>`;

        // ── 3. Stages applied ──
        if (d.changes && d.changes.length) {
            html += `<div class="stages-applied">`;
            d.changes.forEach(c => {
                const stage = c.stage || 'unknown';
                html += `<span class="stage-badge">${escHtml(stage)}</span>`;
            });
            html += `</div>`;
        }

        // ── 4. Expandable detailed diff ──
        if (ops) {
            const changeList = collectChanges(ops);
            if (changeList.length) {
                html += `<details class="hm-diff-details">`;
                html += `<summary class="hm-diff-summary">`;
                html += `<span>${I18n.t('diff.detailsTitle')}</span>`;
                html += `<span class="hm-diff-count">${changeList.length}</span>`;
                html += `</summary>`;
                // Legend
                html += `<div class="diff-legend">`;
                html += `<span class="diff-legend-item"><span class="diff-sample diff-del-sample"></span> ${I18n.t('diff.removed')}</span>`;
                html += `<span class="diff-legend-item"><span class="diff-sample diff-ins-sample"></span> ${I18n.t('diff.added')}</span>`;
                html += `</div>`;
                // Full diff text
                html += `<div class="result-text diff-view">${buildFullDiffHtml(ops)}</div>`;
                // Change list table
                html += `<div class="hm-changes-table">`;
                html += `<div class="hm-changes-header">`;
                html += `<span>#</span><span>${I18n.t('diff.colBefore')}</span><span>${I18n.t('diff.colAfter')}</span><span>${I18n.t('diff.colType')}</span>`;
                html += `</div>`;
                changeList.forEach((c, i) => {
                    html += `<div class="hm-change-row">`;
                    html += `<span class="hm-change-num">${i + 1}</span>`;
                    html += `<span class="hm-change-old">${escHtml(c.old)}</span>`;
                    html += `<span class="hm-change-new">${escHtml(c.new_)}</span>`;
                    html += `<span class="hm-change-type hm-type-${c.type}">${I18n.t('diff.type_' + c.type)}</span>`;
                    html += `</div>`;
                });
                html += `</div>`;
                html += `</details>`;
            }
        }

        if (d.explanation) {
            html += `<div class="result-summary">${escHtml(typeof d.explanation === 'string' ? d.explanation : JSON.stringify(d.explanation))}</div>`;
        }
        return html;
    }

    // ==================== Word-level Diff ====================

    // Clean view: only the NEW text, with subtle markers on changed parts
    function buildCleanHtml(ops) {
        let html = '';
        for (const op of ops) {
            if (op.type === 'equal') {
                html += escHtml(op.val);
            } else if (op.type === 'delete') {
                // Skip deleted text — don't show in clean view
            } else if (op.type === 'insert') {
                html += `<span class="hm-changed" data-tooltip="${escAttr(I18n.t('diff.addedTip'))}">${escHtml(op.val)}</span>`;
            } else if (op.type === 'replace') {
                html += `<span class="hm-changed" data-tooltip="${escAttr(I18n.t('diff.replacedFromTip') + ': ' + op.oldVal)}">${escHtml(op.newVal)}</span>`;
            }
        }
        return html;
    }

    // Full diff view: shows both deletions and insertions
    function buildFullDiffHtml(ops) {
        let html = '';
        for (const op of ops) {
            if (op.type === 'equal') {
                html += escHtml(op.val);
            } else if (op.type === 'delete') {
                html += `<span class="diff-del">${escHtml(op.val)}</span>`;
            } else if (op.type === 'insert') {
                html += `<span class="diff-ins">${escHtml(op.val)}</span>`;
            } else if (op.type === 'replace') {
                html += `<span class="diff-del">${escHtml(op.oldVal)}</span>`;
                html += `<span class="diff-ins">${escHtml(op.newVal)}</span>`;
            }
        }
        return html;
    }

    // Collect individual changes into a list for the table
    function collectChanges(ops) {
        const changes = [];
        for (const op of ops) {
            if (op.type === 'delete') {
                if (op.val.trim()) changes.push({ old: op.val, new_: '—', type: 'delete' });
            } else if (op.type === 'insert') {
                if (op.val.trim()) changes.push({ old: '—', new_: op.val, type: 'insert' });
            } else if (op.type === 'replace') {
                changes.push({ old: op.oldVal, new_: op.newVal, type: 'replace' });
            }
        }
        return changes;
    }

    function tokenize(text) {
        // Split into words and whitespace tokens, preserving everything
        return text.match(/(\S+|\s+)/g) || [];
    }

    function diffWords(oldArr, newArr) {
        // Myers-like simple LCS-based diff
        const m = oldArr.length, n = newArr.length;

        // For very large texts, fall back to sequential scan
        if (m * n > 500000) return diffSimple(oldArr, newArr);

        // Build LCS table
        const dp = Array.from({length: m + 1}, () => new Uint16Array(n + 1));
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = oldArr[i-1] === newArr[j-1]
                    ? dp[i-1][j-1] + 1
                    : Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }

        // Backtrack to build ops
        const ops = [];
        let i = m, j = n;
        const rawOps = [];
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldArr[i-1] === newArr[j-1]) {
                rawOps.push({type: 'equal', val: oldArr[i-1]});
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
                rawOps.push({type: 'insert', val: newArr[j-1]});
                j--;
            } else {
                rawOps.push({type: 'delete', val: oldArr[i-1]});
                i--;
            }
        }
        rawOps.reverse();

        // Merge adjacent delete+insert into replace
        return mergeOps(rawOps);
    }

    function diffSimple(oldArr, newArr) {
        // Simple sequential diff for large texts
        const ops = [];
        let i = 0, j = 0;
        while (i < oldArr.length && j < newArr.length) {
            if (oldArr[i] === newArr[j]) {
                ops.push({type: 'equal', val: oldArr[i]});
                i++; j++;
            } else {
                ops.push({type: 'delete', val: oldArr[i]});
                ops.push({type: 'insert', val: newArr[j]});
                i++; j++;
            }
        }
        while (i < oldArr.length) ops.push({type: 'delete', val: oldArr[i++]});
        while (j < newArr.length) ops.push({type: 'insert', val: newArr[j++]});
        return mergeOps(ops);
    }

    function mergeOps(rawOps) {
        const ops = [];
        let k = 0;
        while (k < rawOps.length) {
            if (rawOps[k].type === 'delete' && k+1 < rawOps.length && rawOps[k+1].type === 'insert') {
                ops.push({type: 'replace', oldVal: rawOps[k].val, newVal: rawOps[k+1].val});
                k += 2;
            } else {
                ops.push(rawOps[k]);
                k++;
            }
        }
        return ops;
    }

    function escAttr(s) {
        return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // --- AI Detect ---
    function renderAiDetect(d) {
        const prob = d.ai_probability;
        const circ = 339.292; // 2*PI*54
        const offset = circ * (1 - prob);
        const probColor = prob > 0.7 ? 'var(--danger)' : prob > 0.4 ? 'var(--warning)' : 'var(--success)';
        const verdictClass = prob > 0.7 ? 'verdict-ai' : prob > 0.4 ? 'verdict-mixed' : 'verdict-human';

        let html = `<div style="text-align:center">`;
        html += `<div class="prob-wheel">
            <svg viewBox="0 0 120 120">
                <circle class="prob-wheel-bg" cx="60" cy="60" r="54" />
                <circle class="prob-wheel-fill" cx="60" cy="60" r="54"
                    stroke="${probColor}"
                    stroke-dasharray="${circ}"
                    stroke-dashoffset="${offset}" />
            </svg>
            <div class="prob-label">
                <span style="color:${probColor}">${pct(prob)}</span>
                <span class="prob-sub">AI</span>
            </div>
        </div>`;
        html += `<div class="verdict-badge ${verdictClass}">${escHtml(d.verdict)}</div>`;
        html += `</div>`;

        // Confidence
        html += `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.confidence'), pct(d.confidence), d.confidence);
        html += metricCard(I18n.t('metric.humanProb'), pct(d.human_probability), d.human_probability);
        html += `</div>`;

        // 12 individual scores
        if (d.scores) {
            html += `<h4 style="margin-top:16px;font-size:0.85rem;color:var(--text2)">${I18n.t('result.scores')}</h4>`;
            html += `<div class="scores-grid">`;
            for (const [name, val] of Object.entries(d.scores)) {
                const color = val > 0.7 ? 'var(--danger)' : val > 0.4 ? 'var(--warning)' : 'var(--success)';
                html += `<div class="score-item">
                    <span class="score-name">${name.replace(/_/g, ' ')}</span>
                    <div class="score-bar"><div class="score-bar-fill" style="width:${val*100}%;background:${color}"></div></div>
                    <span class="score-val" style="color:${color}">${(val*100).toFixed(0)}%</span>
                </div>`;
            }
            html += `</div>`;
        }

        // Summary
        if (d.summary) {
            html += `<div class="result-summary">${escHtml(d.summary)}</div>`;
        }

        // Explanations
        if (d.explanations && d.explanations.length) {
            html += `<div class="issues-list">`;
            d.explanations.forEach(e => {
                html += `<div class="issue-item">💡 ${escHtml(e)}</div>`;
            });
            html += `</div>`;
        }

        return html;
    }

    // --- Analyze ---
    function renderAnalyze(d) {
        let html = `<div class="result-metrics">`;
        if (d.lang) {
            html += metricCard(I18n.t('metric.lang'), d.lang.toUpperCase(), null);
        }
        html += metricCard(I18n.t('metric.artificiality'), fmtScore(d.artificiality_score), d.artificiality_score / 100, true);
        html += metricCard(I18n.t('metric.avgSentLen'), d.avg_sentence_length.toFixed(1), null);
        html += metricCard(I18n.t('metric.bureaucratic'), pct(d.bureaucratic_ratio), d.bureaucratic_ratio, true);
        html += metricCard(I18n.t('metric.connectors'), pct(d.connector_ratio), d.connector_ratio, true);
        html += metricCard(I18n.t('metric.repetition'), pct(d.repetition_score), d.repetition_score, true);
        html += metricCard(I18n.t('metric.burstiness'), pct(d.burstiness_score), d.burstiness_score);
        html += `</div>`;

        // Stats
        if (d.stats) {
            html += `<h4 style="margin-top:16px;font-size:0.85rem;color:var(--text2)">${I18n.t('result.stats')}</h4>`;
            html += `<div class="result-metrics">`;
            html += metricCard(I18n.t('stat.words'), d.stats.words);
            html += metricCard(I18n.t('stat.sentences'), d.stats.sentences);
            html += metricCard(I18n.t('stat.paragraphs'), d.stats.paragraphs);
            html += metricCard(I18n.t('stat.chars'), d.stats.characters);
            html += metricCard(I18n.t('stat.uniqueRatio'), pct(d.stats.unique_ratio), d.stats.unique_ratio);
            html += metricCard(I18n.t('stat.readingTime'), `${d.stats.reading_time_sec}s`);
            html += `</div>`;
        }

        // AI Detection
        if (d.ai_detection) {
            html += renderAiDetect(d.ai_detection);
        }

        return html;
    }

    // --- Tone ---
    function renderTone(d) {
        const toneColors = {
            formal: '#6366f1', academic: '#8b5cf6', professional: '#3b82f6',
            neutral: '#64748b', friendly: '#f59e0b', casual: '#10b981', marketing: '#ec4899'
        };

        let html = `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.primaryTone'), d.primary_tone, null);
        html += metricCard(I18n.t('metric.formality'), pct(d.formality), d.formality);
        html += metricCard(I18n.t('metric.subjectivity'), pct(d.subjectivity), d.subjectivity);
        html += metricCard(I18n.t('metric.confidence'), pct(d.confidence), d.confidence);
        html += `</div>`;

        // Tone bars
        if (d.scores) {
            html += `<div class="tone-bars">`;
            for (const [tone, val] of Object.entries(d.scores)) {
                const color = toneColors[tone] || 'var(--accent)';
                html += `<div class="tone-bar-item">
                    <span class="tone-bar-label">${tone}</span>
                    <div class="tone-bar-track"><div class="tone-bar-fill" style="width:${val*100}%;background:${color}"></div></div>
                    <span class="tone-bar-val">${(val*100).toFixed(0)}%</span>
                </div>`;
            }
            html += `</div>`;
        }

        return html;
    }

    // --- Tone Adjust ---
    function renderToneAdjust(d) {
        let html = `<div class="result-text">${escHtml(d.text)}</div>`;
        html += `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.targetTone'), d.target, null);
        html += metricCard(I18n.t('metric.intensity'), d.intensity.toFixed(1), null);
        html += `</div>`;
        return html;
    }

    // --- Coherence ---
    function renderCoherence(d) {
        const overallColor = d.overall > 0.7 ? 'good' : d.overall > 0.4 ? 'warn' : 'bad';
        let html = `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.overall'), pct(d.overall), d.overall);
        html += metricCard(I18n.t('metric.lexicalCohesion'), pct(d.lexical_cohesion), d.lexical_cohesion);
        html += metricCard(I18n.t('metric.transitions'), pct(d.transition_score), d.transition_score);
        html += metricCard(I18n.t('metric.topicConsistency'), pct(d.topic_consistency), d.topic_consistency);
        html += metricCard(I18n.t('metric.openingDiversity'), pct(d.sentence_opening_diversity), d.sentence_opening_diversity);
        html += `</div>`;

        if (d.issues && d.issues.length) {
            html += `<h4 style="margin-top:16px;font-size:0.85rem;color:var(--text2)">${I18n.t('result.issues')}</h4>`;
            html += `<div class="issues-list">`;
            d.issues.forEach(issue => {
                html += `<div class="issue-item">⚠️ ${escHtml(typeof issue === 'string' ? issue : JSON.stringify(issue))}</div>`;
            });
            html += `</div>`;
        }

        if (d.suggestions && d.suggestions.length) {
            html += `<h4 style="margin-top:16px;font-size:0.85rem;color:var(--text2)">${I18n.t('result.suggestions')}</h4>`;
            html += `<div class="issues-list">`;
            d.suggestions.forEach(s => {
                html += `<div class="issue-item" style="border-left-color:var(--success)">💡 ${escHtml(typeof s === 'string' ? s : JSON.stringify(s))}</div>`;
            });
            html += `</div>`;
        }

        return html;
    }

    // --- Watermark ---
    function renderWatermark(d) {
        if (d.action === 'clean') {
            let html = `<div class="verdict-badge wm-clean-badge">✅ ${I18n.t('wm.cleaned')}</div>`;
            html += `<div class="result-text">${escHtml(d.cleaned_text)}</div>`;
            return html;
        }

        // Detect
        const verdictClass = d.has_watermarks ? 'verdict-ai' : 'verdict-human';
        const verdictText = d.has_watermarks ? I18n.t('wm.found') : I18n.t('wm.notFound');
        let html = `<div class="verdict-badge ${verdictClass}">${d.has_watermarks ? '🚨' : '✅'} ${verdictText}</div>`;

        html += `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.confidence'), pct(d.confidence), d.confidence);
        html += `</div>`;

        if (d.watermark_types && d.watermark_types.length) {
            html += `<h4 style="margin-top:14px;font-size:0.85rem;color:var(--text2)">${I18n.t('wm.types')}</h4>`;
            html += `<div class="wm-types">`;
            d.watermark_types.forEach(t => {
                html += `<span class="wm-type-badge">${escHtml(t.replace(/_/g, ' '))}</span>`;
            });
            html += `</div>`;
        }

        if (d.details && d.details.length) {
            html += `<div class="issues-list" style="margin-top:12px">`;
            d.details.forEach(det => {
                html += `<div class="issue-item">🔍 ${escHtml(typeof det === 'string' ? det : JSON.stringify(det))}</div>`;
            });
            html += `</div>`;
        }

        if (d.cleaned_text && d.has_watermarks) {
            html += `<h4 style="margin-top:14px;font-size:0.85rem;color:var(--text2)">${I18n.t('wm.cleanedVersion')}</h4>`;
            html += `<div class="result-text">${escHtml(d.cleaned_text)}</div>`;
        }

        return html;
    }

    // --- Spin ---
    function renderSpin(d) {
        if (d.mode === 'variants' && d.variants) {
            let html = `<div class="result-metrics">`;
            html += metricCard(I18n.t('metric.variants'), d.count);
            html += `</div>`;
            html += `<div class="variants-list">`;
            d.variants.forEach((v, i) => {
                const text = typeof v === 'string' ? v : (v.spun || v.text || JSON.stringify(v));
                const uniq = v.uniqueness ? ` · ${pct(v.uniqueness)} unique` : '';
                html += `<div class="variant-item">
                    <div class="variant-header"><span>#${i+1}${uniq}</span></div>
                    <div class="variant-text">${escHtml(text)}</div>
                </div>`;
            });
            html += `</div>`;
            return html;
        }

        let html = `<div class="result-text">${escHtml(d.spun)}</div>`;
        html += `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.uniqueness'), pct(d.uniqueness), d.uniqueness);
        html += `</div>`;
        if (d.spintax) {
            html += `<h4 style="margin-top:14px;font-size:0.85rem;color:var(--text2)">Spintax</h4>`;
            html += `<div class="result-text" style="font-family:var(--mono);font-size:0.78rem">${escHtml(d.spintax)}</div>`;
        }
        return html;
    }

    // --- Paraphrase ---
    function renderParaphrase(d) {
        let html = `<div class="result-text">${escHtml(d.paraphrased)}</div>`;
        html += `<div class="result-metrics">`;
        html += metricCard(I18n.t('metric.confidence'), pct(d.confidence), d.confidence);
        html += `</div>`;

        if (d.changes && d.changes.length) {
            html += `<h4 style="margin-top:14px;font-size:0.85rem;color:var(--text2)">${I18n.t('result.changes')}</h4>`;
            html += `<div class="changes-list">`;
            d.changes.forEach(c => {
                if (typeof c === 'string') {
                    html += `<div class="change-item">${escHtml(c)}</div>`;
                } else {
                    html += `<div class="change-item"><span class="del">${escHtml(c.from || c.original || '')}</span> → <span class="ins">${escHtml(c.to || c.replacement || '')}</span></div>`;
                }
            });
            html += `</div>`;
        }
        return html;
    }

    // --- Explain ---
    function renderExplain(d) {
        let html = '';

        // Try to render structured explanation
        if (d.original && d.humanized) {
            html += `<h4 style="font-size:0.85rem;color:var(--text2);margin-bottom:8px">${I18n.t('result.original')}</h4>`;
            html += `<div class="result-text" style="margin-bottom:14px">${escHtml(d.original)}</div>`;
            html += `<h4 style="font-size:0.85rem;color:var(--text2);margin-bottom:8px">${I18n.t('result.humanized')}</h4>`;
            html += `<div class="result-text">${escHtml(d.humanized)}</div>`;
        }

        if (d.recommendations && d.recommendations.length) {
            html += `<h4 style="margin-top:14px;font-size:0.85rem;color:var(--text2)">${I18n.t('result.recommendations')}</h4>`;
            html += `<div class="issues-list">`;
            d.recommendations.forEach(r => {
                html += `<div class="issue-item" style="border-left-color:var(--accent)">💡 ${escHtml(typeof r === 'string' ? r : JSON.stringify(r))}</div>`;
            });
            html += `</div>`;
        }

        if (d.changes && d.changes.length) {
            html += `<h4 style="margin-top:14px;font-size:0.85rem;color:var(--text2)">${I18n.t('result.changes')}</h4>`;
            html += `<div class="changes-list">`;
            d.changes.forEach(c => {
                if (typeof c === 'string') {
                    html += `<div class="change-item">${escHtml(c)}</div>`;
                } else {
                    html += `<div class="change-item"><span class="del">${escHtml(c.from || c.original || '')}</span> → <span class="ins">${escHtml(c.to || c.replacement || '')}</span></div>`;
                }
            });
            html += `</div>`;
        }

        // Fallback: render all remaining data
        if (!html) {
            html = `<div class="result-summary">${escHtml(JSON.stringify(d, null, 2))}</div>`;
        }

        return html;
    }

    // ==================== Helpers ====================
    function metricCard(label, value, ratio, inverse) {
        let cls = '';
        if (ratio !== null && ratio !== undefined) {
            if (inverse) {
                cls = ratio > 0.6 ? 'bad' : ratio > 0.3 ? 'warn' : 'good';
            } else {
                cls = ratio > 0.7 ? 'good' : ratio > 0.4 ? 'warn' : 'bad';
            }
        }
        let bar = '';
        if (ratio !== null && ratio !== undefined) {
            bar = `<div class="metric-bar"><div class="metric-bar-fill" style="width:${Math.min(ratio*100,100)}%"></div></div>`;
        }
        return `<div class="metric-card">
            <div class="metric-label">${escHtml(label)}</div>
            <div class="metric-value ${cls}">${value}</div>
            ${bar}
        </div>`;
    }

    function pct(v) { return (v * 100).toFixed(1) + '%'; }
    function fmtScore(v) { return v.toFixed(1); }
    function escHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function toCamel(s) { return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }

    function showToast(msg) {
        els.toast.textContent = msg;
        els.toast.classList.add('show');
        setTimeout(() => els.toast.classList.remove('show'), 3000);
    }

    // ==================== File Upload ====================
    function initFileUpload() {
        els.fileUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const fd = new FormData();
                fd.append('file', file);
                const resp = await fetch(API + '/api/extract', { method: 'POST', body: fd });
                const data = await resp.json();
                if (data.ok && data.text) {
                    els.inputText.value = data.text;
                    updateInputStats();
                    showToast(I18n.t('toast.extracted'));
                } else {
                    showToast('Error: ' + (data.error || 'Failed'));
                }
            } catch (err) {
                showToast('Upload error: ' + err.message);
            }
            e.target.value = '';
        });
    }

    // ==================== URL Extract ====================
    function initUrlExtract() {
        els.urlExtract.addEventListener('click', () => {
            els.urlModal.style.display = '';
            els.urlInput.focus();
        });
        els.urlModalClose.addEventListener('click', () => {
            els.urlModal.style.display = 'none';
        });
        els.urlModal.addEventListener('click', (e) => {
            if (e.target === els.urlModal) els.urlModal.style.display = 'none';
        });
        els.urlGo.addEventListener('click', async () => {
            const url = els.urlInput.value.trim();
            if (!url) return;
            try {
                const resp = await fetch(API + '/api/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await resp.json();
                if (data.ok && data.text) {
                    els.inputText.value = data.text;
                    updateInputStats();
                    showToast(I18n.t('toast.extracted'));
                    els.urlModal.style.display = 'none';
                } else {
                    showToast('Error: ' + (data.error || 'Failed'));
                }
            } catch (err) {
                showToast('URL error: ' + err.message);
            }
        });
    }

    // ==================== Copy ====================
    function initCopy() {
        els.copyResult.addEventListener('click', () => {
            const text = els.resultBody.innerText;
            navigator.clipboard.writeText(text).then(() => {
                showToast(I18n.t('toast.copied'));
            }).catch(() => {
                showToast('Copy failed');
            });
        });
    }

    // ==================== Language Switcher ====================
    function initLangSwitcher() {
        const saved = localStorage.getItem('hk-lang') || 'en';
        setLang(saved);

        $$('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setLang(btn.dataset.lang));
        });
    }

    function setLang(lang) {
        if (window.I18n) {
            I18n.setLocale(lang);
            I18n.translatePage();
        }
        $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
        localStorage.setItem('hk-lang', lang);
    }

    // ==================== Intensity Slider ====================
    function initIntensity() {
        els.ctrlIntensity.addEventListener('input', () => {
            els.intensityVal.textContent = els.ctrlIntensity.value;
        });
    }

    // ==================== Smooth Nav ====================
    function initNav() {
        $$('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                $$('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const target = document.querySelector(link.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // ==================== Init ====================
    function init() {
        initTheme();
        initToolGrid();
        initFileUpload();
        initUrlExtract();
        initCopy();
        initLangSwitcher();
        initIntensity();
        initNav();

        els.inputText.addEventListener('input', updateInputStats);
        els.runBtn.addEventListener('click', runTool);

        // Keyboard shortcut: Ctrl+Enter to run
        els.inputText.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runTool();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
