const API_BASE_URL = "http://localhost:8000/posts";

let currentPage = 1;
const pageSize = 10;

// Show "View Posts" tab
function showViewPosts() {
    document.getElementById("view-posts-section").style.display = "block";
    document.getElementById("create-post-section").style.display = "none";
    document.getElementById("post-detail-section").style.display = "none";
    fetchPosts();
}

// Show "Create Post" tab
function showCreatePost() {
    document.getElementById("view-posts-section").style.display = "none";
    document.getElementById("create-post-section").style.display = "block";
    document.getElementById("post-detail-section").style.display = "none";
}

// Attach tab switching event listeners
document.getElementById("view-posts-tab").addEventListener("click", showViewPosts);
document.getElementById("create-post-tab").addEventListener("click", showCreatePost);

// Fetch all posts
async function fetchPosts() {
    const keyword = document.getElementById("search-keyword").value;
    const searchType = document.getElementById("search-type").value;
    const sortField = document.getElementById("sort-field").value;
    const sortBy = document.getElementById("sort-by").value;

    const queryParams = new URLSearchParams();

    if (keyword) queryParams.append("keyword", keyword);
    if (searchType) queryParams.append("searchType", searchType);
    queryParams.append("page", currentPage);
    queryParams.append("limit", pageSize);
    queryParams.append("sortField", sortField);
    queryParams.append("sortBy", sortBy);

    try {
        const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`, {
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch posts");

        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        alert(error.message);
    }
}

// Create a new post
async function createPost() {
    const title = document.getElementById("post-title-input").value;
    const content = document.getElementById("post-content-input").value;
    const imagesInput = document.getElementById("post-images");
    const formData = new FormData();

    formData.append("title", title);
    formData.append("content", content);

    Array.from(imagesInput.files).forEach((file) => {
        formData.append("files", file);
    });

    try {
        const response = await fetch(`${API_BASE_URL}`, {
            method: "POST",
            credentials: "include",
            body: formData, // Use FormData for sending files
        });

        if (!response.ok) throw new Error("Failed to create post");

        alert("Post created successfully!");
        document.getElementById("create-post-form").reset();
        showViewPosts();
    } catch (error) {
        alert(error.message);
    }
}


// Render posts in the list
function renderPosts(posts) {
    const postsList = document.getElementById("posts-list");
    postsList.innerHTML = "";

    posts.forEach(post => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong onclick="viewPostDetail(${post.id})">${post.title}</strong> by ${post.author} - ${new Date(post.createdAt).toLocaleDateString()}
            <p>Likes: ${post.likeNum}, Comments: ${post.viewCount}</p>
        `;
        postsList.appendChild(listItem);
    });
}

// Delete a post
async function deletePost(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to delete post");

        alert("Post deleted successfully!");
        showViewPosts();
        fetchPosts();
    } catch (error) {
        alert(error.message);
    }
}

// Attach delete post button event listener
document.getElementById("delete-post-button").addEventListener("click", () => {
    const postId = document.getElementById("post-title").dataset.postId;
    if (confirm("Are you sure you want to delete this post?")) {
        deletePost(postId);
    }
});


