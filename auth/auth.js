const API_BASE_URL = "http://localhost:8000/auth";

// 메시지 표시 함수
function showMessage(message) {
    const messageSection = document.getElementById("message-section");
    const messageParagraph = document.getElementById("message");
    messageParagraph.textContent = message;
    messageSection.style.display = "block";
}

// 회원가입
document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("register-email").value;
    const nickname = document.getElementById("register-nickname").value;
    const password = document.getElementById("register-password").value;

    // 비밀번호 정책 검증
    const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordPolicy.test(password)) {
        showMessage("Password must be at least 10 characters long and include letters, numbers, and symbols.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, nickname, password }),
        });

        if (response.ok) {
            showMessage("Registration successful! You can now log in.");
        } else {
            const error = await response.json();
            showMessage(`Registration failed: ${error.message}`);
        }
    } catch (error) {
        showMessage(`An error occurred: ${error.message}`);
    }
});

// 로그인
document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            showMessage("Login successful!");
            document.getElementById("login-section").style.display = "none";
            document.getElementById("logout-section").style.display = "block";
        } else {
            const error = await response.json();
            showMessage(`Login failed: ${error.message}`);
        }
    } catch (error) {
        showMessage(`An error occurred: ${error.message}`);
    }
});

// 로그아웃
document.getElementById("logout-button").addEventListener("click", () => {
    document.cookie = "access_token=; Max-Age=0; path=/;";
    showMessage("Logout successful!");
    document.getElementById("logout-section").style.display = "none";
    document.getElementById("login-section").style.display = "block";
});
