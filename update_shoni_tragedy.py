import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_shoni_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 少弐冬資の追加
    fuyusuke_shoni = {
        "name": "少弐冬資 (しょうに ふゆすけ)",
        "faction": "北朝 (幕府) -> 反探題勢力",
        "role": "筑前守護・少弐氏当主",
        "unit_stats": {
            "type": "守護武士",
            "hp": 80,
            "atk": 22,
            "def": 20,
            "mov": 4,
            "rng": 1
        },
        "special_skill": "不屈の執念 (撤退時、周囲の味方の士気が下がらない)",
        "relationships": [
            {
                "target": "今川了俊",
                "type": "被害者・怨恨",
                "score": -100,
                "description": "水島の変で誘い出され、謀殺される。"
            },
            {
                "target": "島津氏久",
                "type": "盟友",
                "score": 80,
                "description": "了俊への反感で一致する。"
            }
        ],
        "actions": [
            "父・頼尚の跡を継ぎ、少弐氏を守るために奔走。",
            "1375年、水島の陣中で今川了俊により暗殺される。",
            "この暗殺（水島の変）が、九州国人衆の了俊離反の引き金となった。"
        ],
        "stats_hint": "悲劇の当主。彼の死は陣営に大きな混乱と変化をもたらす。"
    }

    # 2. 龍造寺隆信の追加（将来的な下剋上の象徴として）
    takanobu_ryuzoji = {
        "name": "龍造寺隆信 (りゅうぞうじ たかのぶ)",
        "faction": "肥前独立勢力 (下剋上)",
        "role": "肥前の熊・龍造寺氏当主",
        "unit_stats": {
            "type": "狂戦士",
            "hp": 110,
            "atk": 40,
            "def": 18,
            "mov": 4,
            "rng": 1
        },
        "special_skill": "五州太守の威圧 (隣接する敵「少弐」ユニットのATKを半減させる)",
        "relationships": [
            {
                "target": "少弐冬尚",
                "type": "下剋上",
                "score": -100,
                "description": "主家である少弐氏を最終的に滅ぼす。"
            }
        ],
        "actions": [
            "少弐氏の被官から台頭し、肥前を統一。",
            "圧倒的な武力で『肥前の熊』と恐れられる。",
            "1559年、少弐氏を完全に滅亡させた。"
        ],
        "stats_hint": "圧倒的な攻撃力を持つ、時代を超えた怪物ユニット。"
    }

    # figuresに追加（重複チェック）
    existing_figures = [f['name'] for f in data.get('figures', [])]
    if fuyusuke_shoni['name'] not in existing_figures:
        data['figures'].append(fuyusuke_shoni)
        print(f"追加: {fuyusuke_shoni['name']}")
    if takanobu_ryuzoji['name'] not in existing_figures:
        data['figures'].append(takanobu_ryuzoji)
        print(f"追加: {takanobu_ryuzoji['name']}")

    # 3. 少弐頼尚のデータを更新（筑後川の戦いの詳細追加）
    for fig in data.get('figures', []):
        if "少弐頼尚" in fig['name']:
            if "大敗" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("筑後川（大保原）の戦いで菊池軍に大敗し、大宰府を失う。")
                print(f"更新: {fig['name']} の行動記録に筑後川の大敗を追記")

    # 4. メモの追加
    shoni_memo = {
        "topic": "名門・少弐氏の没落と下剋上の萌芽",
        "content": "鎌倉以来の九州の重鎮であった少弐氏は、南北朝時代の筑後川の戦いで致命的な打撃を受け、さらに今川了俊による少弐冬資暗殺（水島の変）によって幕府との関係を決定的に悪化させた。この衰退の隙を突いて家臣の龍造寺氏が台頭し、後の下剋上へと繋がっていく。",
        "timestamp": "2026-03-09 14:00:00"
    }
    if 'memos' not in data: data['memos'] = []
    data['memos'].append(shoni_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("少弐氏に関するデータの反映が完了しました。")

if __name__ == "__main__":
    update_shoni_data()