// View post details
async function viewPostDetail(postId) {
    document.getElementById("view-posts-section").style.display = "none";
    document.getElementById("create-post-section").style.display = "none";
    document.getElementById("post-detail-section").style.display = "block";

    try {
        const postResponse = await fetch(`${API_BASE_URL}/${postId}`, {
            credentials: "include",
        });
        if (!postResponse.ok) throw new Error("Failed to fetch post details");
        const post = await postResponse.json();

        document.getElementById("post-title").textContent = post.title;
        document.getElementById("post-title").dataset.postId = post.id; // Save postId
        document.getElementById("post-author").textContent = `Author: ${post.author.nickname} (${calculateSmokingDuration(post.author.startedAt)})`;
        document.getElementById("post-content").textContent = post.content;
        document.getElementById("post-likes").textContent = `Likes: ${post.likenum}`;

        const likeButton = document.getElementById("like-post-button");
        const unlikeButton = document.getElementById("unlike-post-button");

        likeButton.style.display = "inline";
        unlikeButton.style.display = "inline";

        likeButton.onclick = () => likePost(postId);
        unlikeButton.onclick = () => unlikePost(postId);

        const imagesContainer = document.getElementById("load-post-images");
        imagesContainer.innerHTML = "";
        if (post.imagePaths && post.imagePaths.length > 0) {
            console.log(post.imagePaths)
            post.imagePaths.forEach((imagePath) => {
                const imgElement = document.createElement("img");
                imgElement.src = imagePath;
                imgElement.alt = "Post Image";
                imgElement.style.maxWidth = "20%";
                imagesContainer.appendChild(imgElement);
            });
        } else {
            imagesContainer.textContent = "No images attached.";
        }

        const commentsResponse = await fetch(`${API_BASE_URL}/${postId}/comments`, {
            credentials: "include",
        });
        if (!commentsResponse.ok) throw new Error("Failed to fetch comments");
        const comments = await commentsResponse.json();

        renderComments(comments);
    } catch (error) {
        alert(error.message);
    }
}

// Render comments with reply, edit, delete functionality
function renderComments(comments) {
    const commentsList = document.getElementById("post-comments");
    commentsList.innerHTML = "";

    const renderComment = (comment, level = 0) => {
        const listItem = document.createElement("li");
        listItem.style.marginLeft = `${level * 20}px`;

        listItem.innerHTML = `
            <span>${comment.author.nickname}: </span>
            <span id="comment-content-${comment.id}">${comment.content}</span>
            <p>Likes: <span id="comment-likes-${comment.id}">${comment.likenum}</span></p>
            <button onclick="likeComment(${comment.id})">Like</button>
            <button onclick="unlikeComment(${comment.id})">Unlike</button>
            <button onclick="showReplyForm(${comment.id}, ${level})">Reply</button>
            <button onclick="showEditCommentForm(${comment.id}, '${comment.content}')">Edit</button>
            <button onclick="deleteComment(${comment.id})">Delete</button>
            <form id="reply-form-${comment.id}" style="display: none;" onsubmit="submitReply(event, ${comment.id}, ${level + 1})">
                <textarea id="reply-content-${comment.id}" placeholder="Write a reply..." required></textarea>
                <button type="submit">Post Reply</button>
                <button type="button" onclick="hideReplyForm(${comment.id})">Cancel</button>
            </form>
            <form id="edit-comment-form-${comment.id}" style="display: none;" onsubmit="submitEditComment(event, ${comment.id})">
                <input type="text" id="edit-comment-input-${comment.id}" value="${comment.content}" required>
                <button type="submit">Save</button>
                <button type="button" onclick="hideEditCommentForm(${comment.id})">Cancel</button>
            </form>
        `;

        commentsList.appendChild(listItem);

        if (comment.children && comment.children.length > 0 && level < 2) {
            comment.children.forEach(reply => renderComment(reply, level + 1));
        }
    };

    comments.forEach(comment => renderComment(comment));
}

function showReplyForm(commentId) {
    document.getElementById(`reply-form-${commentId}`).style.display = "block";
}

function hideReplyForm(commentId) {
    document.getElementById(`reply-form-${commentId}`).style.display = "none";
}

