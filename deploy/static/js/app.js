/**
 * HumanizeKit — Main Application (Redesigned)
 * Modal-based result display, no profile/intensity controls,
 * AI factor translation, file/URL upload, check types
 */
(function() {
    'use strict';

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // === DOM Elements ===
    const inputText = $('#inputText');
    const humanizeBtn = $('#humanizeBtn');
    const analyzeOnlyBtn = $('#analyzeOnlyBtn');
    const detectAiBtn = $('#detectAiBtn');
    const clearBtn = $('#clearBtn');
    const pasteBtn = $('#pasteBtn');
    const themeToggle = $('#themeToggle');
    const langSelect = $('#langSelect');

    // Analysis panels
    const metricsDashboard = $('#metricsDashboard');
    const aiDetectionPanel = $('#aiDetectionPanel');
    const readabilityPanel = $('#readabilityPanel');
    const stylePanel = $('#stylePanel');
    const changesSection = $('#changesSection');
    const changesToggle = $('#changesToggle');
    const changesList = $('#changesList');

    // Stats elements
    const statChars = $('#statChars');
    const statWords = $('#statWords');
    const statSentences = $('#statSentences');
    const statParas = $('#statParas');
    const statReadTime = $('#statReadTime');

    // File/URL elements
    const fileDropZone = $('#fileDropZone');
    const fileInput = $('#fileInput');
    const fileChooseBtn = $('#fileChooseBtn');
    const fileName = $('#fileName');
    const urlInput = $('#urlInput');
    const fetchUrlBtn = $('#fetchUrlBtn');

    // Source tabs & check type pills
    const sourceTabs = $$('.source-tab[data-source]');
    const checkTypePills = $$('.check-pill[data-check]');

    // Modal elements
    const modalOverlay = $('#resultModal');
    const modalResultText = $('#modalResultText');
    const modalChangeBadge = $('#modalChangeBadge');
    const modalCopyBtn = $('#modalCopyBtn');
    const modalDiffBtn = $('#modalDiffBtn');
    const modalCloseBtn = $('#modalCloseBtn');
    const modalMetrics = $('#modalMetrics');
    const modalChanges = $('#modalChanges');
    const modalChangesList = $('#modalChangesList');
    const modalProcessingTime = $('#modalProcessingTime');
    const modalDetectedLang = $('#modalDetectedLang');

    // AI factor name → i18n key mapping
    const FACTOR_KEYS = {
        'Artificiality': 'factor.artificiality',
        'Bureaucratic Language': 'factor.bureaucratic',
        'Connector Density': 'factor.connector',
        'Sentence Uniformity': 'factor.uniformity',
        'Vocabulary Diversity': 'factor.diversity',
        'Repetition Level': 'factor.repetition',
    };

    // State
    let currentCheckType = 'comprehensive';
    let currentSource = 'text';
    let showDiff = false;
    let lastResult = null;
    let isProcessing = false;

    // === Initialization ===
    function init() {
        setupTheme();
        setupEventListeners();
        setupAnimatedCounters();
        fetchServiceInfo();
        if (window.I18n) window.I18n.init();
        updateInputStats();
    }

    // === Theme ===
    function setupTheme() {
        const saved = localStorage.getItem('humanizekit-theme');
        if (saved) document.documentElement.setAttribute('data-theme', saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('humanizekit-theme', next);
    }

    // === i18n helper ===
    function t(key, ...args) {
        if (window.I18n) return window.I18n.t(key, ...args);
        return key;
    }

    // === Event Listeners ===
    function setupEventListeners() {
        inputText.addEventListener('input', onInputChange);

        humanizeBtn.addEventListener('click', doHumanize);
        analyzeOnlyBtn.addEventListener('click', doAnalyzeOnly);
        detectAiBtn.addEventListener('click', doDetectAi);
        clearBtn.addEventListener('click', clearAll);
        pasteBtn.addEventListener('click', pasteClipboard);
        themeToggle.addEventListener('click', toggleTheme);

        // Changes toggle
        if (changesToggle) {
            changesToggle.addEventListener('click', () => changesSection.classList.toggle('open'));
        }

        // Source tabs
        sourceTabs.forEach(tab => {
            tab.addEventListener('click', () => switchSource(tab.dataset.source));
        });

        // Check type pills
        checkTypePills.forEach(pill => {
            pill.addEventListener('click', () => {
                checkTypePills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentCheckType = pill.dataset.check;
            });
        });

        // File upload
        if (fileDropZone) {
            fileDropZone.addEventListener('dragover', (e) => { e.preventDefault(); fileDropZone.classList.add('drag-over'); });
            fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('drag-over'));
            fileDropZone.addEventListener('drop', (e) => {
                e.preventDefault(); fileDropZone.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
            });
        }
        if (fileInput) fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) handleFileUpload(fileInput.files[0]); });
        if (fileChooseBtn) fileChooseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });

        // URL fetch
        if (fetchUrlBtn) fetchUrlBtn.addEventListener('click', handleUrlFetch);
        if (urlInput) urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleUrlFetch(); });

        // Language switcher
        $$('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.I18n) {
                    window.I18n.setLang(btn.dataset.lang);
                    updateInputStats();
                }
            });
        });

        // Modal events
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if (modalCopyBtn) modalCopyBtn.addEventListener('click', copyModalResult);
        if (modalDiffBtn) modalDiffBtn.addEventListener('click', toggleModalDiff);
        if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!isProcessing && getInputText().trim()) doHumanize();
            }
            if (e.key === 'Escape') closeModal();
        });

        // Nav active state
        $$('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                $$('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    // === Source Switching ===
    function switchSource(source) {
        currentSource = source;
        sourceTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.source === source));
        const panels = { text: '#sourceText', file: '#sourceFile', url: '#sourceUrl' };
        Object.entries(panels).forEach(([key, sel]) => {
            const panel = $(sel);
            if (panel) panel.classList.toggle('active', key === source);
        });
    }

    function getInputText() { return inputText.value.trim(); }

    // === File Upload ===
    async function handleFileUpload(file) {
        if (file.size > 1024 * 1024) { showToast('error', t('toast.file.toobig')); return; }
        const ext = file.name.split('.').pop().toLowerCase();
        const allowed = ['txt', 'text', 'md', 'markdown', 'html', 'htm', 'csv', 'log'];
        if (!allowed.includes(ext)) { showToast('error', t('toast.file.type')); return; }

        if (['html', 'htm'].includes(ext)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await fetch('/api/extract', { method: 'POST', body: formData });
                if (response.ok) {
                    const data = await response.json();
                    if (data.ok && data.text) {
                        inputText.value = data.text;
                        switchSource('text');
                        onInputChange();
                        showToast('success', t('toast.file.loaded', file.name));
                        return;
                    }
                }
            } catch(e) { /* fallback */ }
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                inputText.value = e.target.result;
                switchSource('text');
                onInputChange();
                showToast('success', t('toast.file.loaded', file.name));
            };
            reader.onerror = () => showToast('error', t('toast.file.error'));
            reader.readAsText(file);
        } catch(e) { showToast('error', t('toast.file.error')); }

        if (fileName) { fileName.textContent = file.name; fileName.style.display = 'block'; }
    }

    // === URL Fetch ===
    async function handleUrlFetch() {
        const url = urlInput ? urlInput.value.trim() : '';
        if (!url) return;
        try { new URL(url); } catch { showToast('error', t('toast.url.error')); return; }

        if (fetchUrlBtn) fetchUrlBtn.disabled = true;
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (data.text) {
                inputText.value = data.text;
                switchSource('text');
                onInputChange();
                showToast('success', t('toast.url.fetched'));
            }
        } catch (err) {
            showToast('error', t('toast.url.error'));
        } finally {
            if (fetchUrlBtn) fetchUrlBtn.disabled = false;
        }
    }

    // === Input Stats ===
    function onInputChange() {
        updateInputStats();
        const hasText = inputText.value.trim().length > 0;
        humanizeBtn.disabled = !hasText;
        analyzeOnlyBtn.disabled = !hasText;
        detectAiBtn.disabled = !hasText;
    }

    function updateInputStats() {
        const text = inputText.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentences = text.trim() ? (text.match(/[.!?…]+/g) || []).length || (text.trim() ? 1 : 0) : 0;
        const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
        const readTimeSec = Math.ceil(words / 3.5);

        const cU = t('stats.chars'), wU = t('stats.words'), sU = t('stats.sent'), pU = t('stats.para'), rU = t('stats.read');
        statChars.textContent = `${chars} ${cU}`;
        statWords.textContent = `${words} ${wU}`;
        statSentences.textContent = `${sentences} ${sU}`;
        statParas.textContent = `${paragraphs || (text.trim() ? 1 : 0)} ${pU}`;
        statReadTime.textContent = readTimeSec > 60 ? `~${Math.round(readTimeSec/60)}m ${rU}` : `~${readTimeSec}s ${rU}`;
        [statChars, statWords, statSentences, statParas].forEach(el => el.classList.toggle('active', chars > 0));
    }

    // === Modal ===
    function openModal() {
        if (modalOverlay) {
            modalOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    function copyModalResult() {
        const text = lastResult ? lastResult.text : '';
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => showToast('success', t('toast.copied'))).catch(() => showToast('error', t('toast.copy.fail')));
    }

    function toggleModalDiff() {
        showDiff = !showDiff;
        if (modalDiffBtn) modalDiffBtn.classList.toggle('active', showDiff);
        if (lastResult) {
            if (showDiff) {
                renderDiffInModal(inputText.value, lastResult.text);
            } else {
                modalResultText.textContent = lastResult.text;
            }
        }
    }

    function populateModal(data) {
        // Result text
        modalResultText.textContent = data.text;
        showDiff = false;
        if (modalDiffBtn) modalDiffBtn.classList.remove('active');

        // Change badge
        if (data.change_ratio !== undefined) {
            const pct = Math.round(data.change_ratio * 100);
            modalChangeBadge.textContent = pct + '%';
        }

        // Result stats
        const text = data.text;
        const chars = text.length;
        const words = text.trim().split(/\s+/).length;
        const sentences = (text.match(/[.!?…]+/g) || []).length || 1;
        const cU = t('stats.chars'), wU = t('stats.words'), sU = t('stats.sent');
        $('#statCharsResult').textContent = `${chars} ${cU}`;
        $('#statWordsResult').textContent = `${words} ${wU}`;
        $('#statSentencesResult').textContent = `${sentences} ${sU}`;

        // Metrics in modal
        populateModalMetrics(data);

        // Changes in modal
        if (data.changes && data.changes.length > 0) {
            modalChanges.style.display = 'block';
            modalChangesList.innerHTML = '';
            data.changes.forEach(ch => {
                const item = document.createElement('div');
                item.className = 'modal-change-item';
                item.innerHTML = `<span class="modal-change-stage">${escapeHtml(ch.stage || '')}</span><del>${escapeHtml(ch.old || ch.before || '')}</del> → <ins>${escapeHtml(ch.new || ch.after || '')}</ins>`;
                modalChangesList.appendChild(item);
            });
        } else {
            modalChanges.style.display = 'none';
        }

        // Processing info
        if (data.elapsed_ms && modalProcessingTime) modalProcessingTime.textContent = `⏱ ${data.elapsed_ms}ms`;
        if (data.detected_lang && modalDetectedLang) modalDetectedLang.textContent = `🌍 ${data.detected_lang}`;
    }

    function populateModalMetrics(data) {
        if (!modalMetrics) return;
        const before = data.metrics_before;
        const after = data.metrics_after;
        if (!before || !after) { modalMetrics.innerHTML = ''; return; }

        const items = [
            { label: t('metrics.artificiality'), before: before.artificiality_score, after: after.artificiality_score, lower: true },
            { label: t('metrics.sentlen'), before: before.avg_sentence_length, after: after.avg_sentence_length, lower: false },
            { label: t('metrics.bureau'), before: before.bureaucratic_ratio, after: after.bureaucratic_ratio, lower: true },
            { label: t('metrics.burst'), before: before.burstiness_score, after: after.burstiness_score, lower: false },
            { label: t('metrics.connector'), before: before.connector_ratio, after: after.connector_ratio, lower: true },
            { label: t('metrics.repetition'), before: before.repetition_score, after: after.repetition_score, lower: true },
        ];

        modalMetrics.innerHTML = items.map(m => {
            const bv = typeof m.before === 'number' ? (m.before % 1 ? m.before.toFixed(2) : m.before) : '--';
            const av = typeof m.after === 'number' ? (m.after % 1 ? m.after.toFixed(2) : m.after) : '--';
            const improved = m.lower ? m.after < m.before : m.after > m.before;
            const arrow = improved ? '📉' : '📈';
            return `<div class="modal-metric-card"><div class="modal-metric-label">${escapeHtml(m.label)}</div><div class="modal-metric-values"><span class="modal-metric-before">${bv}</span><span class="modal-metric-arrow">${arrow}</span><span class="modal-metric-after">${av}</span></div></div>`;
        }).join('');
    }

    function renderDiffInModal(original, modified) {
        const origWords = original.split(/(\s+)/);
        const modWords = modified.split(/(\s+)/);
        let html = '';
        let i = 0, j = 0;
        while (i < origWords.length || j < modWords.length) {
            if (i < origWords.length && j < modWords.length && origWords[i] === modWords[j]) {
                html += escapeHtml(origWords[i]); i++; j++;
            } else if (j < modWords.length && (i >= origWords.length || origWords.indexOf(modWords[j], i) === -1 || j - i > 3)) {
                if (modWords[j].trim()) html += `<span class="diff-ins">${escapeHtml(modWords[j])}</span>`;
                else html += escapeHtml(modWords[j]);
                j++;
            } else if (i < origWords.length) {
                if (origWords[i].trim()) html += `<span class="diff-del">${escapeHtml(origWords[i])}</span>`;
                else html += escapeHtml(origWords[i]);
                i++;
            }
        }
        modalResultText.innerHTML = html;
    }

    // === API Calls ===
    async function doHumanize() {
        const text = inputText.value.trim();
        if (!text || isProcessing) return;

        setProcessing(true);
        try {
            const response = await fetch('/api/humanize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    lang: langSelect.value,
                    profile: 'web',
                    intensity: 60,
                }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            lastResult = data;

            // Populate and open modal
            populateModal(data);
            openModal();

            // Also update dashboard behind modal
            displayMetrics(data);

            // Run analysis for check type
            doAnalyzeWithCheckType(data.text);

            launchConfetti();
            showToast('success', t('toast.humanized', data.changes?.length || 0));
        } catch (err) {
            showToast('error', t('toast.error', err.message));
            console.error(err);
        } finally {
            setProcessing(false);
        }
    }

    async function doAnalyzeOnly() {
        const text = inputText.value.trim();
        if (!text || isProcessing) return;

        setProcessing(true);
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang: langSelect.value }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            displayByCheckType(data);
            showToast('info', t('toast.analysis'));
        } catch (err) {
            showToast('error', t('toast.error', err.message));
        } finally {
            setProcessing(false);
        }
    }

    async function doDetectAi() {
        const text = inputText.value.trim();
        if (!text || isProcessing) return;

        setProcessing(true);
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang: langSelect.value }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            displayAiDetection(data.ai_detection);
            showToast('info', t('toast.ai.score', data.ai_detection.score));
        } catch (err) {
            showToast('error', t('toast.error', err.message));
        } finally {
            setProcessing(false);
        }
    }

    async function doAnalyzeWithCheckType(text) {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang: langSelect.value }),
            });
            if (!response.ok) return;
            const data = await response.json();
            displayByCheckType(data);
        } catch (e) { /* silent */ }
    }

    // === Check Type Display ===
    function displayByCheckType(data) {
        aiDetectionPanel.style.display = 'none';
        if (readabilityPanel) readabilityPanel.style.display = 'none';
        if (stylePanel) stylePanel.style.display = 'none';

        switch (currentCheckType) {
            case 'comprehensive':
                displayAnalysis(data);
                if (data.ai_detection) displayAiDetection(data.ai_detection);
                if (data.stats) displayReadability(data);
                displayStyleQuality(data);
                break;
            case 'ai':
                if (data.ai_detection) displayAiDetection(data.ai_detection);
                break;
            case 'readability':
                if (data.stats) displayReadability(data);
                displayAnalysis(data);
                break;
            case 'style':
                displayStyleQuality(data);
                displayAnalysis(data);
                break;
        }
    }

    // === Display Readability ===
    function displayReadability(data) {
        if (!readabilityPanel || !data.stats) return;
        readabilityPanel.style.display = 'block';
        const s = data.stats;
        const avgSL = data.avg_sentence_length || 0;
        let grade = avgSL < 10 ? 'Easy' : avgSL < 15 ? 'Medium' : avgSL < 20 ? 'Advanced' : 'Complex';

        const readGrade = $('#readGrade');
        const readAvgWord = $('#readAvgWord');
        const readAvgSent = $('#readAvgSent');
        const readUnique = $('#readUnique');
        const readTime = $('#readTime');

        if (readGrade) readGrade.textContent = grade;
        if (readAvgWord) readAvgWord.textContent = s.avg_word_length || '--';
        if (readAvgSent) readAvgSent.textContent = (data.avg_sentence_length || 0).toFixed(1);
        if (readUnique) readUnique.textContent = s.unique_ratio ? (s.unique_ratio * 100).toFixed(0) + '%' : '--';
        if (readTime) {
            const sec = s.reading_time_sec || 0;
            readTime.textContent = sec > 60 ? `${Math.round(sec/60)}m` : `${sec}s`;
        }
    }

    // === Display Style Quality ===
    function displayStyleQuality(data) {
        if (!stylePanel) return;
        stylePanel.style.display = 'block';
        const styleBars = $('#styleBars');
        if (!styleBars) return;
        styleBars.innerHTML = '';

        const metrics = [
            { label: t('style.diversity'), value: data.stats ? data.stats.unique_ratio || 0 : 0, max: 1 },
            { label: t('style.burstiness'), value: data.burstiness_score || 0, max: 2 },
            { label: t('style.formality'), value: data.bureaucratic_ratio || 0, max: 0.5, inverse: true },
            { label: t('style.connectors'), value: data.connector_ratio || 0, max: 0.5 },
        ];

        metrics.forEach(m => {
            const pct = Math.min((m.value / m.max) * 100, 100);
            const displayPct = m.inverse ? (100 - pct) : pct;
            const qualityClass = displayPct >= 70 ? 'excellent' : displayPct >= 50 ? 'good' : displayPct >= 30 ? 'average' : 'poor';
            const row = document.createElement('div');
            row.className = 'style-bar-row';
            row.innerHTML = `<span class="style-bar-label">${escapeHtml(m.label)}</span><div class="style-bar-track"><div class="style-bar-fill ${qualityClass}" style="width: 0%"></div></div><span class="style-bar-value">${displayPct.toFixed(0)}%</span>`;
            styleBars.appendChild(row);
            setTimeout(() => { row.querySelector('.style-bar-fill').style.width = `${displayPct}%`; }, 150);
        });
    }

    async function fetchServiceInfo() {
        try {
            const response = await fetch('/api/info');
            if (!response.ok) return;
            const data = await response.json();
            const badge = $('#versionBadge');
            if (badge && data.version) badge.textContent = 'v' + data.version;
        } catch (e) { /* silent */ }
    }

    // === Display Analysis ===
    function displayAnalysis(data) {
        metricsDashboard.style.display = 'block';

        if (data.artificiality_score !== undefined) {
            updateMetricPair('artificialityBefore', 'artificialityAfter', data.artificiality_score, data.artificiality_score, 100);
            updateMetricPair('sentLenBefore', 'sentLenAfter', data.avg_sentence_length, data.avg_sentence_length, 40, 'sentLenBarBefore', 'sentLenBarAfter');
            updateMetricPair('bureaRatioBefore', 'bureaRatioAfter', data.bureaucratic_ratio, data.bureaucratic_ratio, 1, 'bureaBarBefore', 'bureaBarAfter');
            updateMetricPair('burstBefore', 'burstAfter', data.burstiness_score, data.burstiness_score, 2, 'burstBarBefore', 'burstBarAfter');
            updateMetricPair('connRatioBefore', 'connRatioAfter', data.connector_ratio, data.connector_ratio, 0.3, 'connBarBefore', 'connBarAfter');
            updateMetricPair('repScoreBefore', 'repScoreAfter', data.repetition_score, data.repetition_score, 1, 'repBarBefore', 'repBarAfter');
            animateGauge('artificialityGauge', data.artificiality_score / 100);
        }

        if (data.ai_detection && currentCheckType === 'comprehensive') {
            displayAiDetection(data.ai_detection);
        }

        if (data.stats) {
            const s = data.stats;
            const cU = t('stats.chars'), wU = t('stats.words'), sU = t('stats.sent'), pU = t('stats.para'), rU = t('stats.read');
            statChars.textContent = `${s.chars || s.characters} ${cU}`;
            statWords.textContent = `${s.words} ${wU}`;
            statSentences.textContent = `${s.sentences} ${sU}`;
            statParas.textContent = `${s.paragraphs} ${pU}`;
            statReadTime.textContent = s.reading_time_sec > 60 ? `~${Math.round(s.reading_time_sec/60)}m ${rU}` : `~${s.reading_time_sec}s ${rU}`;
        }

        if (data.elapsed_ms) {
            const el = $('#processingTime');
            if (el) el.textContent = `⏱ ${data.elapsed_ms}ms`;
        }
    }

    // === Display Metrics from Humanize ===
    function displayMetrics(data) {
        const before = data.metrics_before;
        const after = data.metrics_after;
        if (!before || !after) return;

        metricsDashboard.style.display = 'block';

        animateValuePair('artificialityBefore', 'artificialityAfter', before.artificiality_score, after.artificiality_score);
        animateGauge('artificialityGauge', after.artificiality_score / 100);
        const dir = after.artificiality_score < before.artificiality_score ? '📉' : after.artificiality_score > before.artificiality_score ? '📈' : '➡️';
        const dirEl = $('#artificialityDir');
        if (dirEl) dirEl.textContent = dir;

        setupMetricBar('sentLen', before.avg_sentence_length, after.avg_sentence_length, 40);
        setupMetricBar('bureaRatio', before.bureaucratic_ratio, after.bureaucratic_ratio, 1);
        setupMetricBar('burst', before.burstiness_score, after.burstiness_score, 2);
        setupMetricBar('connRatio', before.connector_ratio, after.connector_ratio, 0.3);
        setupMetricBar('repScore', before.repetition_score, after.repetition_score, 1);

        if (data.changes && data.changes.length > 0) {
            changesSection.style.display = 'block';
            changesList.innerHTML = '';
            data.changes.forEach(ch => {
                const item = document.createElement('div');
                item.className = 'change-item';
                item.innerHTML = `<span class="change-stage">${escapeHtml(ch.stage || '')}</span><del>${escapeHtml(ch.old || ch.before || '')}</del> → <ins>${escapeHtml(ch.new || ch.after || '')}</ins>`;
                changesList.appendChild(item);
            });
        }

        const pTime = $('#processingTime');
        const dLang = $('#detectedLang');
        if (data.elapsed_ms && pTime) pTime.textContent = `⏱ ${data.elapsed_ms}ms`;
        if (data.detected_lang && dLang) dLang.textContent = `🌍 ${data.detected_lang}`;
    }

    function setupMetricBar(prefix, before, after, max) {
        const bEl = $(`#${prefix}Before`), aEl = $(`#${prefix}After`);
        const bBar = $(`#${prefix}BarBefore`), aBar = $(`#${prefix}BarAfter`);
        if (bEl) animateNumber(bEl, before, isFloat(before));
        if (aEl) animateNumber(aEl, after, isFloat(after));
        if (bBar) setTimeout(() => { bBar.style.width = `${Math.min(before / max * 100, 100)}%`; }, 100);
        if (aBar) setTimeout(() => { aBar.style.width = `${Math.min(after / max * 100, 100)}%`; }, 200);
    }

    function updateMetricPair(beforeId, afterId, bVal, aVal, max, barBeforeId, barAfterId) {
        const bEl = $(`#${beforeId}`), aEl = $(`#${afterId}`);
        if (bEl) animateNumber(bEl, bVal, isFloat(bVal));
        if (aEl) animateNumber(aEl, aVal, isFloat(aVal));
        if (barBeforeId) { const bb = $(`#${barBeforeId}`); if (bb) setTimeout(() => { bb.style.width = `${Math.min(bVal / max * 100, 100)}%`; }, 100); }
        if (barAfterId) { const ab = $(`#${barAfterId}`); if (ab) setTimeout(() => { ab.style.width = `${Math.min(aVal / max * 100, 100)}%`; }, 200); }
    }

    function animateValuePair(beforeId, afterId, bVal, aVal) {
        const bEl = $(`#${beforeId}`), aEl = $(`#${afterId}`);
        if (bEl) animateNumber(bEl, bVal, isFloat(bVal));
        if (aEl) animateNumber(aEl, aVal, isFloat(aVal));
    }

    function isFloat(v) { return v !== Math.floor(v); }

    // === AI Detection Display (with factor translation) ===
    function displayAiDetection(ai) {
        if (!ai) return;
        aiDetectionPanel.style.display = 'block';

        const score = ai.score || 0;
        const ring = $('#aiRingFill');
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (score / 100) * circumference;

        ensureAiGradient();

        setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);
        animateNumber($('#aiScoreNumber'), score, false);

        const verdict = $('#aiVerdict');
        verdict.textContent = ai.label || getAiLabel(score);
        verdict.className = 'ai-verdict';
        if (score < 30) verdict.classList.add('human');
        else if (score < 65) verdict.classList.add('mixed');
        else verdict.classList.add('ai');

        const factorsEl = $('#aiFactors');
        factorsEl.innerHTML = '';

        const factors = ai.factors || [];
        factors.forEach(f => {
            const row = document.createElement('div');
            row.className = 'ai-factor-row';
            const level = f.value < 0.35 ? 'low' : f.value < 0.65 ? 'medium' : 'high';

            // Translate factor name
            const i18nKey = FACTOR_KEYS[f.name];
            const translatedName = i18nKey ? t(i18nKey) : f.name;

            row.innerHTML = `
                <span class="ai-factor-name">${escapeHtml(translatedName)}</span>
                <div class="ai-factor-bar"><div class="ai-factor-fill ${level}" style="width: 0%"></div></div>
                <span class="ai-factor-value">${Math.round(f.value * 100)}%</span>
            `;
            factorsEl.appendChild(row);
            setTimeout(() => { row.querySelector('.ai-factor-fill').style.width = `${Math.round(f.value * 100)}%`; }, 200);
        });
    }

    function ensureAiGradient() {
        if (document.getElementById('aiGaugeGrad')) return;
        const svg = document.querySelector('.ai-ring');
        if (!svg) return;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', 'aiGaugeGrad');
        grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#10b981');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '50%'); stop2.setAttribute('stop-color', '#f59e0b');
        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop3.setAttribute('offset', '100%'); stop3.setAttribute('stop-color', '#ef4444');
        grad.appendChild(stop1); grad.appendChild(stop2); grad.appendChild(stop3);
        defs.appendChild(grad);
        svg.insertBefore(defs, svg.firstChild);
    }

    function getAiLabel(score) {
        if (score < 15) return t('ai.human.written');
        if (score < 30) return t('ai.likely.human');
        if (score < 50) return t('ai.mixed');
        if (score < 65) return t('ai.possibly.ai');
        if (score < 80) return t('ai.likely.ai');
        return t('ai.generated');
    }

    // === Animations ===
    function animateNumber(el, target, isDecimal) {
        if (!el) return;
        const start = parseFloat(el.textContent) || 0;
        const diff = target - start;
        const duration = 800;
        const startTime = performance.now();
        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + diff * eased;
            el.textContent = isDecimal ? current.toFixed(2) : Math.round(current);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    function animateGauge(id, fraction) {
        const el = $(`#${id}`);
        if (!el) return;
        const maxDash = 157;
        const offset = maxDash - (fraction * maxDash);
        setTimeout(() => { el.style.strokeDashoffset = Math.max(offset, 0); }, 200);
    }

    function setupAnimatedCounters() {
        const counters = $$('.stat-number[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    animateNumber(el, parseInt(el.dataset.count), false);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(el => observer.observe(el));
    }

    // === Effects ===
    function launchConfetti() {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.top = '-10px';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.width = Math.random() * 8 + 4 + 'px';
            piece.style.height = Math.random() * 8 + 4 + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = Math.random() * 1.5 + 2 + 's';
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 4000);
        }
    }

    // === Toast ===
    function showToast(type, message) {
        const container = $('#toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span><span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // === Utility ===
    function setProcessing(state) {
        isProcessing = state;
        humanizeBtn.classList.toggle('loading', state);
        humanizeBtn.disabled = state;
        analyzeOnlyBtn.disabled = state;
        detectAiBtn.disabled = state;
    }

    function clearAll() {
        inputText.value = '';
        lastResult = null;
        showDiff = false;
        metricsDashboard.style.display = 'none';
        aiDetectionPanel.style.display = 'none';
        if (readabilityPanel) readabilityPanel.style.display = 'none';
        if (stylePanel) stylePanel.style.display = 'none';
        if (changesSection) changesSection.style.display = 'none';
        humanizeBtn.disabled = true;
        analyzeOnlyBtn.disabled = true;
        detectAiBtn.disabled = true;
        if (urlInput) urlInput.value = '';
        if (fileName) fileName.style.display = 'none';
        if (fileInput) fileInput.value = '';
        closeModal();
        updateInputStats();
        showToast('info', t('toast.cleared'));
    }

    async function pasteClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            onInputChange();
            showToast('success', t('toast.pasted'));
        } catch (e) {
            showToast('error', t('toast.paste.fail'));
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // === Start ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
