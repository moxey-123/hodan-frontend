const API = "https://hodan12.onrender.com"; // ✅ Deployed backend

// -------- PAGE SWITCHING --------
document.querySelectorAll(".sidebar a").forEach(a => {
  a.onclick = function() {
    document.querySelectorAll(".sidebar a").forEach(b => b.classList.remove("active"));
    a.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById(a.dataset.page).style.display = "block";

    if(a.dataset.page === "students") loadStudentsByCourse();
    else if(a.dataset.page === "register") loadCoursesDropdownRegister();
    else loadData();
  };
});

// -------- CHECK LOGIN & LOGOUT --------
const token = localStorage.getItem("adminToken");
if (!token) window.location.href = "login.html";

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
};

// -------- DASHBOARD & COURSES --------
async function fetchWithAuth(url, options={}) {
  options.headers = {
    ...(options.headers || {}),
    "Authorization": `Bearer ${token}`
  };
  return fetch(url, options);
}

async function loadData() {
  const courses = await fetchWithAuth(API + "/courses").then(r=>r.json());
  const students = await fetchWithAuth(API + "/students").then(r=>r.json());

  document.getElementById("totalCourses").innerText = courses.length;
  document.getElementById("totalStudents").innerText = students.length;

  loadCourseList(courses);
  loadCoursesDropdownRegister();
}

// -------- COURSES CRUD --------
document.getElementById("addCourseBtn").onclick = async function() {
  const name = document.getElementById("courseName").value;
  const fee = document.getElementById("courseFee").value;
  if(!name||!fee) return alert("Enter course name and fee");

  await fetchWithAuth(API+"/courses",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name,fee:Number(fee)})
  });
  document.getElementById("courseName").value="";
  document.getElementById("courseFee").value="";
  loadData();
};

function loadCourseList(courses){
  let html="<table><tr><th>Name</th><th>Fee</th><th>Actions</th></tr>";
  courses.forEach(c=>{
    html+=`<tr>
      <td>${c.name}</td>
      <td>${c.fee}</td>
      <td>
        <button class="edit" onclick="editCourse('${c._id}','${c.name}',${c.fee})">Edit</button>
        <button class="delete" onclick="deleteCourse('${c._id}')">Delete</button>
      </td>
    </tr>`;
  });
  html+="</table>";
  document.getElementById("courseList").innerHTML=html;
}

function editCourse(id,name,fee){
  const newName = prompt("Course Name:", name);
  const newFee = prompt("Course Fee:", fee);
  if(!newName||!newFee) return;
  fetchWithAuth(`${API}/courses/${id}`, {
    method: "PUT",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({name:newName, fee:Number(newFee)})
  }).then(()=>loadData());
}

async function deleteCourse(id){
  if(!confirm("Are you sure?")) return;
  await fetchWithAuth(`${API}/courses/${id}`, { method: "DELETE" });
  loadData();
}

// -------- REGISTER STUDENT --------
document.getElementById("regStudentBtn").onclick=async function(){
  const firstName = document.getElementById("regFirstName").value;
  const lastName = document.getElementById("regLastName").value;
  const idNumber = document.getElementById("regIDNumber").value;
  const phone = document.getElementById("regPhone").value;
  const courseId = document.getElementById("regCourseSelect").value;
  const paid = document.getElementById("regStudentPaid").value;
  const day = document.getElementById("regDay").value;
  const month = document.getElementById("regMonth").value;
  const year = document.getElementById("regYear").value;

  if(!firstName || !lastName || !idNumber || !phone || !courseId || !day || !month || !year){
    return alert("Fill all fields to register a student");
  }

  await fetchWithAuth(API+"/students",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      firstName,
      lastName,
      idNumber,
      phone,
      course:courseId,
      feePaid:Number(paid)||0,
      regDate:{day:Number(day),month:Number(month),year:Number(year)}
    })
  });

  document.getElementById("regFirstName").value="";
  document.getElementById("regLastName").value="";
  document.getElementById("regIDNumber").value="";
  document.getElementById("regPhone").value="";
  document.getElementById("regStudentPaid").value="";
  document.getElementById("regDay").value="";
  document.getElementById("regMonth").value="";
  document.getElementById("regYear").value="";
  alert("Student registered successfully!");
  loadStudentsByCourse(); // refresh student list immediately
};