async function submitReply(event, parentId, level = 0) {
    event.preventDefault();

    if (level >= 3) {
        alert("Replies are limited to 3 levels.");
        return;
    }

    const postId = document.getElementById("post-title").dataset.postId;
    const content = document.getElementById(`reply-content-${parentId}`).value;

    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/comments`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, parentId }),
        });

        if (!response.ok) throw new Error("Failed to post reply");

        alert("Reply added!");
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}

function showEditCommentForm(commentId, currentContent) {
    document.getElementById(`comment-content-${commentId}`).style.display = "none";
    document.getElementById(`edit-comment-form-${commentId}`).style.display = "block";
}

// Hide edit comment form
function hideEditCommentForm(commentId) {
    document.getElementById(`comment-content-${commentId}`).style.display = "inline";
    document.getElementById(`edit-comment-form-${commentId}`).style.display = "none";
}

// Submit edit comment form
function submitEditComment(event, commentId) {
    event.preventDefault();
    const updatedContent = document.getElementById(`edit-comment-input-${commentId}`).value;
    updateComment(commentId, updatedContent);
}

// Like a comment
async function likeComment(commentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}/likes`, {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to like the comment");

        alert("Comment liked successfully!");
        const postId = document.getElementById("post-title").dataset.postId;
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}

// Unlike a comment
async function unlikeComment(commentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}/likes`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to unlike the comment");

        alert("Comment unliked successfully!");
        const postId = document.getElementById("post-title").dataset.postId;
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}

// Delete a comment
async function deleteComment(commentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to delete comment");

        alert("Comment deleted successfully!");

        const postId = document.getElementById("post-title").dataset.postId;
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}

// Update a comment
async function updateComment(commentId, updatedContent) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updatedContent }),
        });

        if (!response.ok) throw new Error("Failed to update comment");

        alert("Comment updated successfully!");

        const postId = document.getElementById("post-title").dataset.postId;
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}


// Add a comment
async function addComment(postId) {
    const content = document.getElementById("new-comment").value;

    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/comments`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error("Failed to post comment");

        alert("Comment added!");
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}

// Attach "Add Comment" form event listener
document.getElementById("add-comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const postId = document.getElementById("post-title").dataset.postId;
    addComment(postId);
});

// Like a post
async function likePost(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/likes`, {
            method: "POST",
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to like post");

        alert("Post liked!");
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}

// Unlike a post
async function unlikePost(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/likes`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to unlike post");

        alert("Like removed!");
        viewPostDetail(postId);
    } catch (error) {
        alert(error.message);
    }
}

// Toggle edit post form
document.getElementById("edit-post-button").addEventListener("click", () => {
    document.getElementById("update-post-form").style.display = "block";
});

// Update a post
async function updatePost(postId) {
    const updatedTitle = document.getElementById("update-title-input").value;
    const updatedContent = document.getElementById("update-content-input").value;
    const imagesInput = document.getElementById("update-post-images");
    const formData = new FormData();

    // Add title and content to the form data
    formData.append("title", updatedTitle);
    formData.append("content", updatedContent);

    // Add new files to the form data
    Array.from(imagesInput.files).forEach((file) => {
        formData.append("files", file); // "files" 필드 이름 유지
    });

    try {
        const response = await fetch(`${API_BASE_URL}/${postId}`, {
            method: "PUT",
            credentials: "include",
            body: formData, // FormData를 사용해 파일 포함
        });

        if (!response.ok) throw new Error("Failed to update post");

        alert("Post updated successfully!");
        viewPostDetail(postId); // 업데이트된 게시물 상세 보기로 이동
    } catch (error) {
        alert(error.message);
    }
}


// Attach "Update Post" form event listener
document.getElementById("update-post-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const postId = document.getElementById("post-title").dataset.postId;
    updatePost(postId);
});

// Pagination controls
function updatePage(change) {
    currentPage += change;
    if (currentPage < 1) currentPage = 1;
    fetchPosts();
}

function calculateSmokingDuration(startedAt) {
    if (!startedAt) return "Not set";

    const startDate = new Date(startedAt); // 흡연 시작일
    const currentDate = new Date(); // 현재 날짜

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth(); // 0-based index
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based index

    const totalMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);

    return totalMonths >= 0 ? `흡연 ${totalMonths} 개월 차` : "Invalid date";
}

document.getElementById("prev-page").addEventListener("click", () => updatePage(-1));
document.getElementById("next-page").addEventListener("click", () => updatePage(1));

// Search button
document.getElementById("search-button").addEventListener("click", fetchPosts);

// Initial load
document.addEventListener("DOMContentLoaded", () => {
    showViewPosts(); // 기본적으로 View Posts 섹션을 보여줍니다.

    // Attach "Create Post" form event listener
    document.getElementById("create-post-form").addEventListener("submit", (e) => {
        e.preventDefault();
        createPost(); // Create Post 호출
    });
});
