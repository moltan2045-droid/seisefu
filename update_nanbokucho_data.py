import json
import os

file_path = 'kyushu_nanbokucho_data.json'

new_figures = [
    {
        "name": "良成親王 (よしなりしんのう)",
        "faction": "南朝 (征西府・後征西将軍)",
        "role": "征西将軍 (後征西将軍宮)",
        "unit_stats": {
            "type": "指揮官",
            "hp": 75,
            "atk": 18,
            "def": 22,
            "mov": 3,
            "rng": 1
        },
        "special_skill": "落日の抵抗 (HPが30%以下の時、防御力が2倍になる)",
        "relationships": [
            {
                "target": "懐良親王",
                "type": "継承",
                "score": 100,
                "description": "叔父から征西将軍の職を受け継ぐ。"
            },
            {
                "target": "今川了俊",
                "type": "宿敵",
                "score": -100,
                "description": "征西府を完全に瓦解させた敵。"
            }
        ],
        "actions": [
            "懐良親王の引退後、征西将軍として指揮を執る。",
            "筑後矢部を拠点に、圧倒的劣勢の中で抵抗を続けた。"
        ],
        "stats_hint": "粘り強く戦う防衛型指揮官。"
    },
    {
        "name": "宗良親王 (むねよししんのう)",
        "faction": "南朝 (東国)",
        "role": "征東将軍・信濃宮",
        "unit_stats": {
            "type": "文武両道",
            "hp": 70,
            "atk": 20,
            "def": 20,
            "mov": 4,
            "rng": 1
        },
        "special_skill": "新葉の言の葉 (周囲2マスの味方の状態異常を回復し、士気を高める)",
        "relationships": [
            {
                "target": "護良親王",
                "type": "兄弟",
                "score": 80,
                "description": "共に天台座主を務めた兄。"
            },
            {
                "target": "懐良親王",
                "type": "兄弟",
                "score": 80,
                "description": "九州で戦う弟。"
            }
        ],
        "actions": [
            "信濃・遠江を拠点に東国で南朝勢力を結集。",
            "『新葉和歌集』を編纂し、南朝文化を後世に伝えた。"
        ],
        "stats_hint": "支援能力に長けた万能型ユニット。"
    },
    {
        "name": "護良親王 (もりよししんのう)",
        "faction": "南朝 (建武政権)",
        "role": "征夷大将軍・大塔宮",
        "unit_stats": {
            "type": "突撃指揮官",
            "hp": 85,
            "atk": 30,
            "def": 15,
            "mov": 5,
            "rng": 1
        },
        "special_skill": "令旨の檄 (マップ上の全味方ユニットのATK+5)",
        "relationships": [
            {
                "target": "足利尊氏",
                "type": "不倶戴天",
                "score": -100,
                "description": "危険性を早くから見抜き、対立。"
            },
            {
                "target": "楠木正成",
                "type": "共闘",
                "score": 90,
                "description": "倒幕の同志。"
            }
        ],
        "actions": [
            "吉野・熊野で挙兵し、鎌倉幕府倒幕の中心的役割を果たす。",
            "建武の新政で征夷大将軍となるも、足利尊氏と対立し失脚。"
        ],
        "stats_hint": "高い攻撃力と全体バフを持つが、防御に難あり。"
    }
]

if not os.path.exists(file_path):
    print(f"エラー: {file_path} が見つかりません。")
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError:
        print("エラー: JSONファイルの読み込みに失敗しました。")
        exit(1)

if 'figures' not in data:
    data['figures'] = []

# 重複チェックをして追加
existing_names = [fig['name'].split()[0] for fig in data['figures']] # 名前の一部でチェック
added_count = 0

for new_fig in new_figures:
    # 簡易的な重複チェック（名前の前方一致）
    is_duplicate = False
    for existing_name in existing_names:
        if new_fig['name'].startswith(existing_name) or existing_name.startswith(new_fig['name'].split()[0]):
             # 既にフルネームで入っている場合などを考慮
             if new_fig['name'] == existing_name: 
                 is_duplicate = True
                 break

    # 今回は厳密に名前文字列でチェックする
    if not any(fig['name'] == new_fig['name'] for fig in data['figures']):
         data['figures'].append(new_fig)
         added_count += 1
         print(f"追加: {new_fig['name']}")
    else:
         print(f"スキップ (既存): {new_fig['name']}")

if added_count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"合計 {added_count} 人の親王を追加しました。")
else:
    print("追加データはありませんでした。")
