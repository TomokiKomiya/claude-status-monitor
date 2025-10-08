# Claude Code Status Monitor

Claude CodeのステータスをSlackに通知するGitHub Actionsワークフロー

## セットアップ

### 1. Slack Webhook URLの取得

1. [Slack API](https://api.slack.com/apps)にアクセス
2. "Create New App" → "From scratch"
3. アプリ名を入力してワークスペースを選択
4. "Incoming Webhooks"を有効化
5. "Add New Webhook to Workspace"で通知先チャンネルを選択
6. 生成されたWebhook URLをコピー

### 2. GitHubリポジトリの設定

1. このリポジトリの`Settings`に移動
2. `Secrets and variables` → `Actions`を選択
3. `New repository secret`をクリック
4. Name: `SLACK_WEBHOOK_URL`
5. Secret: コピーしたWebhook URLを貼り付け
6. `Add secret`をクリック

### 3. GitHub Actionsを有効化

1. リポジトリの`Actions`タブに移動
2. ワークフローの実行を許可

### 4. 手動テスト

1. `Actions`タブ → `Claude Code Status Monitor`を選択
2. `Run workflow`をクリックして手動実行
3. Slackに通知が届くことを確認

## 動作仕様

- **実行頻度**: 5分ごと
- **通知条件**: ステータスが変化した時のみ通知
- **監視対象**: Anthropic Status API (https://status.anthropic.com/)
- **通知内容**:
  - ✅ 正常稼働中
  - ⚠️ 軽微な問題
  - 🚨 重大な問題
  - 🔴 深刻な障害

## ファイル構成

```
.
├── .github/
│   └── workflows/
│       └── monitor.yml          # GitHub Actionsワークフロー
├── claude-status-monitor.js     # ステータスチェックスクリプト
└── README.md                    # このファイル
```

## トラブルシューティング

### 通知が届かない場合

1. Slack Webhook URLが正しく設定されているか確認
2. GitHub Actionsのログを確認（`Actions`タブ）
3. 手動実行でテスト

### 実行間隔を変更したい場合

`.github/workflows/monitor.yml`の`cron`設定を変更:

```yaml
schedule:
  - cron: '*/10 * * * *'  # 10分ごと
  - cron: '0 * * * *'     # 毎時0分
  - cron: '0 */6 * * *'   # 6時間ごと
```

## ライセンス

MIT