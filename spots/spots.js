const API_BASE_URL = "http://localhost:8000/spots";

let map;
let markers = []; // Array to keep track of all markers
let selectedCoords = { lat: null, lng: null };

// 네이버 지도 초기화
function initMap() {
    map = new naver.maps.Map("map", {
        center: new naver.maps.LatLng(36.3734336, 127.3595174), // 카이스트 중심 좌표
        zoom: 14,
    });

    // 지도 클릭 이벤트
    naver.maps.Event.addListener(map, 'click', function (e) {
        const lat = e.coord.lat();
        const lng = e.coord.lng();

        selectedCoords = { lat, lng };
        document.getElementById("spot-latitude").value = lat;
        document.getElementById("spot-longitude").value = lng;

        alert(`Selected Coordinates: ${lat}, ${lng}`);
    });

    fetchSpots();

    // 검색 버튼 이벤트 리스너
    document.getElementById("search-button").addEventListener("click", () => {
        const keyword = document.getElementById("search-keyword").value.trim();
        if (keyword) {
            searchSpots(keyword);
        } else {
            alert("Please enter a region or keyword.");
        }
    });
}

// 스팟 검색
async function searchSpots(keyword) {
    const searchType = document.getElementById("search-type").value; // 선택된 searchType 값 가져오기

    try {
        const response = await fetch(`${API_BASE_URL}?region=${keyword}&searchType=${searchType}`, {
            credentials: 'include', // 쿠키 포함
        });
        const spots = await response.json();

        clearMarkers();
        displaySpots(spots);
    } catch (error) {
        console.error("Failed to search spots:", error);
    }
}

// 기존 마커 제거
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null)); // 지도에서 마커 제거
    markers = []; // 배열 초기화
}

// 스팟 목록 불러오기
async function fetchSpots() {
    try {
        const response = await fetch(`${API_BASE_URL}`, {
            credentials: 'include', // 쿠키 포함
        });
        const spots = await response.json();
        clearMarkers(); // 기존 마커 초기화
        displaySpots(spots);
    } catch (error) {
        console.error("Failed to fetch spots:", error);
    }
}

// 스팟 표시
function displaySpots(spots) {
    spots.forEach(spot => {
        // 지도에 마커 추가
        const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(spot.latitude, spot.longitude),
            map,
        });

        // 마커 클릭 이벤트
        naver.maps.Event.addListener(marker, 'click', () => {
            fetchSpotDetails(spot.id);
        });

        markers.push(marker); // 마커 배열에 추가
    });
}

// 스팟 상세 정보 불러오기
async function fetchSpotDetails(spotId) {
    try {
        // Spot 정보 가져오기
        const response = await fetch(`${API_BASE_URL}/${spotId}`, {
            credentials: 'include', // 쿠키 포함
        });
        const spot = await response.json();

        // 댓글 정보 가져오기
        const commentsResponse = await fetch(`${API_BASE_URL}/${spotId}/spotcomments`, {
            credentials: 'include', // 쿠키 포함
        });
        const comments = await commentsResponse.json();

        // Spot 및 댓글 표시
        displaySpotDetails(spot, comments);
    } catch (error) {
        console.error("Failed to fetch spot details or comments:", error);
    }
}

// 스팟 상세 정보 및 댓글 표시
function displaySpotDetails(spot, comments) {
    const detailSection = document.getElementById("spot-detail-section");
    const detailDiv = document.getElementById("spot-detail");

    // Spot 상세 정보
    detailDiv.innerHTML = `
        <h3>${spot.name} by ${spot.author.nickname} (${calculateSmokingDuration(spot.author.startedAt)})</h3>
        <p>${spot.description}</p>
        <p>Address: ${spot.roadAddress}</p>
        <p>Average Rate: ${spot.avgRate}</p>
        <p>Created At: ${new Date(spot.createdAt).toLocaleString()}</p>
        <button onclick="deleteSpot(${spot.id})">Delete Spot</button>
        <button id="update-spot-button-${spot.id}">Update Spot</button>
        <h4>Comments</h4>
        <ul id="comments-list"></ul>
        <form id="comment-form" style="margin-top: 20px;">
            <textarea id="comment-content" placeholder="Write your comment here..." required></textarea>
            <input type="number" id="comment-rate" placeholder="Rate (1-5)" min="1" max="5" required>
            <button type="submit">Submit Comment</button>
        </form>
    `;

    // Update 버튼 이벤트 리스너 추가
    document.getElementById(`update-spot-button-${spot.id}`).addEventListener("click", () => {
        showUpdateForm(spot.id, spot.name, spot.description);
    });

    // 댓글 표시
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = "";

    comments.forEach(comment => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <p>${comment.content}</p>
            <p>Rate: ${comment.rate}</p>
            <p>By: ${comment.author.nickname} on ${new Date(comment.createdAt).toLocaleString()}</p>
            <button onclick="showUpdateCommentForm(${comment.id}, '${comment.content}', ${comment.rate})">Edit</button>
            <button onclick="deleteComment(${comment.id})">Delete</button>
        `;
        commentsList.appendChild(listItem);
    });

    // 댓글 작성 이벤트 리스너 추가
    document.getElementById("comment-form").addEventListener("submit", (e) => {
        e.preventDefault();
        createSpotComment(spot.id);
    });

    detailSection.style.display = "block";
}

// 댓글 수정 폼 표시
function showUpdateCommentForm(commentId, currentContent, currentRate) {
    const commentsList = document.getElementById("comments-list");
    const updateForm = document.createElement("form");
    updateForm.id = `update-comment-form-${commentId}`;
    updateForm.style.marginTop = "10px";
    updateForm.innerHTML = `
        <textarea id="update-comment-content-${commentId}" placeholder="Edit your comment">${currentContent}</textarea>
        <input type="number" id="update-comment-rate-${commentId}" placeholder="Rate (1-5)" value="${currentRate}" min="1" max="5" required>
        <button type="submit">Update</button>
    `;

    commentsList.appendChild(updateForm);

    // 댓글 수정 이벤트 리스너 추가
    updateForm.addEventListener("submit", (e) => {
        e.preventDefault();
        updateComment(commentId);
    });
}

// 댓글 수정
async function updateComment(commentId) {
    const updatedContent = document.getElementById(`update-comment-content-${commentId}`).value;
    const updatedRate = document.getElementById(`update-comment-rate-${commentId}`).value;

    try {
        const response = await fetch(`${API_BASE_URL}/spotcomments/${commentId}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updatedContent, rate: parseInt(updatedRate, 10) }),
        });

        if (response.ok) {
            alert("Comment updated successfully!");
            fetchSpotDetails(commentId); // 댓글 수정 후 Spot 세부 정보 다시 로드
        } else {
            const error = await response.json();
            alert(`Failed to update comment: ${error.message}`);
        }
    } catch (error) {
        console.error("Error updating comment:", error);
    }
}

