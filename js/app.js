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
  const name=document.getElementById("regStudentName").value;
  const courseId=document.getElementById("regCourseSelect").value;
  const paid=document.getElementById("regStudentPaid").value;
  if(!name||!courseId) return alert("Enter student name and select course");

  await fetchWithAuth(API+"/students",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name,course:courseId,feePaid:Number(paid)||0})
  });
  document.getElementById("regStudentName").value="";
  document.getElementById("regStudentPaid").value="";
  alert("Student registered successfully!");
};

// -------- LOAD COURSES DROPDOWN --------
async function loadCoursesDropdownRegister(){
  const courses=await fetchWithAuth(API+"/courses").then(r=>r.json());
  const sel=document.getElementById("regCourseSelect");
  sel.innerHTML="<option value=''>Select Course</option>";
  courses.forEach(c=>sel.innerHTML+=`<option value="${c._id}">${c.name}</option>`);
}

// -------- STUDENTS CRUD --------
async function loadStudentsByCourse(){
  const courses=await fetchWithAuth(API+"/courses").then(r=>r.json());
  const students=await fetchWithAuth(API+"/students").then(r=>r.json());
  let html="";
  courses.forEach(c=>{
    html+=`<h3>${c.name} (Fee: ${c.fee})</h3>`;
    html+="<table><tr><th>Student Name</th><th>Paid</th><th>Actions</th></tr>";
    students.filter(s=>s.course?._id===c._id).forEach(s=>{
      html+=`<tr>
        <td>${s.name}</td>
        <td>${s.feePaid}</td>
        <td>
          <button class="edit" onclick="editStudent('${s._id}','${s.name}',${s.feePaid},'${s.course._id}')">Edit</button>
          <button class="delete" onclick="deleteStudent('${s._id}')">Delete</button>
        </td>
      </tr>`;
    });
    html+="</table>";
  });
  document.getElementById("studentList").innerHTML=html;
}

function editStudent(id,name,feePaid,courseId){
  const newName=prompt("Student Name:",name);
  const newFee=prompt("Fee Paid:",feePaid);
  if(!newName||!newFee) return;
  fetchWithAuth(`${API}/students/${id}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:newName,feePaid:Number(newFee),course:courseId})
  }).then(()=>loadStudentsByCourse());
}

async function deleteStudent(id){
  if(!confirm("Are you sure to delete this student?")) return;
  await fetchWithAuth(`${API}/students/${id}`,{method:"DELETE"});
  loadStudentsByCourse();
}

// -------- INITIAL LOAD --------
loadData();
