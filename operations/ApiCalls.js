import { apiUrl } from "./ApiConfig";

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

        const bodyText = typeof body === "string" ? body : JSON.stringify(body);

        const response = await fetch(apiUrl(url), {
            method: "POST",
            credentials: 'include',
            headers,
            body: bodyText,
        });

        // capture response text for logging / error inspection
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