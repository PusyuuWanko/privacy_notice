/*****************************************
  *----------------------------------
  |  ThisScriptVersion: 3.8.0     |
  |  © 2026 By ISAMI ABE          |
  |  LastUpdate: 2026-10-06       |
  |  License: MIT License         |
  |  privacy_notice (ES5 only)    |
----------------------------------*
  IEのような古いブラウザでも動作するよう、意図的にES5構文のみで書く
  (const/let、アロー関数、テンプレートリテラル、デフォルト引数、
  fetch/Promiseは使用しない。組み込み関数が存在しない環境向けに
  Element.prototype.remove 等を必要に応じて注入する)。

  このファイルは2つの機能を、共通のモーダル表示エンジンの上に提供する。

  【機能1: 初回アクセス時の自動お知らせ(プライバシー全般の透明性)】
  「広告ブロッカー対策」ではなく、プライバシー全般についての
  透明性のお知らせを、アクセス時に普通に一度だけ表示する。

  表示内容は固定文言ではなく、Resource Timing API
  (performance.getEntriesByType("resource")) を使って、このページを
  読み込んだ際に実際に自サイト以外のドメイン(オリジン外)へ通信が
  発生したかどうかをチェックし、検出できた場合はその通信先(ホスト名)
  を一覧としてモーダルに表示する。あわせて、そうした外部通信を避けたい
  場合の回避方法として、ブラウザ側でJavaScriptを無効化する手順も
  文中で案内する。

  「なぜ外部通信が発生するのか」を説明する段落は、汎用ライブラリとして
  特定のサービス名を決め打ちしない。既定では「そもそもインターネットとは」
  という一般論(現代のネット社会で無料サービスがどう成り立っているか)を
  説明するだけにとどめ、window.PusyuuPrivacyNoticeConfig.serviceName を
  指定した場合のみ、そのサービス固有の文章(「この○○が無料で使えているのは
  …」)に差し替わる：
    <script>
      window.PusyuuPrivacyNoticeConfig = {
        serviceName: "プシューサービス" // 省略時は一般論の文章になる
      };
    </script>
    <script src="scripts/privacy_notice.js"></script>

  上記の「広告収入でまかなっている」の段落について、もう一段詳しい説明ページ
  (規約・方針ページ等)へのリンクを、機能1の自動お知らせの中にそのまま
  差し込みたい場合は、jsDependency.fallbackNoteと同じ考え方の
  window.PusyuuPrivacyNoticeConfig.fundingNote を使う。JS側は文字列を
  そのまま連結するだけで、サイト固有のURL・文言は一切持たない：
    <script>
      window.PusyuuPrivacyNoticeConfig = {
        fundingNote:
          '広告についての方針は<a href="https://example.com/rules" ' +
          'target="_blank">こちら</a>をご覧ください。'
      };
    </script>
    <script src="scripts/privacy_notice.js"></script>
  (トリガー用のaタグを別の場所に追加で置く必要はない。fundingNoteに
  書いたHTML文字列がそのまま機能1のモーダル本文に含まれるので、
  pusyuu-notice-overlay内だけで完結する。なお、bodyHtmlを指定して
  本文を丸ごと差し替えた場合は、serviceNameやjsDependencyの自動反映と
  同様にfundingNoteも無視される(その場合はconsole.warnで知らせる)。

  【既知の制約】fundingNoteやjsDependency.fallbackNoteの中で
  data-pusyuu-notice-embed を使うと、機能1の自動お知らせが既に
  pusyuu-notice-overlay(id)を開いた状態になっているため、showModal()冒頭の
  「既に表示中なら何もしない」ガード(document.getElementById(
  "pusyuu-notice-overlay")のチェック)に阻まれ、クリックしても新しい
  iframeモーダルが開かない(コンソールにも何も出ない)。機能1の中で
  外部ページへ導線を張りたい場合は、上記の例のように data-pusyuu-notice-embed
  を使わず、target="_blank" 等の普通のaタグにすること。
  (data-pusyuu-notice-embed 自体は、機能1のモーダルが開いていない状態で
  クリックする分には正常に動く。)

  表示するかどうかはlocalStorage（使えない環境ではcookie）に保存した
  フラグで判断する。一度閉じたら、フラグをクリアしない限り再表示しない。
  そのため「前に一度閉じたブラウザ・端末で試している」場合は、それが
  正しい理由で(仕様どおり)表示されない。動作確認の際は下記の
  【デバッグ用】のAPIでフラグを消してから再読み込みすること。

  【機能2: 任意の場所に置いたaタグから開く汎用お知らせモーダル】
  ページ内のどこにでも、次のように data-pusyuu-notice 属性を付けた
  aタグを置くと、クリック時に対応する内容のモーダルを表示できる
  (自動表示とは違い、一度閉じても次回また開ける。localStorageのフラグは
  使わない)。

    <a href="#" data-pusyuu-notice="js-dependency">JS依存について</a>

  data-pusyuu-notice の値は「プリセット名」で、標準では以下を内蔵している：
    - "js-dependency" : このページがどの程度JavaScriptに依存しているか、
                         JSを無効化した場合どうなるか、についての説明

  JS依存の度合いはサイト・ページによってバラバラ(このpusyuusystemのように
  作り込んだページもあれば、pipsのliteページのようにJS無しでも動くよう
  意図的に作られたページもある)なので、"js-dependency"プリセットの本文は
  「このサイトは強く依存している」のように決め打ちにはせず、ページごとに
  次の設定で実情を渡す形にしている(未設定の場合は「まだ設定されていません」
  と正直に表示するだけで、依存度を勝手に決めつけない)：
    <script>
      window.PusyuuPrivacyNoticeConfig = {
        jsDependency: {
          level: "high", // "none" | "low" | "medium" | "high"
          brokenFeatures: ["メニューの開閉", "ページ送り(通信を伴う一覧取得)"], // 省略可
          fallbackNote: "任意の補足文(HTML可、省略可)"
        }
      };
    </script>
    <script src="scripts/privacy_notice.js"></script>

  この jsDependency 設定(level・brokenFeatures・fallbackNote)は
  "js-dependency"プリセットだけでなく、機能1の自動お知らせの中の
  JS無効化についての一文にも反映される(そのページに
  data-pusyuu-notice="js-dependency" のトリガーを置いていなくても、
  自動お知らせの方で見える)。

  プリセットを増やしたい／内容を丸ごと変えたい場合は、このscriptタグより前に
  window.PusyuuPrivacyNoticeConfig.presets を定義する(具体例：広告についての
  方針を説明する"ad-policy"という独自プリセットを追加する場合)：
    <script>
      window.PusyuuPrivacyNoticeConfig = {
        presets: {
          "ad-policy": {
            title: "広告についての方針",
            bodyHtml:
              "<p>本サービスはサーバー・ドメインの維持費を賄うため、" +
              "一部のページでGoogle AdSenseによる広告を表示しています。</p>" +
              "<p>詳しくは<a href=\"" + PUSYUU_PRIVACY_NOTICE_MAIN_BASE + "/rules/privacypolicy\" " +
              "target=\"_blank\">プライバシーポリシー</a>をご覧ください。</p>"
          }
        }
      };
    </script>
    <script src="scripts/privacy_notice.js"></script>

  上記のように追加したプリセットは、他のプリセットと同じように
  data-pusyuu-notice="ad-policy" を付けたaタグから開ける：
    <a href="#" data-pusyuu-notice="ad-policy">広告について</a>

  1個のaタグだけ内容を変えたい場合は、プリセットを増やさずに
  aタグ側の属性で直接上書きすることもできる：
    <a href="#" data-pusyuu-notice="js-dependency"
       data-title="上書き用タイトル"
       data-body-html="<p>上書き用の本文HTML</p>">JS依存について</a>

  【機能2': /rules 配下などに既にある"実際のページ"をそのままモーダルに
  埋め込んで表示したい場合】
  プリセットとしてJS側に文面を二重に書きたくない場合は、
  data-pusyuu-notice-embed 属性を使う。aタグのhrefに指定した実ページを
  iframeでモーダルに埋め込んで表示するので、文面はそのページ側だけに
  存在すればよい。JSが無効な環境では、モーダルは開かずhrefへの通常の
  リンク遷移がそのままフォールバックになる：
    <a href="../rules/javascript/" data-pusyuu-notice-embed>
      JavaScriptの取り扱いについて
    </a>
  タイトルは data-title が無ければ、aタグ自身のテキスト(上記例では
  「JavaScriptの取り扱いについて」)がそのまま使われる。

  data-pusyuu-notice(対応するプリセット無し)・data-pusyuu-notice-embed
  (hrefなし)・data-body-html のいずれの指定も成立しないaタグは、
  コンソールに開発者向けエラーを出すだけでクリックは無視し、通常の
  リンク遷移(href)をそのまま許可する(JS側の設定ミスでページ遷移
  自体を壊さないための配慮)。

  【カスタマイズ(共通・全部盛りの実例)】
  このscriptタグより前に window.PusyuuPrivacyNoticeConfig を定義すると
  文言や挙動を上書きできる。指定できる項目を全部使うとこうなる
  (実際にこのサイトのトップページ(main/index.php)で使っている設定に近い例)：
    <script>
      window.PusyuuPrivacyNoticeConfig = {
        // ---- 機能1(初回アクセス時の自動お知らせ)のカスタマイズ ----
        title: "アクセスありがとうございます（プライバシーに関するお知らせ）",
        // bodyHtml: "<p>...</p>", // 本文を丸ごと差し替えたい場合のみ指定(指定すると下のserviceNameは使われなくなる)
        serviceName: "プシューサービス", // 省略時は特定サービス名を出さず一般論の文章になる
        fundingNote: // 「広告収入でまかなっている」の段落末尾に差し込む任意の補足(省略可)
          '広告についての方針は<a href="' + PUSYUU_PRIVACY_NOTICE_MAIN_BASE + '/rules" ' +
          'target="_blank">こちら</a>をご覧ください。',
        closeButtonText: "わかりました（閉じる）",
        hostsIntroText: "このページ読み込み時に検出した外部の通信先：",
        hostsNoneText: "このページ読み込み時には、外部への通信は検出されませんでした。",
        checkDelay: 1500,   // load後、検出確定までの待ち時間(ms)。既定1500
        maxHostDisplay: 10, // 検出したホスト名を一覧表示する最大件数。既定10
        storageKey: "pusyuu_privacy_notice_dismissed", // 表示済みフラグの保存キー名

        // ---- "js-dependency"プリセット(機能2)のカスタマイズ ----
        jsDependency: {
          level: "high", // このページの実情に合わせて "none" | "low" | "medium" | "high"
          brokenFeatures: [
            "ハンバーガーメニューの開閉",
            "ページ読み込み時の演出",
            "ページ内のスクロールアニメーション"
          ],
          fallbackNote:
            '詳しい方針は<a href="' + PUSYUU_PRIVACY_NOTICE_MAIN_BASE + '/rules/javascript/" ' +
            'target="_blank">JavaScriptの取り扱いに関する方針</a>をご覧ください。'
            // ↑ jsDependencyのfallbackNoteは機能1の自動お知らせ本文にも
            // 差し込まれる(=既にpusyuu-notice-overlayが開いた状態の中に
            // 現れる)ため、data-pusyuu-notice-embedではなくtarget="_blank"の
            // 通常リンクにしておくこと(理由は上記の【既知の制約】を参照)。
        },

        triggerCloseButtonText: "閉じる" // 機能2(トリガー式のプリセット/埋め込みモーダル)の閉じるボタン文言。
        // 現状このページ(main/index.php)は機能1(自動お知らせ)のfundingNote/
        // jsDependency.fallbackNoteを普通のリンクにしているだけで、
        // data-pusyuu-noticeやdata-pusyuu-notice-embedのトリガーをページ本文に
        // 置いていないため、機能2自体は今のところ使われていない(=この項目も
        // 実質未使用)。ただし設定・コード自体は削除しておらず、今後
        // 「機能2: 任意の場所に置いたaタグから開く汎用お知らせモーダル」
        // (下記参照)を使うトリガーを追加すればすぐ有効になる。
      };
    </script>
    <script src="scripts/privacy_notice.js"></script>

  機能2を使う場合、上記の例に対応するトリガーの置き方はこうなる
  (ページ本文中に自由に置いてよい。下の1〜2行目は"js-dependency"プリセット
  や独自プリセットを使う場合の例で、presetsの設定例は上の【機能2】の
  説明を参照)：
    <a href="#" data-pusyuu-notice="js-dependency">JS依存について</a>
    <a href="../rules/javascript/" data-pusyuu-notice-embed>JavaScriptの取り扱いについて</a>
    (2行目はページ本文に直接置く独立したリンクなので、機能1のモーダルの
    中には無く、data-pusyuu-notice-embedのままで問題ない)

  【デバッグ用】
  機能1は「一度閉じると出なくなる」仕様のため、動作確認のたびに
  シークレットウィンドウを開き直すのは面倒。ブラウザの開発者ツールの
  コンソールから、次の関数を直接呼んで確認できる：
    PusyuuPrivacyNotice.resetDismissed();  // 表示済みフラグを消す(次回アクセスから再度出る)
    PusyuuPrivacyNotice.showAutoNotice();  // CHECK_DELAYを待たず、自動お知らせをその場で試し表示する
******************************************/

