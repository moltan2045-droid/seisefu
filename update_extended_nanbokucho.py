import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_extended_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 五条良成の追加
    yoshinari_gojo = {
        "name": "五条良成 (ごじょう よしなり)",
        "faction": "南朝 (征西府)",
        "role": "征西府執事・筑後守護代",
        "unit_stats": {
            "type": "文官武将",
            "hp": 70,
            "atk": 15,
            "def": 25,
            "mov": 3,
            "rng": 1
        },
        "special_skill": "矢部の守護 (拠点「矢部」にいる際、周囲2マスの味方のDEF+20)",
        "relationships": [
            {
                "target": "良成親王",
                "type": "忠節",
                "score": 100,
                "description": "親王を矢部に迎え入れ、最期まで守り抜く。"
            }
        ],
        "actions": [
            "懐良親王・良成親王の二代に仕える忠臣。",
            "大保原の戦いなど主要な合戦に従軍。",
            "南北朝合一後も、矢部の地で親王を奉じ続けた。"
        ],
        "stats_hint": "拠点防衛に特化したサポートユニット。"
    }

    # 2. 名和顕興の追加
    akioki_nawa = {
        "name": "名和顕興 (なわ あきおき)",
        "faction": "南朝 (征西府)",
        "role": "肥後八代城主・伯耆守",
        "unit_stats": {
            "type": "重装歩兵",
            "hp": 85,
            "atk": 25,
            "def": 22,
            "mov": 3,
            "rng": 1
        },
        "special_skill": "名和の帆印 (海・川などの水辺タイルでATK+10)",
        "relationships": [
            {
                "target": "良成親王",
                "type": "主従",
                "score": 90,
                "description": "八代を拠点に親王を支える南朝の重鎮。"
            },
            {
                "target": "今川了俊",
                "type": "敵対",
                "score": -80,
                "description": "八代城を巡る激戦を繰り広げる。"
            }
        ],
        "actions": [
            "名和長年の末裔として南朝に尽くす。",
            "1391年に八代城を包囲され、激戦の末に今川了俊へ降伏。"
        ],
        "stats_hint": "水辺での戦闘に強く、粘り強い防御を誇る。"
    }

    # figuresに追加（重複チェック）
    existing_figures = [f['name'] for f in data.get('figures', [])]
    if yoshinari_gojo['name'] not in existing_figures:
        data['figures'].append(yoshinari_gojo)
        print(f"追加: {yoshinari_gojo['name']}")
    if akioki_nawa['name'] not in existing_figures:
        data['figures'].append(akioki_nawa)
        print(f"追加: {akioki_nawa['name']}")

    # 3. イベント「水島の変」の追加
    mizushima_event = {
        "year": 1375,
        "name": "水島の変",
        "impact": "島津氏が離反し南朝へ一時接近、北朝軍の混乱",
        "description": "今川了俊が会戦の場で少弐冬資を謀殺。これに激怒した島津氏久らが離反し、九州の戦況が一時的に南朝方へ傾いた。"
    }
    if 'events' not in data:
        data['events'] = []
    if not any(e['name'] == mizushima_event['name'] for e in data['events']):
        data['events'].append(mizushima_event)
        print(f"追加事件: {mizushima_event['name']}")

    # 4. 今川了俊のデータを更新（外交権奪取の記述）
    for fig in data.get('figures', []):
        if "今川了俊" in fig['name']:
            if "外交権" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("明・高麗との外交ルートを遮断・奪取し、南朝の経済基盤を崩壊させた。")
                print(f"更新: {fig['name']} の行動記録に外交権奪取を追記")

    # 5. メモの追加
    diplomacy_memo = {
        "topic": "九州南朝の外交権と終焉",
        "content": "懐良親王が獲得した『日本国王』の地位と明との貿易利権は、良成親王の代に今川了俊によって組織的に奪われた。軍事力だけでなく経済・外交基盤を失ったことが、征西府崩壊の決定打となった。",
        "timestamp": "2026-03-09 11:00:00"
    }
    if 'memos' not in data:
        data['memos'] = []
    data['memos'].append(diplomacy_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("全データの反映が完了しました。")

if __name__ == "__main__":
    update_extended_data()
