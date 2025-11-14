import { apiUrl } from "./ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

const apiCallGet = async (url, token) => {
    try {
        const response = await fetch(apiUrl(url), {
            method: "GET",
            credentials: 'include',
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`GET request failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in GET request:", error);
        throw error;
    }
};

const apiCallPost = async (url, token, body) => {
    try {
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        // DEBUG: log whether Authorization header will be sent (do not log full token in production)
        // console.log('API POST sending Authorization?', !!headers.Authorization, 'url=', url);

        const bodyText = typeof body === "string" ? body : JSON.stringify(body);

        const response = await fetch(apiUrl(url), {
            method: "POST",
            credentials: 'include',
            headers,
            body: bodyText,
        });

        // DEBUG: log status and content-type
        // console.log('API POST response status', response.status, 'headers.content-type=', response.headers.get('content-type'));

        // If unauthorized, proactively clear local auth and notify app to navigate to login
        if (response.status === 401) {
            console.warn('API returned 401; clearing local auth and emitting forceLogout');
            try { await AsyncStorage.multiRemove(['userData','token','userId','refreshToken']); } catch (e) { /* ignore */ }
            try { DeviceEventEmitter.emit('forceLogout'); } catch(e) { /* ignore */ }
        }

        const responseText = await response.text().catch(() => "<no body>");
        let parsedResponse;
        try { parsedResponse = JSON.parse(responseText); } catch { parsedResponse = responseText; }

        if (!response.ok) {
            console.error("API POST error", {
                url,
                status: response.status,
                statusText: response.statusText,
                responseBody: parsedResponse,
            });
            // include server message in the thrown error
            throw new Error(`POST request failed: ${response.status} ${response.statusText} - ${typeof parsedResponse === "string" ? parsedResponse : JSON.stringify(parsedResponse)}`);
        }

        // return parsed JSON when possible, otherwise raw text
        try { return JSON.parse(responseText); } catch { return responseText; }
    } catch (error) {
        console.error("Error in POST request:", error);
        throw error;
    }
};

const apiCallPut = async (url, token, body) => {
    try {
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(apiUrl(url), {
            method: "PUT",
            credentials: 'include',
            headers,
            body: typeof body === "string" ? body : JSON.stringify(body),
        });

        const responseText = await response.text().catch(() => "");
        let parsed;
        try { parsed = responseText ? JSON.parse(responseText) : null; } catch (e) {
            console.error("PUT response JSON parse error", { url, responseText });
            throw e;
        }

        if (!response.ok) {
            console.error("API PUT error", { url, status: response.status, responseBody: parsed ?? responseText });
            throw new Error(`PUT request failed: ${response.status} ${response.statusText} - ${responseText || "<no body>"}`);
        }

        return parsed;
    } catch (error) {
        console.error("Error in PUT request:", error);
        throw error;
    }
};

export { apiCallGet, apiCallPost, apiCallPut };