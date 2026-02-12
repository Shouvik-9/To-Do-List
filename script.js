const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
let editingTask = null;
let isEditing = false;

inputBox.addEventListener("keydown", function(e){
    if(e.key === "Enter"){
        addTask();
    }
});


function addTask(){

    if(inputBox.value.trim() === ''){
        alert("Oops! Please type a task first.");
        return;
    }

    // If in edit mode
    if(isEditing && editingTask){
        editingTask.firstChild.textContent = inputBox.value;

        editingTask = null;
        isEditing = false;

        document.querySelector("button").innerText = "Add";
        inputBox.value = "";
        saveData();
        return;
    }

    // Normal Add
    let li = document.createElement("li");
    li.textContent = inputBox.value;

    let editBtn = document.createElement("img");
    editBtn.src = "images/edit.png";
    editBtn.className = "edit-btn";
    li.appendChild(editBtn);

    let span = document.createElement("span");
    span.innerHTML = "\u00d7";
    li.appendChild(span);

    listContainer.appendChild(li);

    inputBox.value = "";
    saveData();
}

listContainer.addEventListener("click", function(e){

    // Mark as completed
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        saveData();
    }

    // Delete
    else if(e.target.tagName === "SPAN"){
        e.target.parentElement.remove();
        saveData();
    }

    // Edit
    else if(e.target.classList.contains("edit-btn")){

    // If clicking same task again → cancel edit
    if(editingTask === e.target.parentElement){
        editingTask = null;
        isEditing = false;
        inputBox.value = "";
        document.querySelector("button").innerText = "Add";
        return;
    }

    editingTask = e.target.parentElement;
    isEditing = true;

    inputBox.value = editingTask.firstChild.textContent;
    document.querySelector("button").innerText = "Update";
}

}, false);


function saveData(){
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask(){
    listContainer.innerHTML = localStorage.getItem("data");
}
showTask();

const themeToggle = document.getElementById("theme-toggle");

// Load saved theme
if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark");
    themeToggle.src = "images/lightmode.png";
}

// Toggle Theme
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){
        themeToggle.src = "images/lightmode.png";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.src = "images/darkmode.jpg";
        localStorage.setItem("theme", "light");
    }
});
