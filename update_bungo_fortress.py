import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_bungo_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 今川義範の追加
    yoshinori_imagawa = {
        "name": "今川義範 (いまがわ よしのり)",
        "faction": "北朝 (室町幕府)",
        "role": "九州探題嫡男・豊後高崎山城主",
        "unit_stats": {
            "type": "若武者",
            "hp": 85,
            "atk": 24,
            "def": 26,
            "mov": 3,
            "rng": 1
        },
        "special_skill": "高崎山の不落 (拠点「高崎山城」にいる際、毎ターンHPを15%回復)",
        "relationships": [
            {
                "target": "今川了俊",
                "type": "父子・信頼",
                "score": 100,
                "description": "父の戦略の要として豊後を死守する。"
            },
            {
                "target": "大友氏時",
                "type": "共闘",
                "score": 90,
                "description": "豊後の防衛を共に担う。"
            }
        ],
        "actions": [
            "1371年、父に先んじて豊後高崎山城へ入城。",
            "菊池武政ら南朝軍による半年間・100回超の猛攻を耐え抜く。",
            "この死守が、今川軍の大宰府奪還の決定打となった。"
        ],
        "stats_hint": "驚異的な粘り強さを持つ防衛特化ユニット。"
    }

    # 2. 高崎山城の追加
    takasakiyama = {
        "name": "高崎山城 (たかさきやまじょう)",
        "coords": {
            "q": 5,
            "r": -1
        },
        "terrain": "峻険な要塞",
        "bonus": {
            "def": 20,
            "recovery": 10,
            "siege_resistance": 50
        },
        "description": "豊後の要衝。南朝全盛期において北朝方が死守し続けた不落の拠点。"
    }

    # 3. イベント「高崎山城の攻防」の追加
    takasakiyama_battle = {
        "year": 1371,
        "name": "高崎山城の攻防",
        "impact": "北朝軍の士気上昇、南朝軍の消耗",
        "description": "今川義範が立てこもる高崎山城に対し、南朝軍が100回以上の攻撃を仕掛けるも失敗。九州平定の転換点となった。"
    }

    # 重複チェックして追加
    if 'figures' not in data: data['figures'] = []
    if not any(f['name'] == yoshinori_imagawa['name'] for f in data['figures']):
        data['figures'].append(yoshinori_imagawa)
        print(f"追加: {yoshinori_imagawa['name']}")

    if 'key_locations' not in data: data['key_locations'] = []
    if not any(l['name'] == takasakiyama['name'] for l in data['key_locations']):
        data['key_locations'].append(takasakiyama)
        print(f"追加地点: {takasakiyama['name']}")

    if 'events' not in data: data['events'] = []
    if not any(e['name'] == takasakiyama_battle['name'] for e in data['events']):
        data['events'].append(takasakiyama_battle)
        print(f"追加事件: {takasakiyama_battle['name']}")

    # 4. 大友氏時のアップデート
    for fig in data['figures']:
        if "大友氏時" in fig['name']:
            if "高崎山城" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("高崎山城に籠城し、今川義範と共に南朝軍の猛攻を退けた。")
                print(f"更新: {fig['name']} の行動記録に高崎山城籠城を追記")

    # 5. メモの追加
    bungo_memo = {
        "topic": "豊後・高崎山城の戦略的価値",
        "content": "九州の大部分が南朝（征西府）の手にある中、豊後の高崎山城は北朝方が死守した唯一の希望であった。今川了俊はこの城を反撃の橋頭堡とし、息子の義範を配置して死守させた。ここが落ちなかったことが、後の大宰府奪還と南朝衰退を決定づけた。",
        "timestamp": "2026-03-09 13:00:00"
    }
    if 'memos' not in data: data['memos'] = []
    data['memos'].append(bungo_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("豊後・高崎山城に関するデータの反映が完了しました。")

if __name__ == "__main__":
    update_bungo_data()
