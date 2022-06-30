import { TIMEOUT_SEC } from "./config.js";

function timeout(s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(
        new Error(`Request took too long time! Timeout after ${s} second`)
      );
    }, s * 1000);
  });
}

export const AJAX = async function (url, uploadData = undefined) {
  try {
    const fetchPro = uploadData
      ? fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploadData),
        })
      : fetch(url);

    const res = await Promise.race([fetchPro, timeout(TIMEOUT_SEC)]);

    const data = await res.json();

    if (!res.ok) throw new Error(`${data.message} (${res.status})`);
    return data;
  } catch (err) {
    throw Error(err);
  }
};

/*

export async function getJSON(url) {
  try {
    const res = await Promise.race([, timeout(TIMEOUT_SEC)]);

    const data = await res.json();

    if (!res.ok) throw new Error(`${data.message} (${res.status})`);
    return data;
  } catch (err) {
    throw Error(err);
  }
}

export async function sendJSON(url, uploadData) {
  try {
    const res = await Promise.race([, timeout(TIMEOUT_SEC)]);
    const data = await res.json();

    if (!res.ok) throw new Error(`${data.message}  (${res.status})`);
    return data;
  } catch (err) {
    throw Error(err);
  }
}
*/
