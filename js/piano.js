class PianoApp {
    constructor() {
        // 12 хроматических позиций (C=0 ... B=11)
        // Для диезов используются файлы с бемолями (C# → Db и т.д.)
        this.CHROMATIC_NOTES = [
            { name: 'До',    file: 'C',  colors: { bg: '#6C1A1A, #4C1111', button: '#6C1A1A, #4C1111' } },
            { name: 'До#',   file: 'Db', colors: { bg: '#8C2323, #5C1919', button: '#8C2323, #5C1919' } },
            { name: 'Ре',    file: 'D',  colors: { bg: '#A43A2A, #78322A', button: '#A43A2A, #78322A' } },
            { name: 'Ре#',   file: 'Eb', colors: { bg: '#924747, #663636', button: '#924747, #663636' } },
            { name: 'Ми',    file: 'E',  colors: { bg: '#755454, #584041', button: '#755454, #584041' } },
            { name: 'Фа',    file: 'F',  colors: { bg: '#3F2A4C, #30203A', button: '#3F2A4C, #30203A' } },
            { name: 'Фа#',   file: 'Gb', colors: { bg: '#3F2347, #291B36', button: '#3F2347, #291B36' } },
            { name: 'Соль',  file: 'G',  colors: { bg: '#352150, #271942', button: '#352150, #271942' } },
            { name: 'Соль#', file: 'Ab', colors: { bg: '#462764, #2E2046', button: '#462764, #2E2046' } },
            { name: 'Ля',    file: 'A',  colors: { bg: '#593684, #3C2559', button: '#593684, #3C2559' } },
            { name: 'Ля#',   file: 'Bb', colors: { bg: '#7227AC, #452664', button: '#7227AC, #452664' } },
            { name: 'Си',    file: 'B',  colors: { bg: '#921CAB, #56196E', button: '#921CAB, #56196E' } },
        ];

        // Диапазон доступных MP3-файлов: Db2 (MIDI 37) — G5 (MIDI 79)
        this.MIDI_MIN = 37;
        this.MIDI_MAX = 79;

        // Опорные ноты: C4–B4 (MIDI 60–71)
        this.REF_MIDI_MIN = 60;
        this.REF_MIDI_MAX = 71;

        this.MODES = {
            'semitone': {
                title:          'Тон-полутон',
                smallInterval:  1,
                largeInterval:  2,
                largeUpLabel:   '+Б.2',
                smallUpLabel:   '+М.2',
                smallDownLabel: '-М.2',
                largeDownLabel: '-Б.2',
            },
            'thirds': {
                title:          'Терции',
                smallInterval:  3,
                largeInterval:  4,
                largeUpLabel:   '+Б.3',
                smallUpLabel:   '+М.3',
                smallDownLabel: '-М.3',
                largeDownLabel: '-Б.3',
            },
            'fourths': {
                title:          'Кварта-квинта',
                smallInterval:  5,
                largeInterval:  7,
                largeUpLabel:   '+Ч.5',
                smallUpLabel:   '+Ч.4',
                smallDownLabel: '-Ч.4',
                largeDownLabel: '-Ч.5',
            },
        };

        this.currentMode  = 'semitone';
        this.currentMidi  = null;
        this.currentAudio = null;
        this.audioObjects = {};

        this.playButton         = document.getElementById('play-button');
        this.nextButton         = document.getElementById('next-button');
        this.currentNoteText    = document.getElementById('current-note-text');
        this.titleEl            = document.getElementById('app-title');
        this.toneUpButton       = document.getElementById('tone-up-button');
        this.semitoneUpButton   = document.getElementById('semitone-up-button');
        this.semitoneDownButton = document.getElementById('semitone-down-button');
        this.toneDownButton     = document.getElementById('tone-down-button');

        this.init();
    }

    // MIDI-номер → информация о ноте (null если вне диапазона)
    getNoteInfo(midi) {
        if (midi < this.MIDI_MIN || midi > this.MIDI_MAX) return null;
        const position = midi % 12;
        const octave   = Math.floor(midi / 12) - 1;
        const note     = this.CHROMATIC_NOTES[position];
        return {
            name:   note.name,
            key:    `${note.file}${octave}`,
            file:   `audio/${note.file}${octave}.mp3`,
            colors: note.colors,
            midi,
        };
    }

    async init() {
        await this.preloadAudio();
        this.selectRandomNote();
        this.updateModeUI();

        this.playButton.addEventListener('click',         () => this.playCurrentNote());
        this.nextButton.addEventListener('click',         () => this.selectRandomNote());
        this.toneUpButton.addEventListener('click',       () => this.playInterval(true,  true));
        this.semitoneUpButton.addEventListener('click',   () => this.playInterval(true,  false));
        this.semitoneDownButton.addEventListener('click', () => this.playInterval(false, false));
        this.toneDownButton.addEventListener('click',     () => this.playInterval(false, true));

        document.getElementById('mode-btn-semitone').addEventListener('click', () => this.switchMode('semitone'));
        document.getElementById('mode-btn-thirds').addEventListener('click',   () => this.switchMode('thirds'));
        document.getElementById('mode-btn-fourths').addEventListener('click',  () => this.switchMode('fourths'));

        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Space':      e.preventDefault(); this.playCurrentNote();        break;
                case 'ArrowRight': e.preventDefault(); this.selectRandomNote();       break;
                case 'ArrowLeft':  e.preventDefault(); this.playInterval(false, false); break;
                case 'ArrowUp':    e.preventDefault(); this.playInterval(true,  false); break;
                case 'ArrowDown':  e.preventDefault(); this.playInterval(false, true);  break;
                case 'KeyQ':       e.preventDefault(); this.playInterval(false, true);  break;
                case 'KeyE':       e.preventDefault(); this.playInterval(true,  true);  break;
            }
        });
    }

    async preloadAudio() {
        const promises = [];
        for (let midi = this.MIDI_MIN; midi <= this.MIDI_MAX; midi++) {
            const info = this.getNoteInfo(midi);
            if (!info) continue;
            promises.push(new Promise((resolve) => {
                const audio = new Audio();
                audio.preload = 'auto';
                audio.volume  = 0.8;
                audio.addEventListener('canplaythrough', () => {
                    this.audioObjects[info.key] = audio;
                    resolve();
                }, { once: true });
                audio.addEventListener('error', () => {
                    console.warn(`Не загружен: ${info.file}`);
                    this.audioObjects[info.key] = null;
                    resolve();
                }, { once: true });
                audio.src = info.file;
            }));
        }
        await Promise.all(promises);
    }

    selectRandomNote() {
        this.stopCurrentAudio();
        let newMidi;
        do {
            newMidi = this.REF_MIDI_MIN + Math.floor(Math.random() * 12);
        } while (newMidi === this.currentMidi);
        this.currentMidi = newMidi;
        const info = this.getNoteInfo(this.currentMidi);
        if (info) {
            this.currentNoteText.textContent = `♪ ${info.name} ♪`;
            this.updateColorScheme(info.colors);
        }
    }

    updateColorScheme(colors) {
        document.body.style.background = `linear-gradient(135deg, ${colors.bg})`;
        const nextBtn = document.getElementById('next-button');
        if (nextBtn) {
            nextBtn.style.background = `linear-gradient(135deg, ${colors.button})`;
            const hex = colors.button.split(',')[0].replace('#', '').trim();
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            nextBtn.style.boxShadow = `0 8px 25px rgba(${r}, ${g}, ${b}, 0.4)`;
        }
    }

    playCurrentNote() {
        if (this.currentMidi === null) return;
        const info = this.getNoteInfo(this.currentMidi);
        if (info) this.playNote(info);
    }

    playInterval(up, large) {
        if (this.currentMidi === null) return;
        const mode      = this.MODES[this.currentMode];
        const semitones = large ? mode.largeInterval : mode.smallInterval;
        const targetMidi = this.currentMidi + (up ? semitones : -semitones);
        const info = this.getNoteInfo(targetMidi);
        if (info) {
            this.playNote(info);
        } else {
            console.warn(`Нота вне диапазона: MIDI ${targetMidi}`);
        }
    }

    async playNote(info) {
        this.stopCurrentAudio();
        const audio = this.audioObjects[info.key];
        if (audio) {
            audio.currentTime = 0;
            this.currentAudio = audio;
            try { await audio.play(); } catch (e) { console.error('Ошибка воспроизведения:', e); }
        }
    }

    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    switchMode(modeName) {
        this.currentMode = modeName;
        this.updateModeUI();
    }

    updateModeUI() {
        const mode = this.MODES[this.currentMode];

        this.titleEl.textContent = `🎹 ${mode.title}`;

        this.toneUpButton.querySelector('.button-text').textContent       = mode.largeUpLabel;
        this.semitoneUpButton.querySelector('.button-text').textContent   = mode.smallUpLabel;
        this.semitoneDownButton.querySelector('.button-text').textContent = mode.smallDownLabel;
        this.toneDownButton.querySelector('.button-text').textContent     = mode.largeDownLabel;

        // Показываем только кнопки неактивных режимов
        Object.keys(this.MODES).forEach(key => {
            const btn = document.getElementById(`mode-btn-${key}`);
            if (btn) btn.style.display = key === this.currentMode ? 'none' : '';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pianoApp = new PianoApp();
});
