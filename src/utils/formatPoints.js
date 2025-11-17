// 格式化點數為千分逗號並加上單位「點」
export function formatPoints(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString()} 點`;
}

export default formatPoints;
