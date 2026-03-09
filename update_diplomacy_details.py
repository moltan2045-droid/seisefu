import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_diplomacy_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 懐良親王のデータを更新（日本国王の権威を強化）
    for fig in data.get('figures', []):
        if "懐良親王" in fig['name']:
            fig['special_skill'] = "日本国王の金印 (全味方のATK/DEF+15、外交貿易による資金潤沢)"
            if "冊封" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("1371年、明の洪武帝より『日本国王』として冊封を受ける。")
                fig['actions'].append("倭寇を鎮圧し捕虜を明に送還、朝貢貿易の独占権を確立。")
                print(f"更新: {fig['name']} の外交的権威を強化")

    # 2. 今川了俊のデータを更新（外交権奪取のスキル追加）
    for fig in data.get('figures', []):
        if "今川了俊" in fig['name']:
            fig['special_skill'] = "探題の工作・外交遮断 (隣接する敵の移動を封じ、敵軍の貿易バフを無効化する)"
            if "高麗" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("明や高麗と独自に交渉し、征西府の外交的正当性を組織的に剥奪。")
                print(f"更新: {fig['name']} に外交遮断能力を追加")

    # 3. イベント「日本国王冊封」の追加
    investiture_event = {
        "year": 1371,
        "name": "日本国王冊封 (懐良親王の外交的絶頂)",
        "impact": "南朝軍の全ステータス大幅上昇、北朝軍の外交的孤立",
        "description": "明の使節が九州へ至り、懐良親王を『日本国王』に封じた。これにより九州南朝は国際的な正統性を得て、対明貿易による莫大な富を手にした。"
    }
    if 'events' not in data: data['events'] = []
    if not any(e['name'] == investiture_event['name'] for e in data['events']):
        data['events'].append(investiture_event)
        print(f"追加事件: {investiture_event['name']}")

    # 4. メモの追加
    wako_memo = {
        "topic": "倭寇鎮圧と日明外交の起源",
        "content": "九州南北朝の争いは、明（中国）にとっては倭寇鎮圧を求める交渉相手の選別でもあった。懐良親王がこれに応じたことで『日本国王』の称号を得たが、今川了俊が軍事と外交の両面でこれを奪取した。この枠組みが、後の足利義満による勘合貿易の直接の原型となった。",
        "timestamp": "2026-03-09 16:00:00"
    }
    if 'memos' not in data: data['memos'] = []
    data['memos'].append(wako_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("日明外交に関する詳細データの反映が完了しました。")

if __name__ == "__main__":
    update_diplomacy_data()
