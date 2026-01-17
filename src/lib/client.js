import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { httpForm, httpJson, httpJsonWithStatus } from "./api";

const LEGACY_PROFILE_ME = `${API_BASE_URL}/api/profile/me`;
const LEGACY_PROFILE_AVATAR = `${API_BASE_URL}/api/profile/me/avatar`;

const shouldFallback = (error) => error?.status === 404 || error?.status === 405;

export async function getMyProfile({ token, userId } = {}) {
  const candidates = [API_ENDPOINTS.PROFILE_ME, LEGACY_PROFILE_ME];
  if (userId) {
    candidates.push(`${API_ENDPOINTS.PROFILE_BY_ID_PREFIX}${encodeURIComponent(userId)}`);
  }

  let lastError;
  for (const url of candidates) {
    try {
      return await httpJson(url, { token });
    } catch (error) {
      lastError = error;
      if (!shouldFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function updateMyProfile({ token, userId, profile }) {
  const candidates = [
    { url: API_ENDPOINTS.PROFILE_UPDATE, method: "PUT" },
    { url: API_ENDPOINTS.PROFILE_UPDATE, method: "POST" },
    { url: LEGACY_PROFILE_ME, method: "POST" },
    { url: LEGACY_PROFILE_ME, method: "PUT" },
  ];

  if (userId) {
    candidates.push({
      url: `${API_ENDPOINTS.PROFILE_BY_ID_PREFIX}${encodeURIComponent(userId)}`,
      method: "PUT",
    });
  }

  let lastError;
  for (const candidate of candidates) {
    try {
      return await httpJsonWithStatus(candidate.url, {
        method: candidate.method,
        token,
        body: profile,
      });
    } catch (error) {
      lastError = error;
      if (!shouldFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function uploadAvatar({ token, file }) {
  const formData = new FormData();
  formData.append("avatar", file);
  try {
    return await httpForm(API_ENDPOINTS.PROFILE_AVATAR_UPLOAD, {
      method: "POST",
      token,
      body: formData,
    });
  } catch (error) {
    if (shouldFallback(error)) {
      return httpForm(LEGACY_PROFILE_AVATAR, {
        method: "POST",
        token,
        body: formData,
      });
    }
    throw error;
  }
}

export async function updateMyProfileMultipart({ token, userId, profile, avatarFile }) {
  const formData = new FormData();
  if (profile?.username !== undefined) {
    formData.append("username", profile.username);
  }
  if (profile?.bio !== undefined) {
    formData.append("bio", profile.bio);
  }
  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  const candidates = [
    { url: API_ENDPOINTS.PROFILE_UPDATE, method: "POST" },
    { url: API_ENDPOINTS.PROFILE_UPDATE, method: "PUT" },
    { url: LEGACY_PROFILE_ME, method: "POST" },
    { url: LEGACY_PROFILE_ME, method: "PUT" },
  ];

  if (userId) {
    candidates.push({
      url: `${API_ENDPOINTS.PROFILE_BY_ID_PREFIX}${encodeURIComponent(userId)}`,
      method: "PUT",
    });
  }

  let lastError;
  for (const candidate of candidates) {
    try {
      const data = await httpForm(candidate.url, {
        method: candidate.method,
        token,
        body: formData,
      });
      return { data, status: 200 };
    } catch (error) {
      lastError = error;
      if (!shouldFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError;
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
