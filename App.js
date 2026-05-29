/**
 * HABIT CATALYST STATE ENGINE
 * Handles advanced calculations, dynamic tracking metrics, browser cache data, 
 * data persistence file pipelines, and responsive rendering matrices.
 */

class HabitTracker {
  constructor() {
    this.habits = JSON.parse(localStorage.getItem('habits')) || [];
  }

  addHabit(name, type, target = 1, unit = 'times') {
    const newHabit = {
      id: 'habit_' + Date.now(),
      name: name,
      type: type, 
      target: type === 'binary' ? 1 : Number(target),
      unit: type === 'binary' ? 'status' : unit,
      currentStreak: 0,
      history: {} 
    };
    this.habits.push(newHabit);
    this.save();
    return newHabit;
  }

  updateProgress(habitId, dateStr, incrementValue) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentProgress = habit.history[dateStr] || 0;

    if (habit.type === 'binary') {
      habit.history[dateStr] = currentProgress === 1 ? 0 : 1;
    } else {
      habit.history[dateStr] = Math.max(0, currentProgress + incrementValue);
    }

    this.recalculateStreak(habit);
    this.save();
  }

  isCompleted(habit, dateStr) {
    return (habit.history[dateStr] || 0) >= habit.target;
  }

  recalculateStreak(habit) {
    let streak = 0;
    let evaluationDate = new Date();

    while (true) {
      const dateStr = evaluationDate.toISOString().split('T')[0];
      
      if (this.isCompleted(habit, dateStr)) {
        streak++;
        evaluationDate.setDate(evaluationDate.getDate() - 1);
      } else {
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        if (isToday) {
          evaluationDate.setDate(evaluationDate.getDate() - 1);
          const yesterdayStr = evaluationDate.toISOString().split('T')[0];
          if (this.isCompleted(habit, yesterdayStr)) {
            continue;
          }
        }
        break;
      }
    }
    habit.currentStreak = streak;
  }

  save() {
    localStorage.setItem('habits', JSON.stringify(this.habits));
  }
}

// Global Core Engine Initialization
const tracker = new HabitTracker();
const todayString = new Date().toISOString().split('T')[0];

// DOM Targets Hooking
const habitsContainer = document.getElementById('habitsContainer');
const habitModal = document.getElementById('habitModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const habitForm = document.getElementById('habitForm');
const habitTypeSelect = document.getElementById('habitType');
const quantifiableFields = document.getElementById('quantifiableFields');

// Render Dashboard View Cards
function renderDashboard() {
  habitsContainer.innerHTML = '';

  if (tracker.habits.length === 0) {
    habitsContainer.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; margin-top: 2rem;">No habits tracked yet. Create one above!</p>`;
    return;
  }

  tracker.habits.forEach(habit => {
    const currentProgress = habit.history[todayString] || 0;
    const isDone = tracker.isCompleted(habit, todayString);

    const card = document.createElement('div');
    card.className = `habit-card ${isDone ? 'completed' : ''}`;

    if (habit.type === 'binary') {
      card.innerHTML = `
        <div class="habit-header">
          <span class="habit-name">${habit.name}</span>
          <span class="streak-badge">🔥 ${habit.currentStreak} days</span>
        </div>
        <div class="habit-control-box">
          <span>${isDone ? 'Completed' : 'Mark complete'}</span>
          <input type="checkbox" ${isDone ? 'checked' : ''} onclick="toggleHabit('${habit.id}')" style="transform: scale(1.3); accent-color: var(--success); cursor: pointer;">
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="habit-header">
          <span class="habit-name">${habit.name}</span>
          <span class="streak-badge">🔥 ${habit.currentStreak} days</span>
        </div>
        <div class="habit-control-box">
          <div>
            <strong style="font-size: 1.1rem;">${currentProgress}</strong> / ${habit.target} <span style="color: var(--text-muted); font-size: 0.9rem;">${habit.unit}</span>
          </div>
          <div class="counter-controls">
            <button class="btn-counter" onclick="changeVolume('${habit.id}', -1)">-</button>
            <button class="btn-counter" onclick="changeVolume('${habit.id}', 1)">+</button>
          </div>
        </div>
      `;
    }
    habitsContainer.appendChild(card);
  });
}

// Render Interactive 365-Day Heatmap
function renderHeatmap() {
  const heatmapGrid = document.getElementById('heatmapGrid');
  if (!heatmapGrid) return;
  
  heatmapGrid.innerHTML = '';
  const totalTrackedHabits = tracker.habits.length;
  const today = new Date();
  const dateArray = [];
  
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dateArray.push(d);
  }

  dateArray.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    let completionsCount = 0;

    tracker.habits.forEach(habit => {
      if (tracker.isCompleted(habit, dateStr)) {
        completionsCount++;
      }
    });

    let intensityLevel = 0;
    if (totalTrackedHabits > 0 && completionsCount > 0) {
      const ratio = completionsCount / totalTrackedHabits;
      if (ratio <= 0.34) intensityLevel = 1;
      else if (ratio <= 0.74) intensityLevel = 2;
      else intensityLevel = 3; 
    }

    const square = document.createElement('div');
    square.className = `heat-square level-${intensityLevel}`;
    
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    square.setAttribute('data-tooltip', `${formattedDate}: ${completionsCount}/${totalTrackedHabits} Completed`);

    heatmapGrid.appendChild(square);
  });
}

// Action Event Interactivity Bridge Routes
window.toggleHabit = (id) => {
  tracker.updateProgress(id, todayString, 1);
  renderDashboard();
  renderHeatmap();
};

window.changeVolume = (id, change) => {
  tracker.updateProgress(id, todayString, change);
  renderDashboard();
  renderHeatmap();
};

// Export Engine Data Download Pipeline
window.exportData = function() {
  const dataStr = localStorage.getItem('habits');
  if (!dataStr || dataStr === '[]') {
    alert("You don't have any data entries to export yet!");
    return;
  }
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `habit_catalyst_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
};

// Import Engine File Restructure Validation
window.importData = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsedData = JSON.parse(e.target.result);
      if (!Array.isArray(parsedData)) throw new Error("Invalid structure format.");

      const confirmOverwrite = confirm("Are you sure you want to import this file? This will overwrite your current active progress data.");
      if (confirmOverwrite) {
        localStorage.setItem('habits', JSON.stringify(parsedData));
        tracker.habits = parsedData;
        renderDashboard();
        renderHeatmap();
        alert("Data snapshot successfully restored! ✨");
      }
    } catch (error) {
      alert("Error reading file: Please check that this is a valid unedited backup file.");
    }
    event.target.value = '';
  };
  reader.readAsText(file);
};

// Modal Open/Close Controls Action Listeners
openModalBtn.addEventListener('click', () => habitModal.classList.add('active'));
closeModalBtn.addEventListener('click', () => habitModal.classList.remove('active'));
habitTypeSelect.addEventListener('change', (e) => {
  quantifiableFields.style.display = e.target.value === 'quantifiable' ? 'grid' : 'none';
});

// Structural New Habits Processing
habitForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('habitName').value;
  const type = habitTypeSelect.value;
  const target = document.getElementById('habitTarget').value;
  const unit = document.getElementById('habitUnit').value;

  tracker.addHabit(name, type, target, unit);
  habitForm.reset();
  quantifiableFields.style.display = 'none';
  habitModal.classList.remove('active');
  renderDashboard();
  renderHeatmap();
});

// App Window Paint Init Execution
renderDashboard();
renderHeatmap();