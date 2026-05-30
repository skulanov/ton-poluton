class PianoApp {
    constructor() {
        // Ноты четвёртой октавы с цветовой схемой (плавный переход от красного до фиолетового)
        this.notes = [
          { name: 'До',    nameEn: 'C',  file: 'audio/C4.mp3',  colors: { bg: '#6C1A1A, #4C1111', button: '#6C1A1A, #4C1111' } }, // насыщенный бордо, благородный
          { name: 'До#',   nameEn: 'C#', file: 'audio/Db4.mp3', colors: { bg: '#8C2323, #5C1919', button: '#8C2323, #5C1919' } }, // бархатно-красный
          { name: 'Ре',    nameEn: 'D',  file: 'audio/D4.mp3',  colors: { bg: '#A43A2A, #78322A', button: '#A43A2A, #78322A' } }, // бархатно-терракотовый
          { name: 'Ре#',   nameEn: 'D#', file: 'audio/Eb4.mp3', colors: { bg: '#924747, #663636', button: '#924747, #663636' } }, // винно-карамельный
          { name: 'Ми',    nameEn: 'E',  file: 'audio/E4.mp3',  colors: { bg: '#755454, #584041', button: '#755454, #584041' } }, // шоколадно-винный
          { name: 'Фа',    nameEn: 'F',  file: 'audio/F4.mp3',  colors: { bg: '#3F2A4C, #30203A', button: '#3F2A4C, #30203A' } }, // винный с фиолетовым
          { name: 'Фа#',   nameEn: 'F#', file: 'audio/Gb4.mp3', colors: { bg: '#3F2347, #291B36', button: '#3F2347, #291B36' } }, // баклажановый
          { name: 'Соль',  nameEn: 'G',  file: 'audio/G4.mp3',  colors: { bg: '#352150, #271942', button: '#352150, #271942' } }, // насыщенно-фиолетовый, спокойный
          { name: 'Соль#', nameEn: 'G#', file: 'audio/Ab4.mp3', colors: { bg: '#462764, #2E2046', button: '#462764, #2E2046' } }, // глубокий сине-фиолетовый
          { name: 'Ля',    nameEn: 'A',  file: 'audio/A4.mp3',  colors: { bg: '#593684, #3C2559', button: '#593684, #3C2559' } }, // тёмный благородный фиолетовый
          { name: 'Ля#',   nameEn: 'A#', file: 'audio/Bb4.mp3', colors: { bg: '#7227AC, #452664', button: '#7227AC, #452664' } }, // аметистовый
          { name: 'Си',    nameEn: 'B',  file: 'audio/B4.mp3',  colors: { bg: '#921CAB, #56196E', button: '#921CAB, #56196E' } }  // тёмный лилово-фиолетовый, роскошь
        ];


        // Дополнительные ноты для корректной работы интервалов
        this.extraNotes = {
            // Ноты третьей октавы (ниже)
            //'C3': { name: 'До', nameEn: 'C3', file: 'audio/C3.mp3' },
            'Bb3': { name: 'Си♭', nameEn: 'Bb3', file: 'audio/Bb3.mp3' },
            'B3': { name: 'Си', nameEn: 'B3', file: 'audio/B3.mp3' },
            // Ноты пятой октавы (выше)
            'C5': { name: 'До', nameEn: 'C5', file: 'audio/C5.mp3' },
            'Db5': { name: 'До#', nameEn: 'Db5', file: 'audio/Db5.mp3' }
        };

        // Текущая нота (остается неизменной до нажатия "Следующая нота")
        this.currentNote = null;
        this.currentNoteIndex = 0;
        
        // Текущий воспроизводящийся аудио объект
        this.currentAudio = null;
        
        // DOM элементы
        this.playButton = document.getElementById('play-button');
        this.nextButton = document.getElementById('next-button');
        this.currentNoteText = document.getElementById('current-note-text');
        
        // Навигационные кнопки
        this.toneDownButton = document.getElementById('tone-down-button');
        this.semitoneDownButton = document.getElementById('semitone-down-button');
        this.semitoneUpButton = document.getElementById('semitone-up-button');
        this.toneUpButton = document.getElementById('tone-up-button');
        
        // Аудио объекты для предзагрузки
        this.audioObjects = {};
        
        this.init();
    }

    async init() {
        // Предзагрузка всех аудиофайлов
        await this.preloadAudio();
        
        // Установка начальной случайной ноты
        this.selectRandomNote();
        
        // Обработчики событий
        this.playButton.addEventListener('click', () => this.playCurrentNote());
        this.nextButton.addEventListener('click', () => this.selectRandomNote());
        
        // Обработчики для навигационных кнопок (воспроизводят относительные ноты)
        this.toneDownButton.addEventListener('click', () => this.playRelativeNote(-2));
        this.semitoneDownButton.addEventListener('click', () => this.playRelativeNote(-1));
        this.semitoneUpButton.addEventListener('click', () => this.playRelativeNote(1));
        this.toneUpButton.addEventListener('click', () => this.playRelativeNote(2));
        
        // Поддержка клавиатуры
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'Space':
                    event.preventDefault();
                    this.playCurrentNote();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.selectRandomNote();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.playRelativeNote(-1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.playRelativeNote(1);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    this.playRelativeNote(-2);
                    break;
                case 'KeyQ':
                    event.preventDefault();
                    this.playRelativeNote(-2);
                    break;
                case 'KeyE':
                    event.preventDefault();
                    this.playRelativeNote(2);
                    break;
            }
        });

        console.log('Piano App initialized with new logic!');
    }

    async preloadAudio() {
        console.log('Предзагрузка аудиофайлов...');
        
        // Объединяем основные ноты и дополнительные
        const allNotes = [...this.notes, ...Object.values(this.extraNotes)];
        
        const loadPromises = allNotes.map(note => {
            return new Promise((resolve) => {
                const audio = new Audio();
                audio.preload = 'auto';
                audio.volume = 0.8;
                
                audio.addEventListener('canplaythrough', () => {
                    this.audioObjects[note.nameEn] = audio;
                    console.log(`Загружен: ${note.name} (${note.nameEn})`);
                    resolve();
                });
                
                audio.addEventListener('error', (e) => {
                    console.error(`Ошибка загрузки ${note.name}:`, e);
                    this.audioObjects[note.nameEn] = null;
                    resolve();
                });
                
                audio.src = note.file;
            });
        });
        
        await Promise.all(loadPromises);
        console.log('Все аудиофайлы загружены!');
    }

    // Выбор новой случайной ноты (единственный способ изменить currentNote)
    selectRandomNote() {
        // Остановка текущего воспроизведения
        this.stopCurrentAudio();
        
        // Генерация нового случайного индекса (отличного от текущего)
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.notes.length);
        } while (newIndex === this.currentNoteIndex && this.notes.length > 1);
        
        this.currentNoteIndex = newIndex;
        this.currentNote = this.notes[this.currentNoteIndex];
        
        // Обновление названия кнопки
        this.updateCurrentNoteButton();
        
        console.log(`Выбрана новая текущая нота: ${this.currentNote.name} (${this.currentNote.nameEn})`);
    }

    // Обновление названия главной кнопки и цветовой схемы
    updateCurrentNoteButton() {
        if (this.currentNote) {
            this.currentNoteText.textContent = `♪ ${this.currentNote.name} ♪`;
            this.updateColorScheme();
        }
    }

    // Обновление цветовой схемы в зависимости от текущей ноты
    updateColorScheme() {
        if (!this.currentNote || !this.currentNote.colors) return;

        const colors = this.currentNote.colors;
        
        // Обновление градиента фона
        document.body.style.background = `linear-gradient(135deg, ${colors.bg})`;
        
        // Обновление цвета кнопки "Другая нота"
        const nextButton = document.getElementById('next-button');
        if (nextButton) {
            nextButton.style.background = `linear-gradient(135deg, ${colors.button})`;
            
            // Обновление цвета тени для соответствия
            const shadowColor = colors.button.split(',')[0].replace('#', '').replace(' ', '');
            const r = parseInt(shadowColor.substr(0, 2), 16);
            const g = parseInt(shadowColor.substr(2, 2), 16);
            const b = parseInt(shadowColor.substr(4, 2), 16);
            nextButton.style.boxShadow = `0 8px 25px rgba(${r}, ${g}, ${b}, 0.4)`;
        }
        
        console.log(`Цветовая схема обновлена для ноты: ${this.currentNote.name}`);
    }

    // Воспроизведение текущей ноты
    async playCurrentNote() {
        if (!this.currentNote) return;
        await this.playNote(this.currentNote);
    }

    // Воспроизведение ноты относительно текущей (не меняет currentNote)
    async playRelativeNote(offset) {
        if (!this.currentNote) return;
        
        const relativeNote = this.getNoteByOffset(offset);
        if (!relativeNote) {
            console.warn(`Не удалось найти ноту с отступом ${offset}`);
            return;
        }
        
        console.log(`Воспроизведение относительной ноты: ${relativeNote.name} (${relativeNote.nameEn}) [${offset > 0 ? '+' : ''}${offset}]`);
        await this.playNote(relativeNote);
    }

    // Универсальный метод воспроизведения ноты
    async playNote(note) {
        // Остановка предыдущего аудио
        this.stopCurrentAudio();
        
        try {
            const audio = this.audioObjects[note.nameEn];
            
            if (audio) {
                // Сброс позиции
                audio.currentTime = 0;
                
                // Сохранение ссылки на текущее аудио
                this.currentAudio = audio;
                
                // Воспроизведение
                await audio.play();
                
                console.log(`Воспроизводится: ${note.name} (${note.nameEn})`);
            } else {
                console.warn(`Аудио для ноты ${note.name} не доступно`);
            }
            
        } catch (error) {
            console.error('Ошибка воспроизведения:', error);
        }
    }

    // Остановка текущего воспроизведения
    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    // Метод для получения информации о текущей ноте
    getCurrentNoteInfo() {
        return this.currentNote ? {
            name: this.currentNote.name,
            nameEn: this.currentNote.nameEn,
            file: this.currentNote.file,
            index: this.currentNoteIndex
        } : null;
    }

    // Метод для получения ноты по смещению с учётом октав
    getNoteByOffset(offset) {
        if (!this.currentNote) return null;
        
        // Особые случаи для граничных нот
        const currentNoteEn = this.currentNote.nameEn;
        
        // Если текущая нота - До (C) и нужно идти вниз
        if (currentNoteEn === 'C' && offset < 0) {
            if (offset === -1) return this.extraNotes['B3'];  // -0.5 = Си 3-й октавы
            if (offset === -2) return this.extraNotes['Bb3']; // -1 = Си♭ 3-й октавы
        }
        
        // Если текущая нота - До# (C#) и нужно идти сильно вниз  
        if (currentNoteEn === 'C#' && offset === -2) {
            return this.extraNotes['B3']; // -1 = Си 3-й октавы
        }
        
        // Если текущая нота - Ре (D) и нужно идти сильно вниз
        //if (currentNoteEn === 'D' && offset === -2) {
        //    return this.extraNotes['C4']; // -1 = До 3-й октавы (правильный звук!)
        //}
        
        // Если текущая нота - Си (B) и нужно идти вверх
        if (currentNoteEn === 'B' && offset > 0) {
            if (offset === 1) return this.extraNotes['C5'];   // +0.5 = До 5-й октавы
            if (offset === 2) return this.extraNotes['Db5'];  // +1 = До# 5-й октавы
        }
        
        // Если текущая нота - Си бемоль (A#), и нужен +2 (тон вверх), возвращаем До 5 октавы
        if (currentNoteEn === 'A#' && offset === 2) {
            return this.extraNotes['C5'];
        }
        
        // Обычная логика для остальных случаев
        const targetIndex = (this.currentNoteIndex + offset + this.notes.length) % this.notes.length;
        return this.notes[targetIndex];
    }
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.pianoApp = new PianoApp();
});

// Информация для разработчика
console.log('🎹 Тон-полутон - Обновленная версия');
console.log('Новая логика:');
console.log('  • Текущая нота фиксируется только при нажатии "Следующая нота"');
console.log('  • Кнопки "-1", "-0.5", "+0.5", "+1" воспроизводят относительные ноты');
console.log('  • Главная кнопка показывает название текущей ноты');
console.log('  • Воспроизведение можно прерывать новыми нажатиями');
console.log('Управление:');
console.log('  • Белая кнопка или пробел - воспроизвести текущую ноту');
console.log('  • "Следующая нота" или стрелка вправо - выбрать новую случайную ноту');
console.log('  • "-1" - воспроизвести ноту на тон ниже');
console.log('  • "-0.5" или стрелка влево - воспроизвести ноту на полутон ниже');
console.log('  • "+0.5" или стрелка вверх - воспроизвести ноту на полутон выше');
console.log('  • "+1" - воспроизвести ноту на тон выше');
