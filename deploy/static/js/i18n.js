/**
 * HumanizeKit — Internationalization (i18n)
 * Supports: English (en), Russian (ru), Ukrainian (uk)
 */
(function() {
    'use strict';

    const translations = {
        en: {
            // Header & Nav
            'nav.tool': 'Tool',
            'nav.pipeline': 'Pipeline',
            'nav.api': 'API',

            // Hero
            'hero.badge': 'Powered by TextHumanize Engine',
            'hero.title.1': 'Transform ',
            'hero.title.highlight': 'AI Text',
            'hero.title.2': ' into',
            'hero.title.3': 'Natural Human Writing',
            'hero.subtitle': 'Algorithmic text naturalization — normalize typography, simplify bureaucratic language, diversify sentence structure, boost burstiness & perplexity. <strong>9 languages</strong>, zero external API calls.',
            'hero.stat.stages': 'Pipeline Stages',
            'hero.stat.languages': 'Languages',
            'hero.stat.profiles': 'Profiles',
            'hero.stat.delay': 'Network Delay',

            // Controls
            'ctrl.language': 'Language',
            'ctrl.profile': 'Profile',
            'ctrl.intensity': 'Intensity',
            'ctrl.slider.typo': 'Typography',
            'ctrl.slider.light': 'Light',
            'ctrl.slider.medium': 'Medium',
            'ctrl.slider.strong': 'Strong',
            'ctrl.slider.max': 'Maximum',

            // Input Source
            'source.text': 'Text',
            'source.file': 'File',
            'source.url': 'URL',

            // Editor
            'editor.original': 'Original Text',
            'editor.result': 'Humanized Result',
            'editor.placeholder': 'Paste your AI-generated text here...\n\nExample: Furthermore, it is important to note that the implementation of cloud computing facilitates the optimization of business processes.',
            'editor.result.placeholder': 'Your humanized text will appear here',
            'editor.paste': 'Paste from clipboard',
            'editor.clear': 'Clear text',
            'editor.copy': 'Copy result',
            'editor.diff': 'Toggle diff view',

            // File Upload
            'file.drop': 'Drop file here or click to choose',
            'file.formats': 'Supports: TXT, HTML, MD',
            'file.choose': 'Choose File',

            // URL Input
            'url.placeholder': 'Enter URL to extract text from...',
            'url.fetch': 'Fetch',

            // Action Buttons
            'btn.humanize': 'Humanize',
            'btn.processing': 'Processing...',
            'btn.analyze': 'Analyze Only',
            'btn.detect': 'AI Detector',
            'btn.shortcut': '⌘+Enter to process',

            // Check Types
            'check.type': 'Check Type',
            'check.comprehensive': 'Comprehensive',
            'check.ai': 'AI Detection',
            'check.readability': 'Readability',
            'check.style': 'Style Quality',

            // Stats
            'stats.chars': 'chars',
            'stats.words': 'words',
            'stats.sent': 'sent.',
            'stats.para': 'para.',
            'stats.read': 'read',

            // AI Detection
            'ai.title': 'AI Detection Analysis',
            'ai.score': 'AI Score',
            'ai.human.written': '✅ Human Written',
            'ai.likely.human': '🟢 Likely Human',
            'ai.mixed': '🟡 Mixed / Edited',
            'ai.possibly.ai': '🟠 Possibly AI',
            'ai.likely.ai': '🔴 Likely AI',
            'ai.generated': '⛔ AI Generated',

            // Metrics
            'metrics.title': 'Analysis Dashboard',
            'metrics.artificiality': 'Artificiality Score',
            'metrics.sentlen': 'Avg Sentence Length',
            'metrics.bureau': 'Bureaucratic Ratio',
            'metrics.burst': 'Burstiness',
            'metrics.connector': 'Connector Ratio',
            'metrics.repetition': 'Repetition Score',
            'metrics.before': 'Before',
            'metrics.after': 'After',

            // Readability Panel
            'readability.title': 'Readability Analysis',
            'readability.grade': 'Reading Level',
            'readability.avgword': 'Avg Word Length',
            'readability.avgsentence': 'Avg Sentence Length',
            'readability.unique': 'Vocabulary Richness',
            'readability.readtime': 'Reading Time',

            // Style Panel
            'style.title': 'Style Quality',
            'style.diversity': 'Vocabulary Diversity',
            'style.burstiness': 'Sentence Variation',
            'style.formality': 'Formality Level',
            'style.connectors': 'Connector Usage',

            // Changes
            'changes.title': 'Detailed Changes',

            // Pipeline
            'pipeline.title': '10-Stage Processing Pipeline',
            'pipeline.subtitle': 'Each text passes through a carefully orchestrated series of transformations',
            'pipe.1.title': 'Segmentation',
            'pipe.1.desc': 'Protect code blocks, URLs, emails, brands',
            'pipe.2.title': 'Typography',
            'pipe.2.desc': 'Normalize dashes, quotes, ellipses, punctuation',
            'pipe.3.title': 'Debureaucratization',
            'pipe.3.desc': 'Replace bureaucratic/formal words',
            'pipe.4.title': 'Structure',
            'pipe.4.desc': 'Diversify sentence openings and structure',
            'pipe.5.title': 'Repetitions',
            'pipe.5.desc': 'Reduce word/phrase repetitions with synonyms',
            'pipe.6.title': 'Liveliness',
            'pipe.6.desc': 'Inject natural phrasing, colloquialisms',
            'pipe.7.title': 'Universal',
            'pipe.7.desc': 'Statistical processing for ALL languages',
            'pipe.8.title': 'Naturalization',
            'pipe.8.desc': 'Style naturalization: burstiness & perplexity',
            'pipe.9.title': 'Validation',
            'pipe.9.desc': 'Quality check, rollback if needed',
            'pipe.10.title': 'Restore',
            'pipe.10.desc': 'Restore protected segments',

            // Features
            'features.title': 'Key Features',
            'feat.fast.title': 'Lightning Fast',
            'feat.fast.desc': 'Pure algorithmic processing. Zero external API calls. Instant results.',
            'feat.private.title': '100% Private',
            'feat.private.desc': 'All processing happens on server. Your data never leaves the system.',
            'feat.control.title': 'Fine-Tuned Control',
            'feat.control.desc': '5 profiles, intensity slider, keyword preservation, and preserve options.',
            'feat.lang.title': '9+ Languages',
            'feat.lang.desc': 'Full dictionary support for 9 languages plus universal processor for any other.',
            'feat.ai.title': 'AI Detector',
            'feat.ai.desc': 'Built-in heuristic AI detection with detailed factor analysis and scoring.',
            'feat.metrics.title': 'Readability Metrics',
            'feat.metrics.desc': 'Burstiness, artificiality, bureaucratic ratio, connector analysis built-in.',

            // API
            'api.title': 'REST API',
            'api.subtitle': 'Integrate HumanizeKit into your workflow',
            'api.humanize.desc': 'Transform text to sound more natural',
            'api.analyze.desc': 'Analyze text metrics + AI detection',
            'api.info.desc': 'Service metadata and supported options',

            // Footer
            'footer.desc': 'Algorithmic text naturalization service',
            'footer.powered': 'Powered by',
            'footer.engine': 'TextHumanize',

            // Toasts
            'toast.copied': 'Copied to clipboard!',
            'toast.copy.fail': 'Failed to copy',
            'toast.cleared': 'Cleared',
            'toast.pasted': 'Pasted from clipboard',
            'toast.paste.fail': 'Cannot access clipboard',
            'toast.humanized': 'Humanized! {0} changes applied',
            'toast.analysis': 'Analysis complete',
            'toast.ai.score': 'AI Score: {0}',
            'toast.error': 'Error: {0}',
            'toast.file.loaded': 'File loaded: {0}',
            'toast.file.error': 'Cannot read file',
            'toast.url.fetched': 'Text extracted from URL',
            'toast.url.error': 'Failed to fetch URL',
            'toast.file.toobig': 'File too large (max 1MB)',
            'toast.file.type': 'Unsupported file type',
        },

        ru: {
            // Header & Nav
            'nav.tool': 'Инструмент',
            'nav.pipeline': 'Конвейер',
            'nav.api': 'API',

            // Hero
            'hero.badge': 'На базе TextHumanize Engine',
            'hero.title.1': 'Превратите ',
            'hero.title.highlight': 'ИИ-текст',
            'hero.title.2': ' в',
            'hero.title.3': 'Естественную речь',
            'hero.subtitle': 'Алгоритмическая натурализация текста — нормализация типографики, упрощение канцелярского языка, разнообразие структуры предложений, повышение вариативности. <strong>9 языков</strong>, без внешних API-вызовов.',
            'hero.stat.stages': 'Этапов обработки',
            'hero.stat.languages': 'Языков',
            'hero.stat.profiles': 'Профилей',
            'hero.stat.delay': 'Задержка сети',

            // Controls
            'ctrl.language': 'Язык',
            'ctrl.profile': 'Профиль',
            'ctrl.intensity': 'Интенсивность',
            'ctrl.slider.typo': 'Типографика',
            'ctrl.slider.light': 'Лёгкая',
            'ctrl.slider.medium': 'Средняя',
            'ctrl.slider.strong': 'Сильная',
            'ctrl.slider.max': 'Максимум',

            // Input Source
            'source.text': 'Текст',
            'source.file': 'Файл',
            'source.url': 'Ссылка',

            // Editor
            'editor.original': 'Исходный текст',
            'editor.result': 'Результат',
            'editor.placeholder': 'Вставьте сгенерированный ИИ текст сюда...\n\nПример: Более того, важно отметить, что внедрение облачных вычислений способствует оптимизации бизнес-процессов.',
            'editor.result.placeholder': 'Здесь появится обработанный текст',
            'editor.paste': 'Вставить из буфера',
            'editor.clear': 'Очистить',
            'editor.copy': 'Скопировать результат',
            'editor.diff': 'Показать различия',

            // File Upload
            'file.drop': 'Перетащите файл или нажмите для выбора',
            'file.formats': 'Поддерживаются: TXT, HTML, MD',
            'file.choose': 'Выбрать файл',

            // URL Input
            'url.placeholder': 'Введите URL для извлечения текста...',
            'url.fetch': 'Загрузить',

            // Action Buttons
            'btn.humanize': 'Гуманизировать',
            'btn.processing': 'Обработка...',
            'btn.analyze': 'Только анализ',
            'btn.detect': 'Детектор ИИ',
            'btn.shortcut': '⌘+Enter для обработки',

            // Check Types
            'check.type': 'Тип проверки',
            'check.comprehensive': 'Комплексная',
            'check.ai': 'Детекция ИИ',
            'check.readability': 'Читаемость',
            'check.style': 'Качество стиля',

            // Stats
            'stats.chars': 'симв.',
            'stats.words': 'слов',
            'stats.sent': 'предл.',
            'stats.para': 'абз.',
            'stats.read': 'чтение',

            // AI Detection
            'ai.title': 'Анализ ИИ-детекции',
            'ai.score': 'ИИ оценка',
            'ai.human.written': '✅ Написано человеком',
            'ai.likely.human': '🟢 Вероятно человек',
            'ai.mixed': '🟡 Смешанный / Редактированный',
            'ai.possibly.ai': '🟠 Возможно ИИ',
            'ai.likely.ai': '🔴 Вероятно ИИ',
            'ai.generated': '⛔ Сгенерировано ИИ',

            // Metrics
            'metrics.title': 'Панель аналитики',
            'metrics.artificiality': 'Индекс искусственности',
            'metrics.sentlen': 'Средняя длина предложения',
            'metrics.bureau': 'Канцеляризмы',
            'metrics.burst': 'Вариативность',
            'metrics.connector': 'Коэффициент связок',
            'metrics.repetition': 'Оценка повторов',
            'metrics.before': 'До',
            'metrics.after': 'После',

            // Readability Panel
            'readability.title': 'Анализ читаемости',
            'readability.grade': 'Уровень чтения',
            'readability.avgword': 'Средняя длина слова',
            'readability.avgsentence': 'Средняя длина предложения',
            'readability.unique': 'Богатство словаря',
            'readability.readtime': 'Время чтения',

            // Style Panel
            'style.title': 'Качество стиля',
            'style.diversity': 'Разнообразие словаря',
            'style.burstiness': 'Вариация предложений',
            'style.formality': 'Уровень формальности',
            'style.connectors': 'Использование связок',

            // Changes
            'changes.title': 'Детальные изменения',

            // Pipeline
            'pipeline.title': '10-этапный конвейер обработки',
            'pipeline.subtitle': 'Каждый текст проходит через серию тщательно выверенных трансформаций',
            'pipe.1.title': 'Сегментация',
            'pipe.1.desc': 'Защита блоков кода, URL, email, брендов',
            'pipe.2.title': 'Типографика',
            'pipe.2.desc': 'Нормализация тире, кавычек, многоточий',
            'pipe.3.title': 'Дебюрократизация',
            'pipe.3.desc': 'Замена канцелярских/формальных слов',
            'pipe.4.title': 'Структура',
            'pipe.4.desc': 'Разнообразие начал и структуры предложений',
            'pipe.5.title': 'Повторы',
            'pipe.5.desc': 'Сокращение повторов слов/фраз синонимами',
            'pipe.6.title': 'Живость',
            'pipe.6.desc': 'Вставка естественных оборотов, разговорных фраз',
            'pipe.7.title': 'Универсальный',
            'pipe.7.desc': 'Статистическая обработка для ВСЕХ языков',
            'pipe.8.title': 'Натурализация',
            'pipe.8.desc': 'Стилевая натурализация: вариативность и перплексия',
            'pipe.9.title': 'Валидация',
            'pipe.9.desc': 'Проверка качества, откат при необходимости',
            'pipe.10.title': 'Восстановление',
            'pipe.10.desc': 'Восстановление защищённых сегментов',

            // Features
            'features.title': 'Ключевые возможности',
            'feat.fast.title': 'Молниеносная скорость',
            'feat.fast.desc': 'Чисто алгоритмическая обработка. Без внешних API. Мгновенный результат.',
            'feat.private.title': '100% приватность',
            'feat.private.desc': 'Вся обработка на сервере. Ваши данные никуда не уходят.',
            'feat.control.title': 'Тонкая настройка',
            'feat.control.desc': '5 профилей, слайдер интенсивности, сохранение ключевых слов.',
            'feat.lang.title': '9+ языков',
            'feat.lang.desc': 'Полная поддержка словарей для 9 языков и универсальный процессор для остальных.',
            'feat.ai.title': 'Детектор ИИ',
            'feat.ai.desc': 'Встроенный эвристический детектор ИИ с детальным анализом факторов.',
            'feat.metrics.title': 'Метрики читаемости',
            'feat.metrics.desc': 'Вариативность, искусственность, канцеляризмы, анализ связок — всё встроено.',

            // API
            'api.title': 'REST API',
            'api.subtitle': 'Интегрируйте HumanizeKit в свой рабочий процесс',
            'api.humanize.desc': 'Преобразование текста в более естественный',
            'api.analyze.desc': 'Анализ метрик текста + детекция ИИ',
            'api.info.desc': 'Метаданные сервиса и поддерживаемые опции',

            // Footer
            'footer.desc': 'Сервис алгоритмической натурализации текста',
            'footer.powered': 'Работает на',
            'footer.engine': 'TextHumanize',

            // Toasts
            'toast.copied': 'Скопировано в буфер!',
            'toast.copy.fail': 'Не удалось скопировать',
            'toast.cleared': 'Очищено',
            'toast.pasted': 'Вставлено из буфера',
            'toast.paste.fail': 'Нет доступа к буферу обмена',
            'toast.humanized': 'Гуманизировано! {0} изменений применено',
            'toast.analysis': 'Анализ завершён',
            'toast.ai.score': 'ИИ оценка: {0}',
            'toast.error': 'Ошибка: {0}',
            'toast.file.loaded': 'Файл загружен: {0}',
            'toast.file.error': 'Не удалось прочитать файл',
            'toast.url.fetched': 'Текст извлечён из URL',
            'toast.url.error': 'Не удалось загрузить URL',
            'toast.file.toobig': 'Файл слишком большой (макс 1МБ)',
            'toast.file.type': 'Неподдерживаемый тип файла',
        },

        uk: {
            // Header & Nav
            'nav.tool': 'Інструмент',
            'nav.pipeline': 'Конвеєр',
            'nav.api': 'API',

            // Hero
            'hero.badge': 'На базі TextHumanize Engine',
            'hero.title.1': 'Перетворіть ',
            'hero.title.highlight': 'ШІ-текст',
            'hero.title.2': ' на',
            'hero.title.3': 'Природне людське мовлення',
            'hero.subtitle': 'Алгоритмічна натуралізація тексту — нормалізація типографіки, спрощення канцелярської мови, урізноманітнення структури речень, підвищення варіативності. <strong>9 мов</strong>, без зовнішніх API-викликів.',
            'hero.stat.stages': 'Етапів обробки',
            'hero.stat.languages': 'Мов',
            'hero.stat.profiles': 'Профілів',
            'hero.stat.delay': 'Затримка мережі',

            // Controls
            'ctrl.language': 'Мова',
            'ctrl.profile': 'Профіль',
            'ctrl.intensity': 'Інтенсивність',
            'ctrl.slider.typo': 'Типографіка',
            'ctrl.slider.light': 'Легка',
            'ctrl.slider.medium': 'Середня',
            'ctrl.slider.strong': 'Сильна',
            'ctrl.slider.max': 'Максимум',

            // Input Source
            'source.text': 'Текст',
            'source.file': 'Файл',
            'source.url': 'Посилання',

            // Editor
            'editor.original': 'Вихідний текст',
            'editor.result': 'Результат',
            'editor.placeholder': 'Вставте згенерований ШІ текст сюди...\n\nПриклад: Більш того, важливо зазначити, що впровадження хмарних обчислень сприяє оптимізації бізнес-процесів.',
            'editor.result.placeholder': 'Тут з\'явиться оброблений текст',
            'editor.paste': 'Вставити з буферу',
            'editor.clear': 'Очистити',
            'editor.copy': 'Скопіювати результат',
            'editor.diff': 'Показати відмінності',

            // File Upload
            'file.drop': 'Перетягніть файл або натисніть для вибору',
            'file.formats': 'Підтримуються: TXT, HTML, MD',
            'file.choose': 'Обрати файл',

            // URL Input
            'url.placeholder': 'Введіть URL для вилучення тексту...',
            'url.fetch': 'Завантажити',

            // Action Buttons
            'btn.humanize': 'Гуманізувати',
            'btn.processing': 'Обробка...',
            'btn.analyze': 'Тільки аналіз',
            'btn.detect': 'Детектор ШІ',
            'btn.shortcut': '⌘+Enter для обробки',

            // Check Types
            'check.type': 'Тип перевірки',
            'check.comprehensive': 'Комплексна',
            'check.ai': 'Детекція ШІ',
            'check.readability': 'Читабельність',
            'check.style': 'Якість стилю',

            // Stats
            'stats.chars': 'симв.',
            'stats.words': 'слів',
            'stats.sent': 'реч.',
            'stats.para': 'абз.',
            'stats.read': 'читання',

            // AI Detection
            'ai.title': 'Аналіз ШІ-детекції',
            'ai.score': 'ШІ оцінка',
            'ai.human.written': '✅ Написано людиною',
            'ai.likely.human': '🟢 Ймовірно людина',
            'ai.mixed': '🟡 Змішаний / Редагований',
            'ai.possibly.ai': '🟠 Можливо ШІ',
            'ai.likely.ai': '🔴 Ймовірно ШІ',
            'ai.generated': '⛔ Згенеровано ШІ',

            // Metrics
            'metrics.title': 'Панель аналітики',
            'metrics.artificiality': 'Індекс штучності',
            'metrics.sentlen': 'Середня довжина речення',
            'metrics.bureau': 'Канцеляризми',
            'metrics.burst': 'Варіативність',
            'metrics.connector': 'Коефіцієнт зв\'язок',
            'metrics.repetition': 'Оцінка повторів',
            'metrics.before': 'До',
            'metrics.after': 'Після',

            // Readability Panel
            'readability.title': 'Аналіз читабельності',
            'readability.grade': 'Рівень читання',
            'readability.avgword': 'Середня довжина слова',
            'readability.avgsentence': 'Середня довжина речення',
            'readability.unique': 'Багатство словника',
            'readability.readtime': 'Час читання',

            // Style Panel
            'style.title': 'Якість стилю',
            'style.diversity': 'Різноманітність словника',
            'style.burstiness': 'Варіація речень',
            'style.formality': 'Рівень формальності',
            'style.connectors': 'Використання зв\'язок',

            // Changes
            'changes.title': 'Детальні зміни',

            // Pipeline
            'pipeline.title': '10-етапний конвеєр обробки',
            'pipeline.subtitle': 'Кожен текст проходить через серію ретельно вивірених трансформацій',
            'pipe.1.title': 'Сегментація',
            'pipe.1.desc': 'Захист блоків коду, URL, email, брендів',
            'pipe.2.title': 'Типографіка',
            'pipe.2.desc': 'Нормалізація тире, лапок, трикрапок',
            'pipe.3.title': 'Дебюрократизація',
            'pipe.3.desc': 'Заміна канцелярських/формальних слів',
            'pipe.4.title': 'Структура',
            'pipe.4.desc': 'Урізноманітнення початків та структури речень',
            'pipe.5.title': 'Повтори',
            'pipe.5.desc': 'Зменшення повторів слів/фраз синонімами',
            'pipe.6.title': 'Жвавість',
            'pipe.6.desc': 'Додавання природних зворотів, розмовних фраз',
            'pipe.7.title': 'Універсальний',
            'pipe.7.desc': 'Статистична обробка для ВСІХ мов',
            'pipe.8.title': 'Натуралізація',
            'pipe.8.desc': 'Стильова натуралізація: варіативність та перплексія',
            'pipe.9.title': 'Валідація',
            'pipe.9.desc': 'Перевірка якості, відкат за потреби',
            'pipe.10.title': 'Відновлення',
            'pipe.10.desc': 'Відновлення захищених сегментів',

            // Features
            'features.title': 'Ключові можливості',
            'feat.fast.title': 'Блискавична швидкість',
            'feat.fast.desc': 'Чисто алгоритмічна обробка. Без зовнішніх API. Миттєвий результат.',
            'feat.private.title': '100% приватність',
            'feat.private.desc': 'Вся обробка на сервері. Ваші дані нікуди не йдуть.',
            'feat.control.title': 'Тонке налаштування',
            'feat.control.desc': '5 профілів, слайдер інтенсивності, збереження ключових слів.',
            'feat.lang.title': '9+ мов',
            'feat.lang.desc': 'Повна підтримка словників для 9 мов та універсальний процесор для решти.',
            'feat.ai.title': 'Детектор ШІ',
            'feat.ai.desc': 'Вбудований евристичний детектор ШІ з детальним аналізом факторів.',
            'feat.metrics.title': 'Метрики читабельності',
            'feat.metrics.desc': 'Варіативність, штучність, канцеляризми, аналіз зв\'язок — все вбудовано.',

            // API
            'api.title': 'REST API',
            'api.subtitle': 'Інтегруйте HumanizeKit у свій робочий процес',
            'api.humanize.desc': 'Перетворення тексту на більш природний',
            'api.analyze.desc': 'Аналіз метрик тексту + детекція ШІ',
            'api.info.desc': 'Метадані сервісу та підтримувані опції',

            // Footer
            'footer.desc': 'Сервіс алгоритмічної натуралізації тексту',
            'footer.powered': 'Працює на',
            'footer.engine': 'TextHumanize',

            // Toasts
            'toast.copied': 'Скопійовано до буферу!',
            'toast.copy.fail': 'Не вдалося скопіювати',
            'toast.cleared': 'Очищено',
            'toast.pasted': 'Вставлено з буферу',
            'toast.paste.fail': 'Немає доступу до буферу обміну',
            'toast.humanized': 'Гуманізовано! {0} змін застосовано',
            'toast.analysis': 'Аналіз завершено',
            'toast.ai.score': 'ШІ оцінка: {0}',
            'toast.error': 'Помилка: {0}',
            'toast.file.loaded': 'Файл завантажено: {0}',
            'toast.file.error': 'Не вдалося прочитати файл',
            'toast.url.fetched': 'Текст вилучено з URL',
            'toast.url.error': 'Не вдалося завантажити URL',
            'toast.file.toobig': 'Файл завеликий (макс 1МБ)',
            'toast.file.type': 'Непідтримуваний тип файлу',
        }
    };

    let currentLang = 'en';

    function setLang(lang) {
        if (!translations[lang]) lang = 'en';
        currentLang = lang;
        localStorage.setItem('humanizekit-lang', lang);
        applyTranslations();
        updateLangSwitcher();
    }

    function getLang() {
        return currentLang;
    }

    function t(key, ...args) {
        const dict = translations[currentLang] || translations['en'];
        let str = dict[key] || translations['en'][key] || key;
        args.forEach((arg, i) => {
            str = str.replace(`{${i}}`, arg);
        });
        return str;
    }

    function applyTranslations() {
        // Apply to all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                // Check if it has data-i18n-html for HTML content
                if (el.hasAttribute('data-i18n-html')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Apply to elements with data-i18n-title (for tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });

        // Apply to elements with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
        });

        // Update document language
        document.documentElement.lang = currentLang;
    }

    function updateLangSwitcher() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }

    function initI18n() {
        const saved = localStorage.getItem('humanizekit-lang');
        if (saved && translations[saved]) {
            currentLang = saved;
        } else {
            // Try to detect from browser
            const browserLang = navigator.language.slice(0, 2).toLowerCase();
            if (translations[browserLang]) {
                currentLang = browserLang;
            }
        }
        applyTranslations();
        updateLangSwitcher();
    }

    // Expose globally
    window.I18n = {
        t: t,
        setLang: setLang,
        getLang: getLang,
        init: initI18n,
        apply: applyTranslations
    };
})();
