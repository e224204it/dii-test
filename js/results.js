const results = {};

export function setResult(key, value) {
    results[key] = value;
}

export function getResults() {
    return results;
}

export function exportJSON(filename = 'results.json') {
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
