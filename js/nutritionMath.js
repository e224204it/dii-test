import { foodsOne, foodsTwo, foodsThree, foodsFour, foodsFive, rice } from './loadData.js'

// 全食品データをフラット化して検索しやすくする
const allFoods = [
  ...foodsOne,
  ...foodsTwo,
  ...foodsThree,
  ...foodsFour,
  ...foodsFive,
  ...rice
]

// 指定された結果マップに基づいて栄養素の合計を計算する
// results: { "食品名": 数値 }
export function calculateNutrition(results) {
  const totals = {}

  // 緑茶と紅茶の特殊計算用の変数
  let greenTeaQty = 0
  let blackTeaQty = 0

  for (const [foodName, qty] of Object.entries(results)) {
    if (qty === 0 || qty === null || typeof qty === 'undefined') continue

    // 緑茶と紅茶は特殊処理のため一旦保存
    if (foodName.includes('緑茶')) {
      greenTeaQty += qty
      continue
    }
    if (foodName.includes('紅茶') && !foodName.includes('砂糖')) {
      blackTeaQty += qty
      continue
    }

    const food = allFoods.find(f => f && f['食品'] === foodName)
    if (!food) continue

    // 各栄養素を合計に加える（"食品"キーは除外）
    for (const [key, val] of Object.entries(food)) {
      if (key === '食品') continue
      const num = parseFloat(val)
      if (isNaN(num)) continue
      if (!totals[key]) totals[key] = 0
      totals[key] += num * qty
    }
  }

  // 緑茶/紅茶の特殊計算: 緑茶*120/50 + 紅茶*150/50
  // dii_param.json のキー "緑茶/紅茶(g) 150ml/3g" に対応
  const teaValue = (greenTeaQty * 120 / 50) + (blackTeaQty * 150 / 50)
  if (teaValue > 0) {
    totals['緑茶/紅茶(g) 150ml/3g'] = +teaValue.toFixed(3)
  }

  // 小数点揃え（任意で桁数を変えてください）
  for (const k of Object.keys(totals)) {
    totals[k] = +totals[k].toFixed(3)
  }

  return totals
}

export default calculateNutrition
