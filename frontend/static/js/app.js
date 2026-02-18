/**
 * HumanizeKit — Main Application Logic
 */
(function () {
    'use strict';

    // ─── DOM Elements ───
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const inputText = $('#inputText');
    const resultText = $('#resultText');
    const humanizeBtn = $('#humanizeBtn');
    const analyzeOnlyBtn = $('#analyzeOnlyBtn');
    const copyBtn = $('#copyBtn');
    const diffToggle = $('#diffToggle');
    const clearBtn = $('#clearBtn');
    const pasteBtn = $('#pasteBtn');
    const charCount = $('#charCount');
    const changeBadge = $('#changeBadge');
    const langSelect = $('#langSelect');
    const profilePills = $('#profilePills');
    const intensitySlider = $('#intensitySlider');
    const intensityValue = $('#intensityValue');
    const metricsDashboard = $('#metricsDashboard');
    const themeToggle = $('#themeToggle');
    const toastContainer = $('#toastContainer');

    // State
    let currentResult = null;
    let showDiff = false;
    let selectedProfile = 'web';

    // ─── Init ───
    function init() {
        loadTheme();
        loadInfo();
        bindEvents();
        animateStats();
        observeSections();
    }

    // ─── Theme ───
    function loadTheme() {
        const saved = localStorage.getItem('hk-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('hk-theme', next);
    }

    // ─── API Info ───
    async function loadInfo() {
        try {
            const res = await fetch('/api/info');
            const data = await res.json();
            $('#versionBadge').textContent = `v${data.version}`;
        } catch (_) {}
    }

    // ─── Events Binding ───
    function bindEvents() {
        themeToggle.addEventListener('click', toggleTheme);

        inputText.addEventListener('input', onInputChange);
        clearBtn.addEventListener('click', () => {
            inputText.value = '';
            onInputChange();
        });
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                inputText.value = text;
                onInputChange();
                showToast('Pasted from clipboard', 'success');
            } catch {
                showToast('Failed to read clipboard', 'error');
            }
        });

        humanizeBtn.addEventListener('click', (e) => {
            createRipple(e, humanizeBtn);
            doHumanize();
        });
        analyzeOnlyBtn.addEventListener('click', doAnalyzeOnly);

        copyBtn.addEventListener('click', () => {
            if (currentResult) {
                navigator.clipboard.writeText(currentResult.text);
                showToast('Copied to clipboard!', 'success');
            }
        });

        diffToggle.addEventListener('click', () => {
            showDiff = !showDiff;
            renderResult();
        });

        // Profile pills
        profilePills.addEventListener('click', (e) => {
            const pill = e.target.closest('.pill');
            if (!pill) return;
            $$('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedProfile = pill.dataset.profile;
        });

        // Intensity slider
        intensitySlider.addEventListener('input', () => {
            intensityValue.textContent = intensitySlider.value;
            updateSliderColor();
        });
        updateSliderColor();

        // Nav links
        $$('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                $$('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Changes toggle
        const changesToggle = $('#changesToggle');
        changesToggle?.addEventListener('click', () => {
            changesToggle.classList.toggle('open');
            $('#changesBody').classList.toggle('open');
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!humanizeBtn.disabled) doHumanize();
            }
        });
    }

    function onInputChange() {
        const len = inputText.value.length;
        charCount.textContent = `${len.toLocaleString()} chars`;
        humanizeBtn.disabled = len === 0;
        analyzeOnlyBtn.disabled = len === 0;
    }

    function updateSliderColor() {
        const v = intensitySlider.value;
        const pct = v / 100;
        intensitySlider.style.background = `linear-gradient(to right, #6366f1 0%, #8b5cf6 ${pct * 100}%, rgba(255,255,255,0.08) ${pct * 100}%)`;

        // Color the badge
        if (v <= 20) intensityValue.style.background = '#06b6d4';
        else if (v <= 40) intensityValue.style.background = '#10b981';
        else if (v <= 60) intensityValue.style.background = '#6366f1';
        else if (v <= 80) intensityValue.style.background = '#8b5cf6';
        else intensityValue.style.background = '#ec4899';
    }

    // ─── Humanize ───
    async function doHumanize() {
        const text = inputText.value.trim();
        if (!text) return;

        humanizeBtn.classList.add('loading');
        humanizeBtn.disabled = true;
        analyzeOnlyBtn.disabled = true;
        resultText.innerHTML = renderTypingIndicator();

        try {
            const res = await fetch('/api/humanize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    lang: langSelect.value,
                    profile: selectedProfile,
                    intensity: parseInt(intensitySlider.value),
                }),
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Processing failed');

            currentResult = data;
            renderResult();
            renderMetrics(data);
            renderChanges(data);
            renderProcessingInfo(data);

            metricsDashboard.style.display = '';
            showToast(`Processed in ${data.elapsed_ms}ms — ${Math.round(data.change_ratio * 100)}% changed`, 'success');

            // Confetti on good result
            if (data.metrics_after.artificiality_score < data.metrics_before.artificiality_score) {
                launchConfetti();
            }

            copyBtn.disabled = false;
            diffToggle.disabled = false;

        } catch (err) {
            showToast(err.message, 'error');
            resultText.innerHTML = `<div class="placeholder-output" style="color:var(--accent-error)"><p>${escapeHtml(err.message)}</p></div>`;
        } finally {
            humanizeBtn.classList.remove('loading');
            humanizeBtn.disabled = false;
            analyzeOnlyBtn.disabled = false;
        }
    }

    // ─── Analyze Only ───
    async function doAnalyzeOnly() {
        const text = inputText.value.trim();
        if (!text) return;

        analyzeOnlyBtn.disabled = true;

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    lang: langSelect.value,
                }),
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Analysis failed');

            // Show metrics in a simplified way
            currentResult = null;
            const fakeData = {
                metrics_before: data,
                metrics_after: data,
                change_ratio: 0,
                changes: [],
                elapsed_ms: 0,
                lang: data.lang,
                profile: selectedProfile,
            };
            renderMetrics(fakeData);
            metricsDashboard.style.display = '';

            showToast(`Artificiality score: ${data.artificiality_score}/100`, 'info');

        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            analyzeOnlyBtn.disabled = false;
        }
    }

    // ─── Render Result ───
    function renderResult() {
        if (!currentResult) return;

        changeBadge.style.display = '';
        changeBadge.textContent = `${Math.round(currentResult.change_ratio * 100)}% changed`;

        if (showDiff) {
            resultText.innerHTML = renderDiff(currentResult.original, currentResult.text);
        } else {
            resultText.textContent = currentResult.text;
        }

        // Animate text appearance
        resultText.style.animation = 'none';
        requestAnimationFrame(() => {
            resultText.style.animation = 'fadeInUp 0.4s ease-out';
        });
    }

    // ─── Diff Renderer ───
    function renderDiff(original, processed) {
        const origWords = original.split(/(\s+)/);
        const newWords = processed.split(/(\s+)/);
        let html = '';

        const maxLen = Math.max(origWords.length, newWords.length);
        for (let i = 0; i < maxLen; i++) {
            const o = origWords[i] || '';
            const n = newWords[i] || '';

            if (o === n) {
                html += escapeHtml(n);
            } else {
                if (o) html += `<span class="diff-removed">${escapeHtml(o)}</span>`;
                if (n) html += `<span class="diff-added">${escapeHtml(n)}</span>`;
            }
        }

        return html;
    }

    // ─── Metrics ───
    function renderMetrics(data) {
        const b = data.metrics_before;
        const a = data.metrics_after;

        // Artificiality
        animateValue($('#artificialityBefore'), b.artificiality_score, 1);
        animateValue($('#artificialityAfter'), a.artificiality_score, 1);

        const dir = $('#artificialityDir');
        if (a.artificiality_score < b.artificiality_score) {
            const drop = Math.round(b.artificiality_score - a.artificiality_score);
            dir.textContent = `↓ ${drop}`;
            dir.className = 'metric-direction improved';
        } else if (a.artificiality_score > b.artificiality_score) {
            dir.textContent = `↑ ${Math.round(a.artificiality_score - b.artificiality_score)}`;
            dir.className = 'metric-direction worsened';
        } else {
            dir.textContent = '=';
            dir.className = 'metric-direction';
        }

        // Animate gauge
        const gaugeFill = $('#artificialityGauge');
        if (gaugeFill) {
            // Create gradient if not exists
            let svg = gaugeFill.closest('svg');
            if (!svg.querySelector('#gaugeGradient')) {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                grad.id = 'gaugeGradient';
                ['#10b981', '#f59e0b', '#ef4444'].forEach((color, i) => {
                    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                    stop.setAttribute('offset', `${i * 50}%`);
                    stop.setAttribute('stop-color', color);
                    grad.appendChild(stop);
                });
                defs.appendChild(grad);
                svg.insertBefore(defs, svg.firstChild);
            }

            const pct = a.artificiality_score / 100;
            const offset = 157 - (157 * pct);
            gaugeFill.style.strokeDashoffset = offset;
        }

        // Grid metrics
        renderMetricPair('sentLen', b.avg_sentence_length, a.avg_sentence_length, 30);
        renderMetricPair('bureaRatio', b.bureaucratic_ratio, a.bureaucratic_ratio, 0.2);
        renderMetricPair('burst', b.burstiness_score, a.burstiness_score, 1, true);
        renderMetricPair('connRatio', b.connector_ratio, a.connector_ratio, 0.1);
        renderMetricPair('repScore', b.repetition_score, a.repetition_score, 0.5);
    }

    function renderMetricPair(id, before, after, maxVal, higherIsBetter = false) {
        const bEl = $(`#${id}Before`);
        const aEl = $(`#${id}After`);
        const barB = $(`#${id}BarBefore`);
        const barA = $(`#${id}BarAfter`);

        if (bEl) bEl.textContent = formatMetric(before);
        if (aEl) aEl.textContent = formatMetric(after);

        if (barB) {
            setTimeout(() => {
                barB.style.width = `${Math.min((before / maxVal) * 100, 100)}%`;
            }, 100);
        }
        if (barA) {
            setTimeout(() => {
                barA.style.width = `${Math.min((after / maxVal) * 100, 100)}%`;
            }, 300);
        }
    }

    function formatMetric(val) {
        if (val === undefined || val === null) return '--';
        if (val >= 1) return val.toFixed(1);
        return val.toFixed(3);
    }

    function animateValue(el, target, decimals = 0) {
        if (!el) return;
        const start = parseFloat(el.textContent) || 0;
        const duration = 800;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;
            el.textContent = current.toFixed(decimals);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // ─── Changes ───
    function renderChanges(data) {
        const section = $('#changesSection');
        const list = $('#changesList');
        if (!data.changes || data.changes.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = '';
        list.innerHTML = '';

        data.changes.forEach((c, i) => {
            const item = document.createElement('div');
            item.className = 'change-item';
            item.style.animationDelay = `${i * 0.05}s`;

            const stage = c.stage || c.type || 'change';
            const from = c.original || c.from || '';
            const to = c.replacement || c.to || '';

            item.innerHTML = `
                <span class="change-stage">${escapeHtml(stage)}</span>
                <span class="change-detail">
                    <span class="from">${escapeHtml(from)}</span>
                    → <span class="to">${escapeHtml(to)}</span>
                </span>
            `;
            list.appendChild(item);
        });
    }

    // ─── Processing Info ───
    function renderProcessingInfo(data) {
        $('#processingTime').textContent = `⏱ ${data.elapsed_ms}ms`;
        $('#detectedLang').textContent = `🌐 ${data.lang}`;
        $('#appliedProfile').textContent = `📋 ${data.profile}`;
    }

    // ─── Stats Counter Animation ───
    function animateStats() {
        $$('.stat-number[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            const duration = 1200;
            const startTime = performance.now();

            function update(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 4);
                el.textContent = Math.round(target * eased);
                if (progress < 1) requestAnimationFrame(update);
            }

            // Start when visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        requestAnimationFrame(update);
                        observer.disconnect();
                    }
                });
            });
            observer.observe(el);
        });
    }

    // ─── Intersection Observer for sections ───
    function observeSections() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        $$('.pipeline-step, .feature-card, .api-card').forEach(el => {
            observer.observe(el);
        });
    }

    // ─── Ripple Effect ───
    function createRipple(event, button) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        button.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    // ─── Confetti ───
    function launchConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${30 + Math.random() * 40}%`;
            piece.style.top = `${30 + Math.random() * 20}%`;
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = `${Math.random() * 0.5}s`;
            piece.style.animationDuration = `${1 + Math.random() * 1}s`;
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 3000);
    }

    // ─── Typing Indicator ───
    function renderTypingIndicator() {
        return `
            <div class="placeholder-output">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <p>Processing your text...</p>
            </div>
        `;
    }

    // ─── Toast ───
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${escapeHtml(message)}</span>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, 4000);
    }

    // ─── Utility ───
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── Start ───
    document.addEventListener('DOMContentLoaded', init);
})();
