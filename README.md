# privacy_notice

初回アクセス時に、プライバシーについてのお知らせをモーダルで一度だけ表示するスクリプトです。
Resource Timing API で、このページを読み込んだときに実際に通信した外部のドメインを調べ、見つかればその一覧を表示します。
あわせて、外部通信を避けたい人向けに、ブラウザで JavaScript を無効にする手順も案内します。

古いブラウザ(IE など)でも動くよう、ES5 の構文だけで書いています。

## 使い方

```html
<script>
  window.PusyuuPrivacyNoticeConfig = {
    serviceName: "プシューサービス",   // 省略時は一般論の文章になる
    fundingNote: '広告についての方針は<a href="https://example.com/rules" target="_blank">こちら</a>をご覧ください。'
  };
</script>
<script src="privacy_notice.js"></script>
```

- 設定は `window.PusyuuPrivacyNoticeConfig` で渡します。サービス名や URL はスクリプトの中に持たず、すべて設定から受け取ります
- `window.PusyuuPrivacyNotice.resetDismissed()` で「表示済み」の記録を消し、`showAutoNotice()` で手動表示できます

設定項目の詳細は、ファイル冒頭のコメントにまとめてあります。

## ライセンス

[MIT License](LICENSE) © 2026 ISAMI ABE
