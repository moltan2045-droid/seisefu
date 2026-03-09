import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_chikugo_battle_details():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. イベント「筑後川の戦い」の詳細化
    for ev in data.get('events', []):
        if "筑後川の戦い" in ev['name']:
            ev['name'] = "筑後川の戦い (大保原の合戦)"
            ev['impact'] = "南朝軍のATK一時上昇、北朝軍の退却、九州全土の覇権掌握"
            ev['description'] = "1359年、南北両軍合わせて約10万騎が激突した九州最大の決戦。16時間に及ぶ死闘の末、菊池武光率いる南朝軍が勝利。懐良親王自らも剣を振るい3箇所の傷を負う激戦であった。"

    # 2. 地点「大刀洗」の追加
    tachiarai = {
        "name": "大刀洗 (たちあらい)",
        "coords": {
            "q": 3,
            "r": 0
        },
        "terrain": "河畔",
        "bonus": {
            "recovery": 20,
            "morale_boost": 15
        },
        "description": "筑後川の戦いの後、菊池武光が血まみれの太刀を洗った地。南朝軍の勝利と休息の象徴。"
    }
    if 'key_locations' not in data: data['key_locations'] = []
    if not any(l['name'] == tachiarai['name'] for l in data['key_locations']):
        data['key_locations'].append(tachiarai)
        print(f"追加地点: {tachiarai['name']}")

    # 3. 人物の更新
    for fig in data.get('figures', []):
        # 懐良親王
        if "懐良親王" in fig['name']:
            if "3箇所の傷" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("筑後川の戦いにて最前線で奮戦し、3箇所の重傷を負いながらも勝利を収める。")
                print(f"更新: {fig['name']} の負傷エピソードを追加")
        
        # 菊池武光
        if "菊池武光" in fig['name']:
            if "大刀洗" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("大保原にて少弐・大友の連合軍を撃破。戦後、大刀洗にて血刀を洗う。")
                print(f"更新: {fig['name']} の戦功と地名の由来を追加")

        # 少弐頼尚
        if "少弐頼尚" in fig['name']:
            if "直資" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("筑後川の戦いで嫡男・少弐直資を失い、大宰府を追われる。")
                print(f"更新: {fig['name']} の敗北と嫡男戦死を追加")

    # 4. メモの追加
    battle_memo = {
        "topic": "日本三大合戦としての筑後川の戦い",
        "content": "筑後川の戦い（大保原の戦い）は、川中島の戦い、関ヶ原の戦いと並び『日本三大合戦』の一つに数えられることもあるほどの大規模な衝突であった。この一戦で九州の勢力図は一変し、征西府による10年以上の九州統治が実現した。",
        "timestamp": "2026-03-09 15:00:00"
    }
    if 'memos' not in data: data['memos'] = []
    data['memos'].append(battle_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("筑後川の戦いに関する詳細データの反映が完了しました。")

if __name__ == "__main__":
    update_chikugo_battle_details()
