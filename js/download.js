// Build CSV from saved payload (dii_results) and survey_choices
function escapeCsv(s){
    return '"' + String(s).replace(/"/g, '""') + '"';
}

function downloadCSV(){
    try{
        const raw = localStorage.getItem('dii_results');
        let payload = null;
        if(raw){
            payload = JSON.parse(raw);
        } else if (window._lastLoadedDii) {
            payload = window._lastLoadedDii;
        }

        if(!payload || !payload.items){
            alert('ダウンロードするデータが見つかりません');
            return;
        }

        const items = payload.items;
        const keys = Object.keys(items);

        let choices = {};
        try{ choices = JSON.parse(localStorage.getItem('survey_choices') || '{}'); } catch(e){ choices = {}; }

        const labelToMultiplier = {
            '毎日': 1,
            '週5-6': 5.5/7,
            '週2-4': 3/7,
            '週1': 1/7,
            '月1-3': 1/15,
            '無': 0
        };

        const headerRow = keys.map(k => escapeCsv(k)).join(',');
        const labelRow = keys.map(k => {
            // If saved choice exists, use it. If not and computed is zero, show '無'.
            const saved = choices[k];
            const computed = parseFloat(items[k]) || 0;
            if (saved && saved !== '') return escapeCsv(saved);
            if (computed === 0) return escapeCsv('無');
            return escapeCsv('');
        }).join(',');

        const intakeRow = keys.map(k => {
            const computed = parseFloat(items[k]) || 0;
            const label = choices[k] || '';
            const mult = labelToMultiplier[label] || 0;
            if (mult > 0) {
                const intake = computed / mult;
                return escapeCsv((Math.round(intake * 10) / 10).toFixed(1));
            }
            // If multiplier is zero ("無"), write 0 explicitly
            if (computed === 0) return escapeCsv('0');
            return escapeCsv('');
        }).join(',');

        const csv = headerRow + '\n' + labelRow + '\n' + intakeRow + '\n';
        const bom = new Uint8Array([0xef,0xbb,0xbf]);
        const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'survey_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }catch(err){
        console.error(err);
        alert('CSV の作成に失敗しました');
    }
}

const downloadBtn = document.getElementById('download');
if(downloadBtn) downloadBtn.addEventListener('click', downloadCSV, false);