// 댓글 삭제
async function deleteComment(commentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/spotcomments/${commentId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (response.ok) {
            alert("Comment deleted successfully!");
            document.getElementById(`update-comment-form-${commentId}`)?.remove(); // 삭제된 댓글의 수정 폼 제거
            fetchSpotDetails(commentId); // 댓글 삭제 후 Spot 세부 정보 다시 로드
        } else {
            const error = await response.json();
            alert(`Failed to delete comment: ${error.message}`);
        }
    } catch (error) {
        console.error("Error deleting comment:", error);
    }
}


// Update Form 표시
function showUpdateForm(spotId, currentName, currentDescription) {
    const detailDiv = document.getElementById("spot-detail");

    detailDiv.innerHTML += `
        <form id="update-spot-form" style="margin-top: 20px;">
            <input type="text" id="update-spot-name" value="${currentName}" placeholder="Update Spot Name" required>
            <textarea id="update-spot-description" placeholder="Update Description" required>${currentDescription}</textarea>
            <button type="submit">Update Spot</button>
        </form>
    `;

    const updateForm = document.getElementById("update-spot-form");
    updateForm.addEventListener("submit", (e) => {
        e.preventDefault();
        updateSpot(spotId);
    });
}

// 스팟 업데이트
async function updateSpot(spotId) {
    const updatedName = document.getElementById("update-spot-name").value;
    const updatedDescription = document.getElementById("update-spot-description").value;

    try {
        const response = await fetch(`${API_BASE_URL}/${spotId}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: updatedName, description: updatedDescription }),
        });

        if (response.ok) {
            alert("Spot updated successfully!");
            fetchSpotDetails(spotId); // 업데이트된 Spot 세부 정보 다시 로드
        } else {
            const error = await response.json();
            alert(`Failed to update spot: ${error.message}`);
        }
    } catch (error) {
        console.error("Error updating spot:", error);
    }
}


// 스팟 생성
document.getElementById("create-spot-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("spot-name").value;
    const description = document.getElementById("spot-description").value;
    const latitude = document.getElementById("spot-latitude").value;
    const longitude = document.getElementById("spot-longitude").value;

    if (!latitude || !longitude) {
        alert("Please select a location on the map.");
        return;
    }

    const coords = `${longitude},${latitude}`.replace(/\s+/g, '');

    try {
        const response = await fetch(`${API_BASE_URL}?coords=${coords}`, {
            method: "POST",
            credentials: 'include', // 쿠키 포함
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description }),
        });

        if (response.ok) {
            alert("Spot created successfully!");
            document.getElementById("create-spot-form").reset();
            fetchSpots(); // 새로고침
        } else {
            const error = await response.json();
            alert(`Failed to create spot: ${error.message}`);
        }
    } catch (error) {
        console.error("Error creating spot:", error);
    }
});

// 스팟 삭제
async function deleteSpot(spotId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${spotId}`, {
            method: "DELETE",
            credentials: 'include', // 쿠키 포함
        });

        if (response.ok) {
            alert("Spot deleted successfully!");
            document.getElementById("spot-detail-section").style.display = "none";
            fetchSpots();
        } else {
            const error = await response.json();
            alert(`Failed to delete spot: ${error.message}`);
        }
    } catch (error) {
        console.error("Error deleting spot:", error);
    }
}

// 댓글 작성
async function createSpotComment(spotId) {
    const content = document.getElementById("comment-content").value;
    const rateValue = document.getElementById("comment-rate").value;
    const rate = parseInt(rateValue, 10);

    try {
        const response = await fetch(`${API_BASE_URL}/${spotId}/spotcomments`, {
            method: "POST",
            credentials: 'include', // 쿠키 포함
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, rate }),
        });

        if (response.ok) {
            alert("Comment added successfully!");
            fetchSpotDetails(spotId); // 댓글 추가 후 Spot 세부 정보 다시 로드
            document.getElementById("comment-content").value = "";
            document.getElementById("comment-rate").value = "";
        } else {
            const error = await response.json();
            alert(`Failed to add comment: ${error.message}`);
        }
    } catch (error) {
        console.error("Error adding comment:", error);
    }
}

function calculateSmokingDuration(startedAt) {
    if (!startedAt) return "Not set";

    const startDate = new Date(startedAt); // 흡연 시작일
    const currentDate = new Date(); // 현재 날짜

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth(); // 0-based index
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based index

    // 총 개월 수 계산
    const totalMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);

    return totalMonths >= 0 ? `흡연 ${totalMonths} 개월 차` : "Invalid date";
}

// 지도 초기화
window.onload = initMap