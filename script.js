const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const totalTasksDisplay = document.getElementById("total-tasks");
const completedTasksDisplay = document.getElementById("completed-tasks");
const themeToggle = document.getElementById("theme-toggle");
const filterButtons = document.querySelectorAll(".filter-btn");
const deleteAllBtn = document.getElementById("delete-all");
const undoBar = document.getElementById("undo-bar");
const undoBtn = document.getElementById("undo-btn");
const cancelBtn = document.getElementById("cancel-btn");
const progressFill = document.getElementById("progress-fill");
const progressPercent = document.getElementById("progress-percent");
const progressSection = document.getElementById("progress-section");

let lastDeletedIndex = null;
let lastDeletedTask = null;
let undoTimeout = null;
let currentFilter = "all";
let editingTask = null;
let isEditing = false;
let celebrationTriggered = false;

// DATE TIME FORMAT
function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function celebrateCompletion() {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

// PROGRESS BAR
function updateProgressBar() {
    const allTasks = listContainer.querySelectorAll("li");
    const total = allTasks.length;
    const completed = listContainer.querySelectorAll("li.checked").length;

    // Hide progress bar if no tasks
    if (total === 0) {
        progressSection.style.display = "none";
        celebrationTriggered = false;
        return;
    }

    //  Show progress bar if tasks exist
    progressSection.style.display = "block";
    let percent = Math.round((completed / total) * 100);
    progressFill.style.width = percent + "%";
    progressPercent.innerText = percent + "%";

    // COLOR ZONES
    if (percent <= 40) {
        // RED ZONE
        progressFill.style.background =
            "linear-gradient(90deg, #ff1744, #ff5252)";
    }
    else if (percent <= 80) {
        // ORANGE ZONE
        progressFill.style.background =
            "linear-gradient(90deg, #ff9800, #ffb74d)";
    }
    else {
        // GREEN ZONE
        progressFill.style.background =
            "linear-gradient(90deg, #00c853, #64dd17)";
    }

    // CELEBRATION AT 100%
    if (percent === 100) {
        if (!celebrationTriggered) {
            celebrateCompletion();
            celebrationTriggered = true;
        }
    } else {
        // Reset if progress drops below 100
        celebrationTriggered = false;
    }
}

// ENTER KEY SUPPORT
inputBox.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        addTask();
    }
});

// DELETE ALL
deleteAllBtn.addEventListener("click", () => {
    const totalTasks = listContainer.querySelectorAll("li").length;
    if (totalTasks === 0) {
        alert("No tasks to delete.");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete all tasks?");
    if (confirmDelete) {
        listContainer.innerHTML = "";
        editingTask = null;
        isEditing = false;
        inputBox.value = "";
        document.querySelector(".row button").innerText = "Add";
        saveData();
        updateTaskStats();
        applyFilter();
    }
});

// FILTER LOGIC
function applyFilter() {
    const tasks = listContainer.querySelectorAll("li");
    tasks.forEach(task => {
        switch (currentFilter) {
            case "all":
                task.style.display = "";
                break;
            case "active":
                task.style.display =
                    task.classList.contains("checked") ? "none" : "";
                break;
            case "completed":
                task.style.display =
                    task.classList.contains("checked") ? "" : "none";
                break;
        }
    });
}

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        currentFilter = button.getAttribute("data-filter");
        applyFilter();
    });
});

// ADD / UPDATE TASK
function addTask() {

    if (inputBox.value.trim() === '') {
        alert("Oops! Please type a task first.");
        return;
    }
    if (isEditing && editingTask) {
        editingTask.firstChild.textContent = inputBox.value;
        editingTask = null;
        isEditing = false;
        document.querySelector(".row button").innerText = "Add";
        inputBox.value = "";
        saveData();
        updateTaskStats();
        applyFilter();
        return;
    }

    let li = document.createElement("li");
    li.textContent = inputBox.value;

    const createdTime = getCurrentDateTime();
    li.setAttribute("data-created", createdTime);

    let editBtn = document.createElement("img");
    editBtn.src = "images/edit.png";
    editBtn.className = "edit-btn";
    li.appendChild(editBtn);

    let span = document.createElement("span");
    span.innerHTML = "\u00d7";
    li.appendChild(span);

    let timeInfo = document.createElement("small");
    timeInfo.className = "time-info";
    timeInfo.innerText = `Created: ${createdTime}`;
    li.appendChild(timeInfo);

    listContainer.appendChild(li);
    inputBox.value = "";
    saveData();
    updateTaskStats();
    applyFilter();
}

