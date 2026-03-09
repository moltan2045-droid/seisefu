import json
import os

file_path = 'kyushu_nanbokucho_data.json'

def update_shimazu_data():
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 島津元久の追加
    motohisa_shimazu = {
        "name": "島津元久 (しまづ もとひさ)",
        "faction": "薩摩守護 (独立・幕府帰順)",
        "role": "島津氏第7代当主・薩摩大隅守護",
        "unit_stats": {
            "type": "政治家武将",
            "hp": 80,
            "atk": 22,
            "def": 24,
            "mov": 3,
            "rng": 1
        },
        "special_skill": "探題解任の工作 (隣接する敵「北朝・幕府」指揮官の全ステータス-10)",
        "relationships": [
            {
                "target": "今川了俊",
                "type": "政敵・追放",
                "score": -100,
                "description": "父の代からの恨みを晴らし、了俊を失脚させる。"
            },
            {
                "target": "足利義満",
                "type": "提携",
                "score": 85,
                "description": "中央政府と結びつき、九州での地位を盤石にする。"
            }
        ],
        "actions": [
            "父・氏久の遺志を継ぎ、反今川了俊の急先鋒となる。",
            "幕府中央へ了俊の独走を訴え、九州探題解任への流れを作る。",
            "了俊失脚後、薩摩・大隅・日向の守護職を確立。"
        ],
        "stats_hint": "政治・外交に長けたユニット。幕府方の指揮官を無効化する能力を持つ。"
    }

    # 2. 島津氏久のデータを更新（水島の変による激化）
    found_ujihisa = False
    for fig in data.get('figures', []):
        if "島津氏久" in fig['name']:
            found_ujihisa = True
            # AIタイプを「機会主義者」に修正
            fig['ai_archetype'] = "opportunist"
            # 了俊との関係を悪化
            for rel in fig.get('relationships', []):
                if rel['target'] == "今川了俊":
                    rel['type'] = "不倶戴天 (水島の変)"
                    rel['score'] = -100
                    rel['description'] = "水島の変での卑劣な謀殺に激怒し、徹底抗戦を誓う。"
            
            # 良成親王との関係を追加
            rel_with_yoshinari = any(rel['target'] == "良成親王" for rel in fig.get('relationships', []))
            if not rel_with_yoshinari:
                if 'relationships' not in fig:
                    fig['relationships'] = []
                fig['relationships'].append({
                    "target": "良成親王",
                    "type": "戦略的提携",
                    "score": 60,
                    "description": "共通の敵・今川了俊に対抗するため一時的に結ぶ。"
                })
            
            # 行動記録の追加
            if "水島の変" not in fig.get('actions', [""])[-1]:
                fig['actions'].append("水島の変後、今川了俊を『日本一の不義者』と糾弾し、南朝へ一時帰順。")
            print(f"更新: {fig['name']} のデータ（水島の変対応）")

    # figuresに追加（重複チェック）
    existing_figures = [f['name'] for f in data.get('figures', [])]
    if motohisa_shimazu['name'] not in existing_figures:
        data['figures'].append(motohisa_shimazu)
        print(f"追加: {motohisa_shimazu['name']}")

    # 3. メモの追加
    shimazu_strategy_memo = {
        "topic": "島津氏の『全方位・自立』外交戦略",
        "content": "南北朝時代の島津氏は、中央のイデオロギーよりも『島津の独立』を最優先した。今川了俊という強大な中央権力に対し、ある時は南朝（良成親王）と結び、ある時は幕府（足利義満）と直接交渉することで、了俊を失脚させ、九州における守護としての絶対的地位を築き上げた。",
        "timestamp": "2026-03-09 12:00:00"
    }
    if 'memos' not in data:
        data['memos'] = []
    data['memos'].append(shimazu_strategy_memo)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("島津一族に関するデータの反映が完了しました。")

if __name__ == "__main__":
    update_shimazu_data()
