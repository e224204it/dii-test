// 正規分布の確率密度関数（PDF）と累積分布関数（CDF）
function normDist(x, mean, stdDev){
        // 累積分布関数（CDF） using erf approximation
        const z = (x - mean) / (stdDev * Math.sqrt(2));
        return 0.5 * (1 + erf(z));
}

// 誤差関数 erf の近似（数値計算による近似式）
function erf(z) {
    const sign = z >= 0 ? 1 : -1;
    const absZ = Math.abs(z);
    const t = 1 / (1 + 0.3275911 * absZ);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;

    const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absZ * absZ);
    return sign * y;
}

export { normDist };
