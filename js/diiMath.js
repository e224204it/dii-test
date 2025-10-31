// diiMath.js
// Calculate DII components using nutrition totals and parameters in data/dii_param.json

export async function calculateDII(nutritionTotals) {
	const res = await fetch('./data/dii_param.json');
	const arr = await res.json();
	const meanRow = arr.find(r => r['Unnamed: 0'] && r['Unnamed: 0'].toString().toLowerCase() === 'mean');
	const sdRow = arr.find(r => r['Unnamed: 0'] && (r['Unnamed: 0'].toString().toLowerCase().includes('s.d') || r['Unnamed: 0'] === 'S.D'));
	const scoreRow = arr.find(r => r['Unnamed: 0'] && r['Unnamed: 0'].toString().toLowerCase() === 'score');

	if (!meanRow || !sdRow || !scoreRow) throw new Error('dii_param.json format not recognized');

	// Map nutritionTotals keys by base name (remove parentheses)
	const nutritionKeyMap = {};
	Object.keys(nutritionTotals).forEach(k => {
		const base = k.replace(/\s*\(.+\)/, '').trim();
		nutritionKeyMap[base] = k;
	});

	const diiResult = {};

	Object.keys(scoreRow).forEach(key => {
		if (key === 'Unnamed: 0') return;
		const scoreVal = parseFloat(scoreRow[key]);
		const meanVal = parseFloat(meanRow[key]);
		const sdVal = parseFloat(sdRow[key]);
		const baseKey = key.replace(/\s*\(.+\)/, '').trim();

		// find observed - 完全一致を優先
		let observed = 0;
		// 1. 完全一致（元のキー）
		if (typeof nutritionTotals[key] !== 'undefined') {
			observed = parseFloat(nutritionTotals[key]) || 0;
		}
		// 2. ベースキーでマッチング（括弧を除去したもの）
		else if (nutritionKeyMap[baseKey]) {
			observed = parseFloat(nutritionTotals[nutritionKeyMap[baseKey]]) || 0;
		}
		// 3. 前方一致で検索
		else {
			const found = Object.keys(nutritionTotals).find(k => k.startsWith(baseKey) || baseKey.startsWith(k.replace(/\s*\(.+\)/, '').trim()));
			if (found) observed = parseFloat(nutritionTotals[found]) || 0;
		}

		let comp = 0;
		if (!isNaN(meanVal) && !isNaN(sdVal) && sdVal !== 0 && !isNaN(scoreVal)) {
			const z = (observed - meanVal) / sdVal;
			comp = +(z * scoreVal).toFixed(3);
		}

		diiResult[baseKey] = comp;
	});

	return diiResult;
}

export default calculateDII;