import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { httpForm, httpJson } from "./api";

export async function getMyProfile({ token }) {
  return httpJson(API_ENDPOINTS.PROFILE_ME, { token });
}

export async function updateMyProfile({ token, profile }) {
  return httpJson(API_ENDPOINTS.PROFILE_UPDATE, {
    method: "PUT",
    token,
    body: profile,
  });
}

export async function uploadAvatar({ token, file }) {
  const formData = new FormData();
  formData.append("avatar", file);
  return httpForm(API_ENDPOINTS.PROFILE_AVATAR_UPLOAD, {
    method: "POST",
    token,
    body: formData,
  });
}

export async function searchUserByEmail({ token, email }) {
  const url = `${API_BASE_URL}/profiles/search?email=${encodeURIComponent(email)}`;
  return httpJson(url, { token });
}

export async function sendFriendRequest({ token, userId }) {
  return httpJson(`${API_ENDPOINTS.FRIEND_REQUEST_PREFIX}${userId}`, {
    method: "POST",
    token,
  });
}

export async function listPosts({ token }) {
  return httpJson(API_ENDPOINTS.FORUM_POSTS_WITH_COUNTS, { token });
}

export async function createPost({ token, body }) {
  return httpJson(API_ENDPOINTS.FORUM_POSTS, {
    method: "POST",
    token,
    body,
  });
}

export async function listComments({ token, postId }) {
  return httpJson(`${API_ENDPOINTS.FORUM_COMMENTS_PREFIX}${postId}/comments`, { token });
}

export async function createComment({ token, postId, body }) {
  return httpJson(`${API_ENDPOINTS.FORUM_COMMENTS_PREFIX}${postId}/comments`, {
    method: "POST",
    token,
    body,
  });
}
