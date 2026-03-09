import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_ouchi_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 大内義弘の追加
    yoshihiro_ouchi = {
        "name": "大内義弘 (おおうち よしひろ)",
        "faction": "北朝 (室町幕府・大内氏)",
        "role": "周防・長門守護、九州探題軍主力",
        "unit_stats": {
            "type": "重装指揮官",
            "hp": 95,
            "atk": 32,
            "def": 25,
            "mov": 4,
            "rng": 1
        },
        "special_skill": "西国の覇者 (周囲3マスの味方「北朝」ユニットのATK+10)",
        "relationships": [
            {
                "target": "今川了俊",
                "type": "盟友・協力",
                "score": 90,
                "description": "了俊の九州下向を強力に支援し、各地を転戦。"
            },
            {
                "target": "足利義満",
                "type": "反旗 (後に絶縁)",
                "score": -100,
                "description": "恩賞への不満と不信感から、応永の乱を引き起こす。"
            }
        ],
        "actions": [
            "1372年、今川了俊と共に大宰府を奪還。",
            "九州探題軍の主力として菊池氏・少弐氏を圧倒。",
            "1399年、足利義満に反旗を翻し、堺にて戦死（応永の乱）。"
        ],
        "stats_hint": "圧倒的な軍事力を誇る北朝方の最強ユニット。"
    }

    # figuresに追加
    existing_figures = [f['name'] for f in data.get('figures', [])]
    if yoshihiro_ouchi['name'] not in existing_figures:
        data['figures'].append(yoshihiro_ouchi)
        print(f"追加: {yoshihiro_ouchi['name']}")

    # 2. 今川了俊のデータを更新（大内義弘との関係追加）
    for fig in data.get('figures', []):
        if "今川了俊" in fig['name']:
            rel_exists = any(rel['target'] == "大内義弘" for rel in fig.get('relationships', []))
            if not rel_exists:
                if 'relationships' not in fig:
                    fig['relationships'] = []
                fig['relationships'].append({
                    "target": "大内義弘",
                    "type": "最強の盟友",
                    "score": 90,
                    "description": "軍事・補給の両面で探題軍を支える最大の協力者。"
                })
                print(f"更新: {fig['name']} の関係性に 大内義弘 を追加")

    # 3. イベント「応永の乱」の追加
    ouei_rebellion = {
        "year": 1399,
        "name": "応永の乱",
        "impact": "大内義弘の戦死、大内氏の勢力一時後退",
        "description": "九州平定の功臣・大内義弘が足利義満に反旗を翻した大規模な反乱。義弘の戦死により、九州探題を支えた最強の武力が失われた。"
    }
    if 'events' not in data: data['events'] = []
    if not any(e['name'] == ouei_rebellion['name'] for e in data['events']):
        data['events'].append(ouei_rebellion)
        print(f"追加事件: {ouei_rebellion['name']}")

    # 4. メモの追加
    ouchi_memo = {
        "topic": "大内氏の九州進出と今川了俊の失脚",
        "content": "今川了俊の九州平定は大内氏の強力な支援なしには成し得なかった。しかし、その功績が大きすぎたことが将軍・足利義満の猜疑心を呼び、了俊の解任と大内義弘の討伐（応永の乱）へと繋がった。九州の安定は皮肉にも、功臣たちの排除によってもたらされた側面がある。",
        "timestamp": "2026-03-09 17:00:00"
    }
    if 'memos' not in data: data['memos'] = []
    data['memos'].append(ouchi_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("大内氏に関するデータの反映が完了しました。")

if __name__ == "__main__":
    update_ouchi_data()
