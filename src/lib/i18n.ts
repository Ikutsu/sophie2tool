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
  modeGlobalHint: t(
    "Balance every effect and quality",
    "全効果と品質のバランスを取ります",
    "모든 효과와 품질의 균형을 맞춥니다",
    "兼顾所有效果和品质",
    "兼顧所有效果和品質",
  ),
  modeSingleHint: t(
    "Pick the effect to push as high as possible",
    "最大まで伸ばす効果を選んでください",
    "최대한 올릴 효과를 고르세요",
    "选择要尽量拉满的效果",
    "選擇要盡量拉滿的效果",
  ),
  modeComboHint: t(
    "Pick the tier each effect must reach",
    "各効果の到達目標を選んでください",
    "효과별 목표 단계를 고르세요",
    "为每个效果选择要达到的等级",
    "為每個效果選擇要達到的等級",
  ),
  noRequirement: t("Any", "指定なし", "상관없음", "不要求", "不要求"),
  comboUnreachable: t(
    "No plan reaches all these targets with these materials. The closest one:",
    "この素材では全ての目標に届く方案がありません。最も近い方案：",
    "이 재료로는 모든 목표에 도달하는 방안이 없습니다. 가장 가까운 방안:",
    "用这些材料没有方案能同时达到所有目标。最接近的方案：",
    "用這些材料沒有方案能同時達到所有目標。最接近的方案：",
  ),
  targetNeed: t("needs", "必要", "필요", "需要", "需要"),
  targetBest: t("best", "最高", "최고", "最多", "最多"),
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
    "Can't reach the bridge app. Is sophie2-bridge.exe running?",
    "ブリッジに接続できません。sophie2-bridge.exe は起動していますか？",
    "브리지에 연결할 수 없습니다. sophie2-bridge.exe 가 실행 중인가요?",
    "连不上桥接程序。sophie2-bridge.exe 运行了吗？",
    "連不上橋接程式。sophie2-bridge.exe 執行了嗎？",
  ),
  bridgeHelp: t(
    "How to import from the game?",
    "ゲームから読み込むには？",
    "게임에서 가져오는 방법",
    "如何从游戏导入？",
    "如何從遊戲匯入？",
  ),
  bridgeIntro: t(
    "The page can't read the game by itself: a small read-only app on your PC does it.",
    "ページだけではゲームを読めないため、PC 上の小さな読み取り専用アプリを使います。",
    "웹페이지만으로는 게임을 읽을 수 없어, PC에서 작은 읽기 전용 앱을 실행합니다.",
    "网页本身读不到游戏，需要在电脑上运行一个只读的小工具。",
    "網頁本身讀不到遊戲，需要在電腦上執行一個只讀的小工具。",
  ),
  bridgeStep1: t(
    "Download sophie2-bridge.exe (Windows)",
    "sophie2-bridge.exe をダウンロード（Windows）",
    "sophie2-bridge.exe 다운로드 (Windows)",
    "下载 sophie2-bridge.exe（Windows）",
    "下載 sophie2-bridge.exe（Windows）",
  ),
  bridgeStep2: t(
    "Start the game (Steam, version 1.8.0.0)",
    "ゲームを起動（Steam 版 1.8.0.0）",
    "게임 실행 (Steam 판 1.8.0.0)",
    "打开游戏（Steam 版 1.8.0.0）",
    "開啟遊戲（Steam 版 1.8.0.0）",
  ),
  bridgeStep3: t(
    "Double-click sophie2-bridge.exe and keep its window open",
    "sophie2-bridge.exe をダブルクリックし、ウィンドウを開いたままにする",
    "sophie2-bridge.exe 를 더블클릭하고 창을 열어 둡니다",
    "双击 sophie2-bridge.exe，保持它的窗口开着",
    "雙擊 sophie2-bridge.exe，保持它的視窗開著",
  ),
  bridgeStep4: t(
    "Click “Import from game”. A small window may open for a moment: that's the app handing over the data",
    "「ゲームから読込」を押す。小さなウィンドウが一瞬開くのは、アプリがデータを渡しているためです",
    "“게임에서 가져오기”를 누릅니다. 작은 창이 잠깐 열리는 것은 앱이 데이터를 넘겨주는 것입니다",
    "点「从游戏导入」。会短暂弹出一个小窗口，那是小工具在把数据交给网页",
    "按「從遊戲匯入」。會短暫跳出一個小視窗，那是小工具在把資料交給網頁",
  ),
  bridgeNote: t(
    "It only reads the game's memory and never changes the game or your saves. Windows may say it protected your PC: choose “More info” → “Run anyway”. Chrome or Edge recommended.",
    "ゲームのメモリを読むだけで、ゲームやセーブは変更しません。Windows の警告が出たら「詳細情報」→「実行」。Chrome / Edge 推奨。",
    "게임 메모리를 읽기만 하며 게임이나 세이브를 바꾸지 않습니다. Windows 경고가 뜨면 “추가 정보” → “실행”. Chrome / Edge 권장.",
    "它只读取游戏内存，不会修改游戏或存档。Windows 若提示“已保护你的电脑”，点“更多信息”→“仍要运行”。建议使用 Chrome 或 Edge。",
    "它只讀取遊戲記憶體，不會修改遊戲或存檔。Windows 若顯示「已保護您的電腦」，按「其他資訊」→「仍要執行」。建議使用 Chrome 或 Edge。",
  ),
  bridgeSource: t("Source code", "ソースコード", "소스 코드", "源代码", "原始碼"),
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
    "Rank plans that occupy every cell first (the great-success chance equals the number of occupied cells)",
    "全マスを埋める方案を優先します（大成功率は埋まったマス数と同じです）",
    "모든 칸을 채우는 방안을 우선합니다 (대성공 확률은 채운 칸 수와 같습니다)",
    "优先给出把所有格子都填满的方案（大成功率等于已占格数）",
    "優先給出把所有格子都填滿的方案（大成功率等於已佔格數）",
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

/** Keep <html lang> (fonts, glyph forms, screen readers) and the tab title in step. */
const HTML_LANG: Record<Language, string> = {
  en: "en",
  ja: "ja",
  ko: "ko",
  sc: "zh-Hans",
  tc: "zh-Hant",
};
function syncDocument(lang: Language): void {
  document.documentElement.lang = HTML_LANG[lang];
  document.title = `Sophie 2 ${translations.synthesisOptimizer[lang]}`;
}
syncDocument(useLanguageStore.getState().lang);
useLanguageStore.subscribe((s) => syncDocument(s.lang));
