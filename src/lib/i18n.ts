import { useLanguageStore } from "../stores/language.ts";
import type { Language } from "../types/index.ts";

type T = Record<Language, string>;

const t = (en: string, ja: string, ko: string, sc: string, tc: string): T => ({
  en,
  ja,
  ko,
  sc,
  tc,
});

export const translations = {
  // Header
  synthesisOptimizer: t(
    "Synthesis Optimizer",
    "調合オプティマイザー",
    "조합 최적화",
    "调合优化器",
    "調合優化器",
  ),

  // Recipe list
  recipes: t("Recipes", "レシピ", "레시피", "配方", "配方"),
  searchRecipes: t(
    "Search recipes...",
    "レシピ検索...",
    "레시피 검색...",
    "搜索配方...",
    "搜尋配方...",
  ),
  recipeCount: t("recipes", "件", "개", "个配方", "個配方"),

  // Kind labels
  kindAttack: t("Attack", "攻撃", "공격", "攻击", "攻擊"),
  kindHeal: t("Heal", "回復", "회복", "回复", "回復"),
  kindBuff: t("Buff", "強化", "강화", "强化", "強化"),
  kindDebuff: t("Debuff", "弱体化", "약화", "弱化", "弱化"),
  kindWeapon: t("Weapon", "武器", "무기", "武器", "武器"),
  kindArmor: t("Armor", "防具", "방어구", "防具", "防具"),
  kindAccessory: t("Accessory", "装飾品", "장신구", "饰品", "飾品"),
  kindMix: t("Mix", "調合品", "조합품", "调合品", "調合品"),

  // Recipe detail
  back: t("Back to recipes", "レシピ一覧へ", "레시피 목록으로", "返回配方列表", "返回配方列表"),
  switchRecipe: t("Switch", "切替", "변경", "切换", "切換"),
  loading: t("Loading...", "読み込み中...", "로딩 중...", "加载中...", "載入中..."),
  recipeNotFound: t(
    "Recipe not found.",
    "レシピが見つかりません。",
    "레시피를 찾을 수 없습니다.",
    "未找到配方。",
    "未找到配方。",
  ),
  noPanel: t(
    "No panel data available",
    "パネルデータなし",
    "패널 데이터 없음",
    "无面板数据",
    "無面板資料",
  ),

  // Sections
  effects: t("Effects", "効果", "효과", "效果", "效果"),
  coopSkills: t("Co-op Skills", "協力スキル", "협력 스킬", "协力技能", "協力技能"),
  optimize: t("Optimize", "最適化", "최적화", "优化", "優化"),

  // Item card
  uses: t("Uses", "使用回数", "사용 횟수", "使用次数", "使用次數"),
  quantity: t("Quantity", "個数", "수량", "数量", "數量"),
  range: t("Range", "範囲", "범위", "范围", "範圍"),

  // Effect bar
  none: t("none", "なし", "없음", "无", "無"),

  // Co-op skills
  unmet: t("Unmet", "未達", "미달", "未达", "未達"),

  // Optimizer
  globalOptimum: t("Global Optimum", "全体最適", "전체 최적", "全局最优", "全局最優"),
  maximizeSingle: t(
    "Maximize Single Effect",
    "単一効果最大化",
    "단일 효과 최대화",
    "最大化单效果",
    "最大化單效果",
  ),
  targetCombo: t(
    "Target Effect Combo",
    "指定効果組合せ",
    "지정 효과 조합",
    "指定效果组合",
    "指定效果組合",
  ),
  optimizing: t("Optimizing...", "最適化中...", "최적화 중...", "优化中...", "優化中..."),
  loadingData: t(
    "Loading data...",
    "データ読込中...",
    "데이터 로딩 중...",
    "加载数据中...",
    "載入資料中...",
  ),
  optimizeBtn: t("OPTIMIZE", "最適化実行", "최적화 실행", "开始优化", "開始優化"),
  plansFound: t("plans found", "件の方案", "건의 방안", "个方案", "個方案"),
  bestScore: t("best score", "最高スコア", "최고 점수", "最高分", "最高分"),
  maxComponents: t(
    "Components per material",
    "素材ごとの部品数",
    "재료당 부품 수",
    "每个材料的部件数",
    "每個材料的部件數",
  ),
  plan: t("Plan", "方案", "방안", "方案", "方案"),

  // Inventory (game import)
  inventory: t("Inventory", "所持品", "인벤토리", "游戏库存", "遊戲庫存"),
  importFromGame: t(
    "Import from game",
    "ゲームから読込",
    "게임에서 가져오기",
    "从游戏导入",
    "從遊戲匯入",
  ),
  importing: t("Importing...", "読込中...", "가져오는 중...", "导入中...", "匯入中..."),
  useInventory: t(
    "Use only owned items",
    "所持品のみ使用",
    "보유 아이템만 사용",
    "仅使用库存材料",
    "僅使用庫存材料",
  ),
  itemsImported: t("items", "個", "개", "个道具", "個道具"),
  bridgeOffline: t(
    "Bridge not running: start bridge/server.py",
    "ブリッジ未起動：bridge/server.py を起動してください",
    "브리지 미실행: bridge/server.py 를 실행하세요",
    "桥接程序未运行：请先启动 bridge/server.py",
    "橋接程式未執行：請先啟動 bridge/server.py",
  ),
  gameNotRunning: t(
    "Game is not running",
    "ゲームが起動していません",
    "게임이 실행 중이 아닙니다",
    "游戏未运行",
    "遊戲未執行",
  ),
  unsupportedVersion: t(
    "Unsupported game version (needs 1.8.0.0)",
    "非対応のバージョンです（1.8.0.0 が必要）",
    "지원하지 않는 버전 (1.8.0.0 필요)",
    "不支持的游戏版本（需要 1.8.0.0）",
    "不支援的遊戲版本（需要 1.8.0.0）",
  ),
  importFailed: t("Import failed", "読込に失敗しました", "가져오기 실패", "导入失败", "匯入失敗"),
  inventoryShortage: t(
    "Not enough owned items for this recipe",
    "所持品が足りません",
    "보유 아이템이 부족합니다",
    "库存材料不足以完成此配方",
    "庫存材料不足以完成此配方",
  ),
  quality: t("Quality", "品質", "품질", "品质", "品質"),
  friendship: t("Friendship", "友好度", "우호도", "友好度", "友好度"),
  greatSuccessRate: t("Great success rate", "大成功率", "대성공 확률", "大成功率", "大成功機率"),
  coopPick: t("pick", "選択", "선택", "选", "選"),

  fillBoard: t(
    "Prefer a full board",
    "盤面を埋める",
    "판 가득 채우기 우선",
    "优先填满整盘",
    "優先填滿整盤",
  ),
  fillBoardHint: t(
    "Rank plans that occupy every cell first (the game raises great-success chance when all rows and columns are filled)",
    "全マスを埋める方案を優先します（全ての縦横を埋めると大成功率が上がります）",
    "모든 칸을 채우는 방안을 우선합니다 (모든 행과 열을 채우면 대성공 확률 상승)",
    "优先给出把所有格子都填满的方案（游戏里填满所有纵横行列会提升大成功率）",
    "優先給出把所有格子都填滿的方案（遊戲裡填滿所有縱橫行列會提升大成功率）",
  ),

  // Placement guide
  guideTitle: t("Placement guide", "配置ガイド", "배치 가이드", "放置步骤", "放置步驟"),
  guideOverview: t("Overview", "全体", "전체", "总览", "總覽"),
  guideIntro: t(
    "Step through the plan with ▶. Each step shows the piece as it should look on the board, and the outlined cells show where it goes. Place the pieces in this order.",
    "▶ で手順を確認できます。各手順では盤面に置く向きの成分と、置くマス（枠線）を表示します。この順番で配置してください。",
    "▶ 로 단계를 확인하세요. 각 단계는 판에 놓을 방향의 성분과 놓을 칸(테두리)을 보여줍니다. 이 순서대로 배치하세요.",
    "按 ▶ 逐步查看。每一步显示成分转好方向后的样子，盘面上金框圈出的就是要放的格子。请按这个顺序放。",
    "按 ▶ 逐步查看。每一步顯示成分轉好方向後的樣子，盤面上金框圈出的就是要放的格子。請按這個順序放。",
  ),
  guideMaterial: t("Material", "素材", "재료", "材料", "材料"),
  guideNoRotate: t("No rotation", "回転なし", "회전 없음", "不旋转", "不旋轉"),
  guideRotate: t(
    "Rotate clockwise",
    "時計回りに回転",
    "시계 방향 회전",
    "顺时针旋转",
    "順時針旋轉",
  ),
  guideCells: t("Cells", "マス", "칸", "占用格", "佔用格"),
  guideAnyCell: t(
    "pick any cell (no effect)",
    "任意のマスでOK（効果なし）",
    "아무 칸이나 선택 (효과 없음)",
    "任选一格即可（没有影响）",
    "任選一格即可（沒有影響）",
  ),
  guideAfterStep: t("After step", "手順", "단계", "步骤", "步驟"),
  guideDone: t(
    "All pieces placed. The board now matches the overview.",
    "全て配置しました。盤面は全体表示と同じです。",
    "모두 배치했습니다. 판이 전체 보기와 같습니다.",
    "全部放完，盘面和总览一致。",
    "全部放完，盤面和總覽一致。",
  ),
  charOlias: t("Olias", "オリアス", "올리아스", "奥利亚斯", "奧利亞斯"),
  charAlette: t("Alette", "アレット", "알레트", "阿蕾特", "阿蕾特"),
  charDiebold: t("Diebold", "ディーボルト", "디볼트", "迪伯尔德", "迪伯爾德"),
  charRamizel: t("Ramizel", "ラミゼル", "라미젤", "拉米洁儿", "拉米潔兒"),
  charPlachta: t("Plachta", "プラフタ", "플라흐타", "普拉芙妲", "普拉芙妲"),
  skillLv3: t("Quality Up", "品質上昇", "품질 상승", "品质上升", "品質上升"),
  skillLv5: t("Attribute Change", "属性変化", "속성 변화", "属性变化", "屬性變化"),
  skillLv7: t("Link Conversion", "連結成分化", "연결 성분화", "连结成分化", "連結成分化"),
  coopPickHint: t(
    "When the skill fires, pick this cell (row, column; counted from the top-left, starting at 1)",
    "スキル発動時にこのマスを選択（行, 列：左上から1始まり）",
    "스킬 발동 시 이 칸을 선택 (행, 열: 왼쪽 위부터 1부터)",
    "技能触发时选这一格（行, 列：从左上角数起，从 1 开始）",
    "技能觸發時選這一格（行, 列：從左上角數起，從 1 開始）",
  ),

  // Mobile tabs
  tabRecipe: t("Recipe", "レシピ", "레시피", "配方", "配方"),
  tabPanel: t("Panel", "パネル", "패널", "面板", "面板"),
  tabEffects: t("Effects", "効果", "효과", "效果", "效果"),
} as const;

export type TranslationKey = keyof typeof translations;

export function useT() {
  const lang = useLanguageStore((s) => s.lang);
  return (key: TranslationKey) => translations[key][lang] ?? translations[key].en;
}