// このファイルが置かれている main の根元(末尾の / 無し)。
// このファイルは他のプロダクト(別のドメイン)のページからも読み込まれるので、main の
// ページやファイルを指すときは、このファイル自身が読み込まれた住所から割り出します。
// 【ドメインを書き戻さないこと】以前は https://pusyuuwanko.com を固定していたため、
// IPやLAN、別のドメインから入った人の画面でも公開ドメインへ取りに行っていました。
// IE でも動くよう document.currentScript は使わず、script タグをファイル名で探します。
// 見つからないときは空文字(=そのページのホストの「/」から始まる形)に倒します。
var PUSYUU_PRIVACY_NOTICE_MAIN_BASE = (function () {
  var scripts = document.getElementsByTagName('script');
  var base = '';
  var i, src, at;
  for (i = scripts.length - 1; i >= 0 && base === ''; i--) {
    src = scripts[i].src || '';
    at = src.indexOf('/pusyuusystem/scripts/privacy_notice.js');
    if (at !== -1) {
      base = src.substring(0, at);
    }
  }
  return base;
})();

// ---- 存在しない組み込み関数の注入（ポリフィル） ----
if (typeof Element.prototype.remove !== "function") {
  Element.prototype.remove = function () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

window.addEventListener("DOMContentLoaded", function () {
  var CONFIG = window.PusyuuPrivacyNoticeConfig || {};

  var STORAGE_KEY = CONFIG.storageKey || "pusyuu_privacy_notice_dismissed";
  var CHECK_DELAY = typeof CONFIG.checkDelay === "number" ? CONFIG.checkDelay : 1500; // ページ完全読み込み後、検出結果が出揃うまでの待ち時間(ms)
  var MAX_HOST_DISP = typeof CONFIG.maxHostDisplay === "number" ? CONFIG.maxHostDisplay : 10;

  // ---- JS依存度の設定(自動お知らせ・js-dependencyプリセットで共通利用) ----
  // サイト・ページによってJS依存度は違う(pusyuusystemのように作り込んだ
  // ページもあれば、pipsのliteページのようにJS無しでも動くよう意図的に
  // 作られたページもある)ため、「強く依存している」と決め打ちにせず、
  // window.PusyuuPrivacyNoticeConfig.jsDependency から読む。
  var JS_DEP = CONFIG.jsDependency || {};
  var JS_DEP_SHORT_WARNING = {
    none: "このページはJavaScriptが無効でも大きな支障なく利用できます。",
    low: "このページはJavaScriptへの依存が低いため、無効化しても大部分の機能は使えます。",
    medium: "このページは一部の機能でJavaScriptを使っているため、無効化すると一部の機能が使えなくなります。",
    high: "このページはJavaScriptに強く依存しているため、無効化するとメニューや演出、コンテンツ表示など多くの機能が正常に動かなくなります。"
  };
  function jsDependencyShortWarning() {
    // level に対応する一言に加えて、brokenFeatures(具体的に壊れる機能)と
    // fallbackNote(詳細ページへのリンク等)が設定されていれば、この
    // 自動お知らせの中にもそのままつなげて表示する。
    // (以前はここがlevelの一言だけで、brokenFeatures/fallbackNoteは
    // "js-dependency"プリセット側でしか使われておらず、プリセットを開く
    // トリガーが無いページでは設定しても何も見えなかった。そのため
    // ここでも使うようにした)
    var text = JS_DEP_SHORT_WARNING[JS_DEP.level] ||
      "JavaScriptへの依存度はページによって異なるため、無効化した場合の影響もページごとに変わります" +
      "(このページについては個別に設定されていません)。";

    var broken = JS_DEP.brokenFeatures || [];
    if (broken.length > 0) {
      text += " 具体的には、" + broken.join("・") + "が動作しなくなります。";
    }

    if (JS_DEP.fallbackNote) {
      text += " " + JS_DEP.fallbackNote;
    }

    return text;
  }

  // ---- サービス名の設定(汎用ライブラリとしてサービス固有の名前を決め打ちしない) ----
  // 未指定の場合は、特定のサービス名を出さずに「そもそもインターネットとは」
  // という一般論として、現代のネット社会での無料サービスの成り立ちを説明する。
  // window.PusyuuPrivacyNoticeConfig.serviceName を指定した場合のみ、
  // そのサービス固有の話として文章を差し替える。
  var SERVICE_NAME = CONFIG.serviceName || null;

  // ---- 資金面の段落に差し込む任意の補足(fallbackNoteと同じ考え方) ----
  // サイト固有のURL・文言はJS側に一切持たず、CONFIG側からHTML文字列を
  // そのまま受け取って連結するだけ(汎用性を保つため)。
  var FUNDING_NOTE = "";
  if (typeof CONFIG.fundingNote === "string") {
    FUNDING_NOTE = CONFIG.fundingNote;
  } else if (typeof CONFIG.fundingNote !== "undefined") {
    console.error("開発者の設定ミス：PusyuuPrivacyNoticeConfig.fundingNote は文字列(HTML可)で指定してください。今回は無視します。");
  }
  if (FUNDING_NOTE && CONFIG.bodyHtml) {
    console.warn("PusyuuPrivacyNoticeConfig.bodyHtml を指定すると本文が丸ごと差し替わるため、fundingNote は表示に反映されません(serviceName ／ jsDependency の自動反映も同様です)。");
  }

  function buildFundingParagraph() {
    var extra = FUNDING_NOTE ? (" " + FUNDING_NOTE) : "";
    if (SERVICE_NAME) {
      return '<p>正直な話、この' + SERVICE_NAME + 'が無料で使えているのは、サーバー代・ドメイン代・保守にかかる' +
        '時間を、運営者の自腹＋広告収入でまかなっているからです。それも外部通信が発生する理由のひとつです。' + extra + '</p>';
    }
    return '<p>そもそも「インターネット」というものの多くは、広告収入によって無料のサービスが成り立つ、' +
      'という仕組みの上に築かれています。あなたが日頃使っている無料のWebサービスの多くも、サーバー代や' +
      'ドメイン代、保守にかかる時間を、運営者の持ち出しと広告収入とでまかなっているのが実情です。' +
      'このページで外部通信が発生する理由も、その現代のネット社会に共通する仕組みの延長線上にあります。' + extra + '</p>';
  }

  var TITLE = CONFIG.title || "アクセスありがとうございます（プライバシーに関するお知らせ）";
  var BODY_HTML = CONFIG.bodyHtml ||
    '<p>このサイトは他の多くの現代的なWebサイトと同じく、表示や広告配信のために' +
    '自サイト以外のドメイン(外部/オリジン外)と通信することがあります。' +
    'そこには広告配信や、アクセス解析のようなトラッキング目的の通信が含まれる可能性があります。</p>' +
    '<p>このメッセージは、実際にこのページを読み込んだ際にブラウザが観測した通信先を元に' +
    '表示しています(推測ではありません)。詳しくは下の一覧をご覧ください。</p>' +
    buildFundingParagraph() +
    '<p><strong>外部への通信を一切許可したくない場合は、ブラウザ側でJavaScriptそのものを無効化することで' +
    '防げます。</strong>' + jsDependencyShortWarning() + ' あらかじめご了承ください。</p>' +
    '<ul style="margin:0 0 12px 20px;padding:0;">' +
    '<li>Chrome / Edge：アドレスバーに <code>chrome://settings/content/javascript</code>' +
    '（Edgeは <code>edge://settings/content/javascript</code>）を入力し、JavaScriptを「ブロック」に設定</li>' +
    '<li>Firefox：アドレスバーに <code>about:config</code> と入力し、<code>javascript.enabled</code> を' +
    ' <code>false</code> に変更</li>' +
    '<li>Safari：「設定」→「セキュリティ」タブで「JavaScriptを有効にする」のチェックを外す</li>' +
    '<li>ブラウザ全体ではなくサイト単位で制御したい場合は、NoScriptのような拡張機能を使う方法もあります</li>' +
    '</ul>' +
    '<p style="color:#666;font-size:13px;">正直、こういうポップアップを出すこと自体、こちらとしても気持ちのいい' +
    'ものではありません。ただ、丁寧な作り込みをする余裕がなく、ストレートに書いて出すしかなかった、というのが' +
    '率直な理由です。</p>' +
    '<p style="color:#666;font-size:13px;">技術的な限界についても書いておきます。この一覧は' +
    'ブラウザのResource Timing APIで観測できた通信先を機械的に列挙しているだけで、各通信先が実際に' +
    '何のデータをどう扱っているか(トラッキングの有無など)までは判定できません。また、ページの読み込み' +
    'タイミングによっては、この時点でまだ発生していない外部通信を検出できていない場合もあります。</p>';
  var HOSTS_INTRO_TEXT = CONFIG.hostsIntroText || "このページ読み込み時に検出した外部の通信先：";
  var HOSTS_NONE_TEXT = CONFIG.hostsNoneText || "このページ読み込み時には、外部への通信は検出されませんでした(今後のアクセスや状況によって発生することもあります)。";
  var BTN_CLOSE_TEXT = CONFIG.closeButtonText || "わかりました（閉じる）";
  var TRIGGER_CLOSE_TEXT = CONFIG.triggerCloseButtonText || "閉じる";

  // ---- "js-dependency"プリセットの中身も、JS_DEP(上で読み込み済み)から
  //      決め打ちせずに組み立てる ----
  var JS_DEP_LEVEL_TEXT = {
    none: "このページは基本的にJavaScriptに依存しておらず、無効化していてもほぼそのまま利用できるように作られています。",
    low: "このページはJavaScriptへの依存が低く、無効化していても大部分の機能はそのまま使えます。演出や利便性機能の一部が動かなくなる程度です。",
    medium: "このページは一部の機能でJavaScriptを使っています。無効化していても閲覧や基本的な操作はできますが、一部の機能は使えなくなります。",
    high: "このページはJavaScriptに強く依存しています。無効化すると、多くの機能が正常に動作しなくなります。"
  };
  function buildJsDependencyBodyHtml() {
    var levelText = JS_DEP_LEVEL_TEXT[JS_DEP.level] ||
      "このページのJavaScript依存度については、設置した開発者側でまだ具体的に設定されていません。";
    var html = "<p>" + levelText + "</p>";

    var broken = JS_DEP.brokenFeatures || [];
    if (broken.length > 0) {
      html += "<p>JavaScriptを無効化した場合、具体的には次の機能が動作しなくなります。</p>" +
        '<ul style="margin:0 0 12px 20px;padding:0;">';
      for (var i = 0; i < broken.length; i++) {
        html += "<li>" + broken[i] + "</li>";
      }
      html += "</ul>";
    }

    if (JS_DEP.fallbackNote) {
      html += "<p>" + JS_DEP.fallbackNote + "</p>";
    }

    html += '<p style="color:#666;font-size:13px;">このサイトは、ページやサービスによってJavaScriptへの依存度が' +
      "異なります。この説明は今アクセスしているページについてのものであり、サイト全体で共通のものではありません。" +
      "また、古いブラウザ(IEなど)でもできる限り動作するよう、意図的にES5構文だけで書く・存在しない組み込み関数は" +
      "補う、といった配慮は共通して行っています。</p>";

    return html;
  }

  // ---- data-pusyuu-notice="プリセット名" のaタグから開けるプリセット定義 ----
  var DEFAULT_PRESETS = {
    "js-dependency": {
      title: "このページのJavaScript(JS)依存について",
      bodyHtml: buildJsDependencyBodyHtml()
    }
  };
  var PRESETS = {};
  (function (target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) { target[key] = source[key]; }
    }
  })(PRESETS, DEFAULT_PRESETS);
  if (CONFIG.presets) {
    (function (target, source) {
      for (var key in source) {
        if (source.hasOwnProperty(key)) { target[key] = source[key]; }
      }
    })(PRESETS, CONFIG.presets);
  }

  // ---- 表示済みフラグの読み書き。localStorageが使えない環境ではcookieにフォールバック ----
  function storageGet(key) {
    try {
      if (window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) { /* private mode等で例外になる場合はcookieに切り替える */ }
    var matches = document.cookie.match(new RegExp("(?:^|; )" + key + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : null;
  }
  function storageSet(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) { /* 同上 */ }
    var d = new Date();
    d.setFullYear(d.getFullYear() + 10); // localStorage相当として長期保存扱いにする
    document.cookie = key + "=" + encodeURIComponent(value) + "; expires=" + d.toUTCString() + "; path=/";
  }

  function isDismissed() {
    return storageGet(STORAGE_KEY) === "1";
  }
  function setDismissed() {
    storageSet(STORAGE_KEY, "1");
  }

  // ---- オリジン外(クロスオリジン)通信の検出 ----
  // Resource Timing APIで、このページ読み込み時にブラウザが実際に読み込んだ
  // リソースのURLを調べ、自サイトのホスト名と異なるものを一覧化する。
  function detectCrossOriginHosts() {
    var hosts = [];
    var seen = {};
    try {
      if (typeof performance !== "undefined" && performance.getEntriesByType) {
        var entries = performance.getEntriesByType("resource");
        var a = document.createElement("a"); // hostname取得用(古いブラウザでも動くURLパース手段)
        var selfHost = window.location.hostname;
        for (var i = 0; i < entries.length; i++) {
          a.href = entries[i].name;
          var host = a.hostname;
          if (host && host !== selfHost && !seen[host]) {
            seen[host] = true;
            hosts.push(host);
          }
        }
      }
    } catch (e) { /* 取得できない環境では空リストのまま */ }
    return hosts;
  }

  // ---- モーダル用CSSの注入(汎用エンジン共通) ----
  function injectStyle() {
    var style = document.createElement("style");
    style.type = "text/css";
    style.textContent =
      "#pusyuu-notice-overlay {" +
      "  position: fixed;" +
      "  left: 0; top: 0; right: 0; bottom: 0;" +
      "  background: rgba(0,0,0,0.75);" +
      "  z-index: 999999;" +
      "  display: -ms-flexbox;" +
      "  display: -webkit-box;" +
      "  display: flex;" +
      "  -ms-flex-align: center;" +
      "  -webkit-box-align: center;" +
      "  align-items: center;" +
      "  -ms-flex-pack: center;" +
      "  -webkit-box-pack: center;" +
      "  justify-content: center;" +
      "  padding: 20px;" +
      "  box-sizing: border-box;" +
      "}" +
      "#pusyuu-notice-dialog {" +
      "  position: relative;" +
      "  width: 90%;" +
      "  max-width: 520px;" +
      "  max-height: 85vh;" +
      "  overflow: auto;" +
      "  background: #fff;" +
      "  color: #222;" +
      "  border-radius: 12px;" +
      "  padding: 24px 20px 20px 20px;" +
      "  box-sizing: border-box;" +
      "  box-shadow: 0 10px 40px rgba(0,0,0,0.4);" +
      "  font-size: 15px;" +
      "  line-height: 1.7;" +
      "}" +
      "#pusyuu-notice-dialog h2 {" +
      "  margin: 0 0 12px 0;" +
      "  font-size: 18px;" +
      "  color: #d81f35;" +
      "}" +
      "#pusyuu-notice-dialog p {" +
      "  margin: 0 0 12px 0;" +
      "}" +
      "#pusyuu-notice-close {" +
      "  position: absolute;" +
      "  top: 10px;" +
      "  right: 10px;" +
      "  border: 0;" +
      "  background: transparent;" +
      "  font-size: 18px;" +
      "  line-height: 1;" +
      "  cursor: pointer;" +
      "  padding: 6px;" +
      "  color: #666;" +
      "}" +
      "#pusyuu-notice-hosts {" +
      "  margin: 0 0 12px 0;" +
      "  padding: 10px 12px;" +
      "  background: #f5f5f5;" +
      "  border-radius: 8px;" +
      "  font-size: 13px;" +
      "}" +
      "#pusyuu-notice-hosts p {" +
      "  margin: 0 0 6px 0;" +
      "  font-weight: bold;" +
      "}" +
      "#pusyuu-notice-hosts ul {" +
      "  margin: 0;" +
      "  padding-left: 18px;" +
      "  word-break: break-all;" +
      "}" +
      "#pusyuu-notice-actions {" +
      "  display: -ms-flexbox;" +
      "  display: -webkit-box;" +
      "  display: flex;" +
      "  margin-top: 8px;" +
      "}" +
      "#pusyuu-notice-dismiss {" +
      "  -ms-flex: 1 1 auto;" +
      "  -webkit-box-flex: 1;" +
      "  flex: 1 1 auto;" +
      "  border: 0;" +
      "  border-radius: 8px;" +
      "  padding: 12px 14px;" +
      "  font-size: 14px;" +
      "  cursor: pointer;" +
      "  background: #00aaff;" +
      "  color: #fff;" +
      "}";
    document.head.appendChild(style);
  }

  // ---- モーダル本体の生成(汎用エンジン) ----
  // opts.title : 必須
  // opts.bodyHtml : 本文HTML(opts.iframeSrcを指定した場合は使われない)
  // opts.iframeSrc : 指定すると本文の代わりに実ページをiframeで埋め込む
  // opts.hosts : 配列を渡すと検出ホスト名セクションを表示する(省略可)
  // opts.closeText : 閉じるボタンの文言
  // opts.rememberDismiss : trueならlocalStorageにフラグを立てて以後自動表示しない
  function showModal(opts) {
    if (document.getElementById("pusyuu-notice-overlay")) {
      return; // 既に表示中なら何もしない
    }
    injectStyle();

    var overlay = document.createElement("div");
    overlay.id = "pusyuu-notice-overlay";

    var dialog = document.createElement("div");
    dialog.id = "pusyuu-notice-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    var closeBtn = document.createElement("button");
    closeBtn.id = "pusyuu-notice-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "閉じる");
    closeBtn.textContent = "✕";

    var titleEle = document.createElement("h2");
    titleEle.textContent = opts.title;

    var bodyEle = document.createElement("div");
    if (opts.iframeSrc) {
      // 既存の実ページ(利用規約等と同じ実体)をそのまま埋め込んで表示する。
      // main.jsのフィードバック用iframeと同じ考え方(内容を二重に書かない)。
      dialog.style.maxWidth = "800px";
      var iframe = document.createElement("iframe");
      iframe.src = opts.iframeSrc;
      iframe.style.width = "100%";
      iframe.style.height = "60vh";
      iframe.style.borderWidth = "0";
      iframe.style.borderRadius = "8px";
      bodyEle.appendChild(iframe);
    } else {
      bodyEle.innerHTML = opts.bodyHtml;
    }

    dialog.appendChild(closeBtn);
    dialog.appendChild(titleEle);

    // ---- 検出したホスト名一覧(動的な内容なのでDOM APIで安全に組み立てる) ----
    if (opts.hosts) {
      var hostsWrap = document.createElement("div");
      hostsWrap.id = "pusyuu-notice-hosts";
      var hostsLabel = document.createElement("p");
      if (opts.hosts.length > 0) {
        hostsLabel.textContent = HOSTS_INTRO_TEXT;
        hostsWrap.appendChild(hostsLabel);
        var list = document.createElement("ul");
        var dispCount = Math.min(opts.hosts.length, MAX_HOST_DISP);
        for (var i = 0; i < dispCount; i++) {
          var li = document.createElement("li");
          li.textContent = opts.hosts[i];
          list.appendChild(li);
        }
        if (opts.hosts.length > dispCount) {
          var moreLi = document.createElement("li");
          moreLi.textContent = "ほか " + (opts.hosts.length - dispCount) + " 件";
          list.appendChild(moreLi);
        }
        hostsWrap.appendChild(list);
      } else {
        hostsLabel.textContent = HOSTS_NONE_TEXT;
        hostsWrap.appendChild(hostsLabel);
      }
      dialog.appendChild(hostsWrap);
    }

    dialog.appendChild(bodyEle);

    var actions = document.createElement("div");
    actions.id = "pusyuu-notice-actions";

    var dismissBtn = document.createElement("button");
    dismissBtn.id = "pusyuu-notice-dismiss";
    dismissBtn.type = "button";
    dismissBtn.textContent = opts.closeText;

    function closeModal() {
      if (opts.rememberDismiss) {
        setDismissed();
      }
      overlay.remove();
    }
    closeBtn.addEventListener("click", closeModal);
    dismissBtn.addEventListener("click", closeModal);

    actions.appendChild(dismissBtn);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  // ---- 機能1: 初回アクセス時の自動お知らせ ----
  if (!isDismissed()) {
    var runCheck = function () {
      // 画像や非同期スクリプトなど、遅れて読み込まれるリソースの通信先も
      // なるべく拾えるよう、load後さらに少し待ってから検出結果を確定させる
      setTimeout(function () {
        showModal({
          title: TITLE,
          bodyHtml: BODY_HTML,
          hosts: detectCrossOriginHosts(),
          closeText: BTN_CLOSE_TEXT,
          rememberDismiss: true
        });
      }, CHECK_DELAY);
    };
    if (document.readyState === "complete") {
      runCheck();
    } else {
      window.addEventListener("load", runCheck);
    }
  }

  // ---- 機能2: aタグから開く汎用お知らせ(3通りの指定方法) ----
  // (a) data-pusyuu-notice="プリセット名"   … JS側で用意したプリセット文面を表示
  // (b) data-pusyuu-notice-embed          … aタグ自身のhref(実ページ)をそのまま
  //                                          モーダル内にiframeで埋め込んで表示。
  //                                          文面を二重に書く必要が無く、JS無効時は
  //                                          hrefへの通常のリンク遷移がそのまま
  //                                          フォールバックになる
  //     例: <a href="../rules/javascript/" data-pusyuu-notice-embed>JavaScriptについて</a>
  // (c) data-body-html="<p>...</p>"       … (a)(b)を使わず、その場でHTMLを直接指定
  // タイトルは data-title、無ければ(a)ならプリセットのtitle、それも無ければ
  // aタグ自身のテキストを使う。
  //
  // querySelectorAllで最初に一度だけ探す方式ではなく、documentへの
  // クリックイベント委譲(event delegation)にしている。これは、
  // このモーダル自身のbodyHtml/fallbackNote等の中に書かれた
  // data-pusyuu-notice系のaタグ(=表示された時点で初めてDOMに現れる、
  // ページ読み込み時点ではまだ存在しない要素)でもちゃんと動くようにするため。
  function findTriggerAncestor(ele) {
    while (ele && ele !== document) {
      if (ele.hasAttribute && (
        ele.hasAttribute("data-pusyuu-notice") ||
        ele.hasAttribute("data-pusyuu-notice-embed") ||
        ele.hasAttribute("data-body-html")
      )) {
        return ele;
      }
      ele = ele.parentNode;
    }
    return null;
  }

  // ---- デバッグ用の外部API ----
  // 「一度閉じると出なくなる」仕様のため、テスト中に毎回シークレット
  // ウィンドウを開き直さなくて済むよう、コンソールから直接呼べる関数を
  // 用意しておく。
  //   PusyuuPrivacyNotice.resetDismissed() … 表示済みフラグを消す(次回アクセスから再度出るようになる)
  //   PusyuuPrivacyNotice.showAutoNotice() … CHECK_DELAYを待たず、自動お知らせをその場で試し表示する
  window.PusyuuPrivacyNotice = {
    resetDismissed: function () {
      try {
        if (window.localStorage) { window.localStorage.removeItem(STORAGE_KEY); }
      } catch (e) { /* 何もしない */ }
      document.cookie = STORAGE_KEY + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    },
    showAutoNotice: function () {
      showModal({
        title: TITLE,
        bodyHtml: BODY_HTML,
        hosts: detectCrossOriginHosts(),
        closeText: BTN_CLOSE_TEXT,
        rememberDismiss: true
      });
    }
  };

  document.addEventListener("click", function (event) {
    var triggerEle = findTriggerAncestor(event.target);
    if (!triggerEle) {
      return;
    }

    var presetName = triggerEle.getAttribute("data-pusyuu-notice");
    var preset = presetName ? PRESETS[presetName] : null;
    var bodyHtmlOverride = triggerEle.getAttribute("data-body-html");
    var isEmbed = triggerEle.hasAttribute("data-pusyuu-notice-embed");
    var title = triggerEle.getAttribute("data-title") || (preset && preset.title) || triggerEle.textContent;

    var modalOpts = null;
    if (bodyHtmlOverride) {
      modalOpts = { title: title, bodyHtml: bodyHtmlOverride };
    } else if (isEmbed) {
      var href = triggerEle.getAttribute("href");
      if (href) {
        modalOpts = { title: title, iframeSrc: href };
      } else {
        console.error("開発者の設定ミス：data-pusyuu-notice-embed を付けたaタグにhrefがありません。");
      }
    } else if (preset) {
      modalOpts = { title: title, bodyHtml: preset.bodyHtml };
    }

    if (!modalOpts) {
      console.error(
        "開発者の設定ミス：data-pusyuu-notice=\"" + presetName + "\" に対応するプリセットが無く、" +
        "data-pusyuu-notice-embed / data-body-html による指定もありません。通常のリンク遷移を続行します。"
      );
      return; // 内容が無い場合はモーダルを出さず、通常のリンク遷移をそのまま許可する
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    showModal({
      title: modalOpts.title,
      bodyHtml: modalOpts.bodyHtml,
      iframeSrc: modalOpts.iframeSrc,
      closeText: TRIGGER_CLOSE_TEXT,
      rememberDismiss: false
    });
  }, false);
});
