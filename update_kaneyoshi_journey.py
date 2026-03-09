import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_journey_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 忽那氏の追加（伊予の水軍）
    kutsuna = {
        "name": "忽那通智 (くつな みちとも)",
        "faction": "南朝 (瀬戸内水軍)",
        "role": "伊予忽那諸島領主",
        "unit_stats": {
            "type": "水軍指揮官",
            "hp": 75,
            "atk": 20,
            "def": 18,
            "mov": 6,
            "rng": 1
        },
        "special_skill": "忽那の水先案内 (海・川タイルでの移動コストを1にする)",
        "relationships": [
            {
                "target": "懐良親王",
                "type": "忠節・庇護",
                "score": 100,
                "description": "伊予での潜伏期間中、親王を全力で支え抜く。"
            }
        ],
        "actions": [
            "吉野を脱出した懐良親王を忽那島に迎え入れる。",
            "親王を薩摩まで送り届け、九州上陸を成功させた。"
        ],
        "stats_hint": "高い機動力を持つ水軍ユニット。海上移動のスペシャリスト。"
    }

    # 2. 谷山隆信の追加（薩摩の支援者）
    taniyama = {
        "name": "谷山隆信 (たにやま たかのぶ)",
        "faction": "南朝 (薩摩)",
        "role": "薩摩国谷山城主",
        "unit_stats": {
            "type": "地方豪族",
            "hp": 80,
            "atk": 22,
            "def": 22,
            "mov": 3,
            "rng": 1
        },
        "special_skill": "谷山の結束 (拠点「谷山城」にいる際、周囲の味方のHP回復量+10)",
        "relationships": [
            {
                "target": "懐良親王",
                "type": "主従",
                "score": 95,
                "description": "九州上陸直後の親王を谷山城に迎え、6年間支える。"
            }
        ],
        "actions": [
            "1342年、薩摩に上陸した懐良親王を谷山城に招く。",
            "南九州における南朝勢力の基盤構築に尽力。"
        ],
        "stats_hint": "地域密着型の防衛ユニット。"
    }

    # figuresに追加
    existing_figures = [f['name'] for f in data.get('figures', [])]
    if kutsuna['name'] not in existing_figures:
        data['figures'].append(kutsuna)
        print(f"追加: {kutsuna['name']}")
    if taniyama['name'] not in existing_figures:
        data['figures'].append(taniyama)
        print(f"追加: {taniyama['name']}")

    # 3. 地点の追加（忽那島、谷山城、宇土津）
    new_locations = [
        {
            "name": "伊予・忽那島 (くつなじま)",
            "coords": {"q": 7, "r": 3},
            "terrain": "島嶼",
            "bonus": {"visibility": -2, "recovery": 15},
            "description": "懐良親王が九州上陸前に3年間潜伏した瀬戸内海の要衝。忽那水軍の本拠地。"
        },
        {
            "name": "薩摩・谷山城 (たにやまじょう)",
            "coords": {"q": 0, "r": -4},
            "terrain": "山城",
            "bonus": {"def": 15, "recovery": 10},
            "description": "懐良親王が九州で最初に拠点を構えた地。ここから南朝の九州経営が始まった。"
        },
        {
            "name": "肥後・宇土津 (うとづ)",
            "coords": {"q": 1, "r": 0},
            "terrain": "港湾",
            "bonus": {"mov_cost": 1},
            "description": "懐良親王が薩摩から肥後へ移動する際に上陸した港。菊池氏との合流点となった。"
        }
    ]
    if 'key_locations' not in data: data['key_locations'] = []
    for loc in new_locations:
        if not any(l['name'] == loc['name'] for l in data['key_locations']):
            data['key_locations'].append(loc)
            print(f"追加地点: {loc['name']}")

    # 4. イベント「九州下向の旅」の追加
    journey_event = {
        "year": 1338,
        "name": "懐良親王の九州下向 (征西の旅立ち)",
        "impact": "南朝軍の遠征開始、瀬戸内・九州の国人衆への影響",
        "description": "後醍醐天皇の命を受け、幼き懐良親王が征西大将軍として吉野を出発。忽那島、薩摩を経て、10年の歳月をかけ肥後の菊池武光と合流した。"
    }
    if 'events' not in data: data['events'] = []
    if not any(e['name'] == journey_event['name'] for e in data['events']):
        data['events'].append(journey_event)
        print(f"追加事件: {journey_event['name']}")

    # 5. 懐良親王のデータを更新（苦難の道のりを追記）
    for fig in data.get('figures', []):
        if "懐良親王" in fig['name']:
            if "忽那島" not in fig.get('actions', [""])[-1]:
                fig['actions'].insert(0, "1339年、伊予忽那島に滞在。父・後醍醐天皇の崩御を島で知る。")
                fig['actions'].insert(1, "1342年、薩摩谷山城に入り、南九州の国人衆を糾合。")
                fig['actions'].insert(2, "1348年、肥後宇土津に上陸。菊池武光と歴史的な合流を果たす。")
                print(f"更新: {fig['name']} の行動記録に下向の旅路を追記")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("懐良親王の九州上陸までのデータ反映が完了しました。")

if __name__ == "__main__":
    update_journey_data()
