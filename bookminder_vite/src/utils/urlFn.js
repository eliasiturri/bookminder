const assetsPath = import.meta.env.VITE_ASSETS_PATH;
const backendUrl = import.meta.env.VITE_BACKEND_URL;

function joinUrl(base, ...parts) {
    // Use URL to join the base URL with the other parts
    const url = new URL(base);
    
    // Extract query string from the last part if it exists
    let queryString = '';
    if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const queryIndex = lastPart.indexOf('?');
        if (queryIndex !== -1) {
            queryString = lastPart.substring(queryIndex);
            parts[parts.length - 1] = lastPart.substring(0, queryIndex);
        }
    }
    
    parts.forEach(part => {
        url.pathname = url.pathname.replace(/\/$/, '') + '/' + part.replace(/^\/+/, '');
    });
    
    // Append query string at the end
    return url.toString() + queryString;
}

export const joinUlr = joinUrl;

export const getBackgroundImageUrl = function (path) {
    try {
        let url = joinUrl(backendUrl, assetsPath, path);
        return url ? `url('${url}')` : '';
    } catch (e) {
        console.error('Error getting background image url: ', e);
        return '';
    }
}

export const getImageUrl = function (path='') {
    try {
        // Normalize path to avoid duplicated segments like '/assets/user/.../user/...'
        let p = String(path || '');
        // If already an absolute URL, return as-is
        if (/^https?:\/\//i.test(p)) {
            return p;
        }
        // Remove any leading '/assets/' from path to avoid double '/assets'
        p = p.replace(/^\/?assets\//, '');
        // If path contains duplicated '/user/' or '/global/' segments, collapse to the last occurrence
        const dupUserIdx = p.indexOf('/user/');
        if (dupUserIdx !== -1) {
            const lastUserIdx = p.lastIndexOf('/user/');
            if (lastUserIdx > dupUserIdx) {
                p = p.substring(lastUserIdx);
            }
        }
        const dupGlobalIdx = p.indexOf('/global/');
        if (dupGlobalIdx !== -1) {
            const lastGlobalIdx = p.lastIndexOf('/global/');
            if (lastGlobalIdx > dupGlobalIdx) {
                p = p.substring(lastGlobalIdx);
            }
        }
        // Build final URL: backend + /assets + normalized path
        let url = joinUrl(backendUrl, assetsPath, p);
        return url;
    } catch (e) {
        console.error('Error getting image url: ', e);
        return '';
    }
}
