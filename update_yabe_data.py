import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 菊池武朝の追加
    taketomo = {
        "name": "菊池武朝 (きくち たけとも)",
        "faction": "南朝 (征西府)",
        "role": "肥後守・菊池氏第17代当主",
        "unit_stats": {
            "type": "万能騎馬",
            "hp": 90,
            "atk": 28,
            "def": 20,
            "mov": 5,
            "rng": 1
        },
        "special_skill": "若き当主の決意 (周囲2マスの味方「南朝」ユニットのDEF+15)",
        "relationships": [
            {
                "target": "良成親王",
                "type": "主従・共苦",
                "score": 100,
                "description": "衰退期の征西府を共に支え抜く。"
            },
            {
                "target": "今川了俊",
                "type": "宿敵",
                "score": -90,
                "description": "九州の覇権を争う強敵。"
            }
        ],
        "actions": [
            "12歳で家督を継承し、良成親王を奉じて戦う。",
            "託麻原の戦いで今川軍に勝利。",
            "本拠地陥落後も、矢部を拠点に抵抗を継続。"
        ],
        "stats_hint": "高い機動力と支援能力を持つ。若くして重責を担った忠臣。"
    }

    # 重複チェックして追加
    if not any(fig['name'] == taketomo['name'] for fig in data.get('figures', [])):
        data['figures'].append(taketomo)
        print(f"追加: {taketomo['name']}")

    # 2. 良成親王のデータを更新（武朝との関係を追加）
    for fig in data.get('figures', []):
        if "良成親王" in fig['name']:
            # 関係性の更新
            rel_exists = any(rel['target'] == "菊池武朝" for rel in fig.get('relationships', []))
            if not rel_exists:
                if 'relationships' not in fig:
                    fig['relationships'] = []
                fig['relationships'].append({
                    "target": "菊池武朝",
                    "type": "主従・信頼",
                    "score": 100,
                    "description": "最も信頼する軍事的右腕。共に矢部へ逃れる。"
                })
                print(f"更新: {fig['name']} の関係性に 菊池武朝 を追加")
            
            # 説明の補足
            if "矢部" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("筑後矢部（大杣御所）を最後の拠点とし、南朝の誇りを守り抜いた。")

    # 3. 矢部・大杣御所の追加
    yabe = {
        "name": "矢部・大杣御所 (おおそまごしょ)",
        "coords": {
            "q": 2,
            "r": 0
        },
        "terrain": "峻険な山岳",
        "bonus": {
            "def": 25,
            "recovery": 8,
            "visibility": -1
        },
        "description": "九州南朝最後の都。天然の要塞であり、今川了俊も攻めあぐねた聖域。"
    }

    if 'key_locations' not in data:
        data['key_locations'] = []
    
    if not any(loc['name'] == yabe['name'] for loc in data['key_locations']):
        data['key_locations'].append(yabe)
        print(f"追加地点: {yabe['name']}")

    # 4. メモの追加
    new_memo = {
        "topic": "良成親王と菊池武朝の絆",
        "content": "衰退期の九州南朝を支えた若きコンビ。12歳で家督を継いだ武朝は、本拠地を失ってもなお良成親王への忠節を尽くし、筑後矢部の険しい山中で共に南朝の灯を守り続けた。この絆は後世まで『忠臣』の鑑として語り継がれている。",
        "timestamp": "2026-03-09 10:00:00"
    }
    
    if 'memos' not in data:
        data['memos'] = []
    data['memos'].append(new_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("全データの更新が完了しました。")

if __name__ == "__main__":
    update_data()