// CLICK EVENTS
listContainer.addEventListener("click", function (e) {

    // TOGGLE COMPLETE
    if (e.target.tagName === "LI") {

        e.target.classList.toggle("checked");

        const createdTime = e.target.getAttribute("data-created");
        let timeInfo = e.target.querySelector(".time-info");

        if (e.target.classList.contains("checked")) {
            const completedTime = getCurrentDateTime();
            e.target.setAttribute("data-completed", completedTime);
            timeInfo.innerText =
                `Created: ${createdTime} | Completed: ${completedTime}`;
        } else {
            e.target.removeAttribute("data-completed");
            timeInfo.innerText =
                `Created: ${createdTime}`;
        }
        saveData();
        updateTaskStats();
        applyFilter();
    }

    // DELETE
    else if (e.target.tagName === "SPAN") {
        const taskToDelete = e.target.parentElement;
        lastDeletedIndex =
            Array.from(listContainer.children).indexOf(taskToDelete);
        lastDeletedTask = taskToDelete.cloneNode(true);
        taskToDelete.remove();
        saveData();
        updateTaskStats();
        applyFilter();
        showUndoBar();
    }

    // EDIT
    else if (e.target.classList.contains("edit-btn")) {

        if (editingTask === e.target.parentElement) {
            editingTask = null;
            isEditing = false;
            inputBox.value = "";
            document.querySelector(".row button").innerText = "Add";
            return;
        }
        editingTask = e.target.parentElement;
        isEditing = true;
        inputBox.value = editingTask.firstChild.textContent;
        document.querySelector(".row button").innerText = "Update";
    }
}, false);

// UNDO LOGIC
function showUndoBar() {
    undoBar.style.display = "flex";
    clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
        hideUndoBar();
    }, 5000);
}

function hideUndoBar() {
    undoBar.style.display = "none";
    lastDeletedTask = null;
    lastDeletedIndex = null;
}

undoBtn.addEventListener("click", () => {
    if (lastDeletedTask !== null) {
        const tasks = listContainer.querySelectorAll("li");
        if (lastDeletedIndex >= tasks.length) {
            listContainer.appendChild(lastDeletedTask);
        } else {
            listContainer.insertBefore(
                lastDeletedTask,
                tasks[lastDeletedIndex]
            );
        }
        saveData();
        updateTaskStats();
        applyFilter();
    }
    hideUndoBar();
});

cancelBtn.addEventListener("click", () => {
    clearTimeout(undoTimeout);
    hideUndoBar();
});

// TASK COUNTER
function updateTaskStats() {
    const allTasks = listContainer.querySelectorAll("li");
    const total = allTasks.length;
    const completed =
        listContainer.querySelectorAll("li.checked").length;

    totalTasksDisplay.innerText = `Total Tasks: ${total}`;
    completedTasksDisplay.innerText =
        `${completed}/${total} Completed`;

    if (total >= 2) {
        deleteAllBtn.style.display = "block";
    } else {
        deleteAllBtn.style.display = "none";
    }
    updateProgressBar();
}

// LOCAL STORAGE
function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask() {
    listContainer.innerHTML =
        localStorage.getItem("data") || "";
    updateTaskStats();
    applyFilter();
}

showTask();

// DARK / LIGHT MODE
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.src = "images/lightmode.png";
} else {
    themeToggle.src = "images/darkmode.jpg";
}

themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeToggle.src = "images/lightmode.png";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.src = "images/darkmode.jpg";
        localStorage.setItem("theme", "light");
    }

});
