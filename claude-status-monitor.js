const https = require('https');

// 環境変数から取得
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const STATUS_API_URL = 'https://status.anthropic.com/api/v2/status.json';

// GitHub Actionsのアーティファクト用ディレクトリ
const fs = require('fs');
const STATUS_FILE = './status_cache.json';

function sendSlackNotification(message, isError = false) {
  const data = JSON.stringify({
    text: message,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }
    ]
  });

  const url = new URL(SLACK_WEBHOOK_URL);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Slack通知送信成功');
          resolve(body);
        } else {
          reject(new Error(`Slack通知失敗: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function checkStatus() {
  return new Promise((resolve, reject) => {
    https.get(STATUS_API_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          const status = JSON.parse(data);
          resolve(status);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function loadPreviousStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('前回のステータス読み込みエラー:', error.message);
  }
  return null;
}

function saveCurrentStatus(status) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.log('ステータス保存エラー:', error.message);
  }
}

async function main() {
  try {
    console.log('Claude Codeステータスチェック開始...');
    
    const currentStatus = await checkStatus();
    const previousStatus = loadPreviousStatus();
    
    const indicator = currentStatus.status.indicator;
    const description = currentStatus.status.description;
    
    console.log(`現在のステータス: ${indicator} - ${description}`);
    
    // ステータスが変化した場合のみ通知
    const statusChanged = !previousStatus || 
                         previousStatus.status.indicator !== indicator;
    
    if (statusChanged) {
      let message = '';
      let isError = false;
      
      if (indicator === 'none') {
        message = `✅ *Claude Code正常稼働中*\n${description}`;
      } else if (indicator === 'minor') {
        message = `⚠️ *Claude Code軽微な問題発生*\n${description}`;
        isError = true;
      } else if (indicator === 'major') {
        message = `🚨 *Claude Code重大な問題発生*\n${description}`;
        isError = true;
      } else if (indicator === 'critical') {
        message = `🔴 *Claude Code深刻な障害発生*\n${description}`;
        isError = true;
      } else {
        message = `ℹ️ *Claude Codeステータス更新*\n${description}`;
      }
      
      message += `\n\n<https://status.anthropic.com/|詳細を確認>`;
      
      await sendSlackNotification(message, isError);
      console.log('通知送信完了');
    } else {
      console.log('ステータス変化なし。通知スキップ。');
    }
    
    // 現在のステータスを保存
    saveCurrentStatus(currentStatus);
    
  } catch (error) {
    console.error('エラー発生:', error.message);
    
    // エラー自体もSlackに通知（オプション）
    try {
      await sendSlackNotification(
        `❌ *Claude Codeステータスチェックエラー*\n${error.message}`,
        true
      );
    } catch (slackError) {
      console.error('Slack通知エラー:', slackError.message);
    }
  }
}

main();