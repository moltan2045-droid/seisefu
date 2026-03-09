import json
import os
import sys
from datetime import datetime

class Color:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class NanbokuchoAdvancedSearch:
    def __init__(self, data_file='kyushu_nanbokucho_data.json'):
        self.data_file = data_file
        self.data = self.load_data()
        self.history = []

    def load_data(self):
        if not os.path.exists(self.data_file):
            print(f"{Color.FAIL}データファイルが見つかりません: {self.data_file}{Color.ENDC}")
            return {}
        with open(self.data_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def save_data(self):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=4)

    def search(self, query):
        results = {
            'figures': [],
            'events': [],
            'locations': []
        }
        query = query.lower()
        
        # 人物検索
        for fig in self.data.get('figures', []):
            if query in fig['name'].lower() or query in fig['role'].lower() or query in fig.get('faction', '').lower():
                results['figures'].append(fig)
        
        # 事件検索
        for ev in self.data.get('events', []):
            if query in ev['name'].lower() or query in ev.get('description', '').lower():
                results['events'].append(ev)

        # 場所検索
        for loc in self.data.get('key_locations', []):
            if query in loc['name'].lower() or query in loc.get('description', '').lower():
                results['locations'].append(loc)
        
        return results

    def display_results(self, results):
        if results['figures']:
            print(f"\n{Color.HEADER}=== 人物 ==={Color.ENDC}")
            for i, fig in enumerate(results['figures'], 1):
                print(f"{i}. {Color.CYAN}{fig['name']}{Color.ENDC} ({fig['role']}) - {fig['faction']}")
        
        if results['events']:
            print(f"\n{Color.HEADER}=== 事件 ==={Color.ENDC}")
            for i, ev in enumerate(results['events'], 1):
                year = ev.get('year', '不明')
                print(f"{i}. {Color.GREEN}{year}年: {ev['name']}{Color.ENDC}")

        if results['locations']:
            print(f"\n{Color.HEADER}=== 地点 ==={Color.ENDC}")
            for i, loc in enumerate(results['locations'], 1):
                print(f"{i}. {Color.BLUE}{loc['name']}{Color.ENDC} ({loc.get('terrain', '不明')})")

    def add_memo(self, topic, memo_text):
        if 'memos' not in self.data:
            self.data['memos'] = []
        
        self.data['memos'].append({
            'topic': topic,
            'content': memo_text,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        self.save_data()
        print(f"{Color.GREEN}メモを保存しました。{Color.ENDC}")

    def show_memos(self):
        if 'memos' not in self.data or not self.data['memos']:
            print("メモはありません。")
            return
        print(f"\n{Color.BOLD}=== 研究メモ一覧 ==={Color.ENDC}")
        for i, m in enumerate(self.data['memos'], 1):
            print(f"{i}. [{m['timestamp']}] {Color.CYAN}{m['topic']}{Color.ENDC}: {m['content']}")

def main():
    searcher = NanbokuchoAdvancedSearch()
    print(f"{Color.BOLD}{Color.HEADER}南北朝・征西府 高度研究ツール v1.0{Color.ENDC}")
    
    while True:
        print("\n[1] 検索  [2] メモ追加  [3] メモ表示  [4] データ更新(仮)  [q] 終了")
        choice = input("選択してください > ").strip().lower()
        
        if choice == '1':
            q = input("検索キーワードを入力 > ").strip()
            if not q: continue
            res = searcher.search(q)
            searcher.display_results(res)
        elif choice == '2':
            topic = input("トピック (例: 筑後川の戦い) > ").strip()
            content = input("内容 > ").strip()
            searcher.add_memo(topic, content)
        elif choice == '3':
            searcher.show_memos()
        elif choice == 'q':
            break
        else:
            print("無効な選択です。")

if __name__ == "__main__":
    main()
