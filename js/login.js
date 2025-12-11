const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.innerText = "";

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:5000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.innerText = data.message || "Login failed";
      return;
    }

    // Save token in localStorage
    localStorage.setItem("adminToken", data.token);

    // Redirect to dashboard
    window.location.href = "index.html"; // your main admin page
  } catch (err) {
    errorMsg.innerText = "Server error. Try again.";
  }
});
