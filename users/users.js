const API_BASE_URL = "http://localhost:8000/users";

// 메시지 표시 함수
function showMessage(message) {
    alert(message);
}

// 사용자 정보 가져오기
async function fetchUserInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch user information");

        const user = await response.json();
        document.getElementById("user-email").textContent = user.email;
        document.getElementById("user-nickname").textContent = user.nickname;
        document.getElementById("user-started-at").textContent = user.startedAt
            ? new Date(user.startedAt).toLocaleDateString()
            : "Not set";
        document.getElementById("user-created-at").textContent = new Date(user.createdAt).toLocaleDateString();

        // Populate edit form with current user info
        document.getElementById("edit-email").value = user.email;
        document.getElementById("edit-nickname").value = user.nickname;
        document.getElementById("edit-started-at").value = user.startedAt
            ? new Date(user.startedAt).toISOString().split("T")[0]
            : "";
    } catch (error) {
        showMessage(error.message);
    }
}

// 사용자 정보 수정 섹션 표시
document.getElementById("edit-user-button").addEventListener("click", () => {
    document.getElementById("user-info-section").style.display = "none";
    document.getElementById("edit-user-section").style.display = "block";
});

// 사용자 정보 수정 취소
document.getElementById("cancel-edit-button").addEventListener("click", () => {
    document.getElementById("edit-user-section").style.display = "none";
    document.getElementById("user-info-section").style.display = "block";
});

// 사용자 정보 수정
document.getElementById("edit-user-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("edit-email").value.trim();
    const nickname = document.getElementById("edit-nickname").value.trim();
    const startedAt = document.getElementById("edit-started-at").value;

    try {
        const response = await fetch(`${API_BASE_URL}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, nickname, startedAt }),
        });

        if (!response.ok) throw new Error("Failed to update user information");

        showMessage("User information updated successfully!");
        fetchUserInfo();
        document.getElementById("edit-user-section").style.display = "none";
        document.getElementById("user-info-section").style.display = "block";
    } catch (error) {
        showMessage(error.message);
    }
});

// 사용자 게시글 목록 가져오기
async function fetchUserPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch user posts");

        const posts = await response.json();
        const postsList = document.getElementById("user-posts-list");
        postsList.innerHTML = "";

        posts.forEach(post => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>${post.title}</strong> - ${new Date(post.createdAt).toLocaleDateString()}
                <p>Likes: ${post.likenum}, Comments: ${post.commentnum}</p>
            `;
            postsList.appendChild(listItem);
        });
    } catch (error) {
        showMessage(error.message);
    }
}

// 사용자 댓글 목록 가져오기
async function fetchUserComments() {
    try {
        const response = await fetch(`${API_BASE_URL}/comments`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch user comments");

        const comments = await response.json();
        const commentsList = document.getElementById("user-comments-list");
        commentsList.innerHTML = "";

        comments.forEach(comment => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <p>${comment.content}</p>
                <p>Post: ${comment.post?.title || "Unknown"} | Created: ${new Date(comment.createdAt).toLocaleDateString()}</p>
            `;
            commentsList.appendChild(listItem);
        });
    } catch (error) {
        showMessage(error.message);
    }
}

// 사용자 등록한 흡연 스팟 목록 가져오기
async function fetchUserSpots() {
    try {
        const response = await fetch(`${API_BASE_URL}/spots`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch user spots");

        const spots = await response.json();
        const spotsList = document.getElementById("user-spots-list");
        spotsList.innerHTML = "";

        spots.forEach(spot => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>${spot.name}</strong> - ${new Date(spot.createdAt).toLocaleDateString()}
                <p>${spot.description}</p>
                <p>Address: ${spot.roadAddress}</p>
            `;
            spotsList.appendChild(listItem);
        });
    } catch (error) {
        showMessage(error.message);
    }
}

// 사용자 작성한 스팟 댓글 목록 가져오기
async function fetchUserSpotComments() {
    try {
        const response = await fetch(`${API_BASE_URL}/spotcomments`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch user spot comments");

        const spotComments = await response.json();
        const spotCommentsList = document.getElementById("user-spot-comments-list");
        spotCommentsList.innerHTML = "";

        spotComments.forEach(comment => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <p>${comment.content}</p>
                <p>Spot: ${comment.spot?.name || "Unknown"} | Rate: ${comment.rate}</p>
                <p>Created: ${new Date(comment.createdAt).toLocaleDateString()}</p>
            `;
            spotCommentsList.appendChild(listItem);
        });
    } catch (error) {
        showMessage(error.message);
    }
}

// 초기 데이터 로드
document.addEventListener("DOMContentLoaded", () => {
    fetchUserInfo();
    fetchUserPosts();
    fetchUserComments();
    fetchUserSpots();
    fetchUserSpotComments();
});