// -------- LOAD COURSES DROPDOWN --------
async function loadCoursesDropdownRegister(){
  const courses=await fetchWithAuth(API+"/courses").then(r=>r.json());
  const sel=document.getElementById("regCourseSelect");
  sel.innerHTML="<option value=''>Select Course</option>";
  courses.forEach(c=>sel.innerHTML+=`<option value="${c._id}">${c.name}</option>`);
}

// -------- STUDENTS CRUD & FILTER --------
async function loadStudentsByCourse(monthFilter="", yearFilter=""){
  const courses=await fetchWithAuth(API+"/courses").then(r=>r.json());
  const students=await fetchWithAuth(API+"/students").then(r=>r.json());
  let html="";

  courses.forEach(c=>{
    html+=`<h3>${c.name} (Fee: ${c.fee})</h3>`;
    html+="<table><tr><th>Student Name</th><th>ID</th><th>Phone</th><th>Paid</th><th>Date</th><th>Actions</th></tr>";

    students
      .filter(s=>s.course?._id===c._id)
      .filter(s=>{
        if(monthFilter && s.regDate.month!=monthFilter) return false;
        if(yearFilter && s.regDate.year!=yearFilter) return false;
        return true;
      })
      .forEach(s=>{
      html+=`<tr>
        <td>${s.firstName} ${s.lastName}</td>
        <td>${s.idNumber}</td>
        <td>${s.phone}</td>
        <td>${s.feePaid}</td>
        <td>${s.regDate.day}/${s.regDate.month}/${s.regDate.year}</td>
        <td>
          <button class="edit" onclick="editStudent('${s._id}','${s.firstName}','${s.lastName}','${s.idNumber}','${s.phone}',${s.feePaid},'${s.course._id}','${s.regDate.day}','${s.regDate.month}','${s.regDate.year}')">Edit</button>
          <button class="delete" onclick="deleteStudent('${s._id}')">Delete</button>
        </td>
      </tr>`;
    });

    html+="</table>";
  });

  document.getElementById("studentList").innerHTML=html;
}

// Edit & Delete Students
function editStudent(id, firstName, lastName, idNumber, phone, feePaid, courseId, day, month, year){
  const newFirstName = prompt("First Name:", firstName);
  const newLastName = prompt("Last Name:", lastName);
  const newID = prompt("ID Number:", idNumber);
  const newPhone = prompt("Phone:", phone);
  const newFee = prompt("Fee Paid:", feePaid);
  const newDay = prompt("Day:", day);
  const newMonth = prompt("Month (1-12):", month);
  const newYear = prompt("Year:", year);
  if(!newFirstName || !newLastName || !newID || !newPhone || !newDay || !newMonth || !newYear) return;

  fetchWithAuth(`${API}/students/${id}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      firstName:newFirstName,
      lastName:newLastName,
      idNumber:newID,
      phone:newPhone,
      feePaid:Number(newFee),
      course:courseId,
      regDate:{day:Number(newDay), month:Number(newMonth), year:Number(newYear)}
    })
  }).then(()=>loadStudentsByCourse());
}

async function deleteStudent(id){
  if(!confirm("Are you sure to delete this student?")) return;
  await fetchWithAuth(`${API}/students/${id}`,{method:"DELETE"});
  loadStudentsByCourse();
}

// -------- FILTER HANDLERS --------
document.getElementById("applyFilterBtn").onclick = () => {
  const month = document.getElementById("filterMonth").value;
  const year = document.getElementById("filterYear").value;
  loadStudentsByCourse(month, year);
};

document.getElementById("clearFilterBtn").onclick = () => {
  document.getElementById("filterMonth").value="";
  document.getElementById("filterYear").value="";
  loadStudentsByCourse();
};

// -------- INITIAL LOAD --------
loadData();
