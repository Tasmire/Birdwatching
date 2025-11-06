const apiCallGet = async (url, token) => {
    try {
        const response = await fetch(url, {
            method: "GET",
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
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`POST request failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in POST request:", error);
        throw error;
    }
};

const apiCallPut = async (url, token, body) => {
    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`PUT request failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in PUT request:", error);
        throw error;
    }
};

export { apiCallGet, apiCallPost, apiCallPut };